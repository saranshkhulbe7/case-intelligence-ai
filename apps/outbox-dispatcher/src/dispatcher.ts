import {
  documentProcessingJobSchema,
  runJobSchema,
} from "@case-intelligence/contracts/job";
import { createDatabase, Prisma } from "@case-intelligence/db/client";
import {
  createDocumentProcessingQueue,
  enqueueDocumentProcessing,
} from "@case-intelligence/queue/document-processing.queue";
import { createQueue, enqueueRun } from "@case-intelligence/queue/run.queue";
import type { Env } from "./env";

type ClaimedOutboxEvent = {
  id: string;
  type: "ENQUEUE_RUN" | "ENQUEUE_DOCUMENT_PROCESSING";
  payload: Prisma.JsonValue;
};

export type DispatchOutcome = "idle" | "sent" | "failed";

export function createOutboxDispatcher(appEnv: Env) {
  const database = createDatabase(appEnv.DATABASE_URL);
  const documentProcessingQueue = createDocumentProcessingQueue(appEnv.REDIS_URL);
  const runQueue = createQueue(appEnv.REDIS_URL);

  return {
    appEnv,
    database,
    documentProcessingQueue,
    runQueue,
  };
}

type OutboxDispatcher = ReturnType<typeof createOutboxDispatcher>;

function sanitizeError(error: unknown) {
  const message = error instanceof Error ? error.message : "Queue publish failed";

  return message
    .replace(/\b[a-z][a-z\d+.-]*:\/\/\S+/gi, "[redacted]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 240) || "Queue publish failed";
}

async function claimNextOutboxEvent(dispatcher: OutboxDispatcher) {
  const staleBefore = new Date(
    Date.now() - dispatcher.appEnv.OUTBOX_LOCK_TIMEOUT_SECONDS * 1_000,
  );

  return dispatcher.database.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      SELECT "id"
      FROM "OutboxEvent"
      WHERE "status" = 'PENDING'
        OR ("status" = 'PROCESSING' AND "lockedAt" < ${staleBefore})
      ORDER BY "createdAt" ASC
      FOR UPDATE SKIP LOCKED
      LIMIT 1
    `);
    const row = rows[0];

    if (!row) {
      return null;
    }

    return tx.outboxEvent.update({
      where: {
        id: row.id,
      },
      data: {
        status: "PROCESSING",
        lockedAt: new Date(),
        lockedBy: dispatcher.appEnv.OUTBOX_DISPATCHER_ID,
        attempts: {
          increment: 1,
        },
        lastError: null,
      },
      select: {
        id: true,
        type: true,
        payload: true,
      },
    });
  });
}

async function publishOutboxEvent(
  dispatcher: OutboxDispatcher,
  event: ClaimedOutboxEvent,
) {
  if (event.type === "ENQUEUE_DOCUMENT_PROCESSING") {
    const input = documentProcessingJobSchema.parse(event.payload);
    await enqueueDocumentProcessing(dispatcher.documentProcessingQueue.queue, input);
    return;
  }

  const input = runJobSchema.parse(event.payload);
  await enqueueRun(dispatcher.runQueue.queue, input, event.id);
}

async function markOutboxEventSent(
  dispatcher: OutboxDispatcher,
  eventId: string,
) {
  await dispatcher.database.outboxEvent.updateMany({
    where: {
      id: eventId,
      status: "PROCESSING",
      lockedBy: dispatcher.appEnv.OUTBOX_DISPATCHER_ID,
    },
    data: {
      status: "SENT",
      sentAt: new Date(),
      lockedAt: null,
      lockedBy: null,
      lastError: null,
    },
  });
}

async function returnOutboxEventToPending(
  dispatcher: OutboxDispatcher,
  eventId: string,
  error: unknown,
) {
  await dispatcher.database.outboxEvent.updateMany({
    where: {
      id: eventId,
      status: "PROCESSING",
      lockedBy: dispatcher.appEnv.OUTBOX_DISPATCHER_ID,
    },
    data: {
      status: "PENDING",
      lockedAt: null,
      lockedBy: null,
      lastError: sanitizeError(error),
    },
  });
}

export async function dispatchNextOutboxEvent(dispatcher: OutboxDispatcher) {
  const event = await claimNextOutboxEvent(dispatcher);

  if (!event) {
    return "idle" as const;
  }

  try {
    await publishOutboxEvent(dispatcher, event);
    await markOutboxEventSent(dispatcher, event.id);
    return "sent" as const;
  } catch (error) {
    await returnOutboxEventToPending(dispatcher, event.id, error);
    return "failed" as const;
  }
}

export async function closeOutboxDispatcher(dispatcher: OutboxDispatcher) {
  await Promise.all([
    dispatcher.documentProcessingQueue.queue.close(),
    dispatcher.runQueue.queue.close(),
  ]);
  await Promise.all([
    dispatcher.documentProcessingQueue.connection.quit(),
    dispatcher.runQueue.connection.quit(),
  ]);
  await dispatcher.database.$disconnect();
}
