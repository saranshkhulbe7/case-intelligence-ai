import type { DocumentProcessingJobInput } from "@agent-platform/contracts/job";
import { Queue } from "bullmq";
import IORedis from "ioredis";

export const DOCUMENT_PROCESSING_QUEUE_NAME = "document-processing";
export const DOCUMENT_PROCESSING_JOB_NAME = "process-document";
export const DOCUMENT_PROCESSING_JOB_RETENTION_SECONDS = 7 * 24 * 60 * 60;
export const DOCUMENT_PROCESSING_JOB_RETENTION_COUNT = 1_000;

export type DocumentProcessingQueue = Queue<DocumentProcessingJobInput>;

export function createDocumentProcessingQueue(redisUrl: string) {
  const connection = new IORedis(redisUrl, {
    maxRetriesPerRequest: 1,
  });
  const queue = new Queue<DocumentProcessingJobInput>(
    DOCUMENT_PROCESSING_QUEUE_NAME,
    {
      connection,
    },
  );

  return {
    queue,
    connection,
  };
}

export function getDocumentProcessingJobId(processingJobId: string) {
  return `document-processing-${processingJobId}`;
}

export function enqueueDocumentProcessing(
  queue: DocumentProcessingQueue,
  input: DocumentProcessingJobInput,
) {
  const jobId = getDocumentProcessingJobId(input.processingJobId);

  return queue.add(DOCUMENT_PROCESSING_JOB_NAME, input, {
    jobId,
    deduplication: {
      id: jobId,
    },
    removeOnComplete: {
      age: DOCUMENT_PROCESSING_JOB_RETENTION_SECONDS,
      count: DOCUMENT_PROCESSING_JOB_RETENTION_COUNT,
    },
    removeOnFail: {
      age: DOCUMENT_PROCESSING_JOB_RETENTION_SECONDS,
      count: DOCUMENT_PROCESSING_JOB_RETENTION_COUNT,
    },
  });
}
