import type { RunJobInput } from "@agent-platform/contracts/job";
import IORedis from "ioredis";
import { Queue } from "bullmq";

export const RUN_QUEUE_NAME = "runs";
export const RUN_JOB_NAME = "execute-run";

export type RunQueue = Queue<RunJobInput>;

export function createQueue(redisUrl: string) {
  const connection = new IORedis(redisUrl, {
    maxRetriesPerRequest: 1,
  });
  const queue = new Queue<RunJobInput>(RUN_QUEUE_NAME, {
    connection,
  });
  return {
    queue,
    connection,
  };
}

export function enqueueRun(
  queue: RunQueue,
  input: RunJobInput,
  deliveryId: string,
) {
  return queue.add(RUN_JOB_NAME, input, {
    jobId: deliveryId,
  });
}
