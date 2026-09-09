import { AppError } from "../utils/app-error";
import { db } from "../utils/db";

export async function cancelRun(userId: string, runId: string) {
  return db.$transaction(async (tx) => {
    const current = await tx.run.findFirst({
      where: {
        id: runId,
        chat: {
          userId,
        },
      },
    });

    if (!current) {
      throw new AppError(404, "Run not found");
    }
    if (["COMPLETED", "FAILED", "CANCELLED"].includes(current.status)) {
      return current;
    }
    const cancelled = await tx.run.updateMany({
      where: {
        id: runId,
        status: {
          in: ["QUEUED", "RUNNING", "WAITING_FOR_USER"],
        },
      },
      data: {
        status: "CANCELLED",
        completedAt: new Date(),
      },
    });
    if (cancelled.count === 0) {
      return tx.run.findUniqueOrThrow({
        where: {
          id: runId,
        },
      });
    }

    if (current.assistantMessageId) {
      await tx.message.updateMany({
        where: {
          id: current.assistantMessageId,
          status: "STREAMING",
        },
        data: {
          status: "CANCELLED",
        },
      });
    }
    await tx.chat.updateMany({
      where: {
        id: current.chatId,
        activeRunId: runId,
      },
      data: {
        activeRunId: null,
      },
    });

    await tx.runEvent.create({
      data: {
        runId,
        type: "RUN_CANCELLED",
        message: "Run cancelled",
      },
    });
    return tx.run.findUniqueOrThrow({
      where: {
        id: runId,
      },
    });
  });
}
