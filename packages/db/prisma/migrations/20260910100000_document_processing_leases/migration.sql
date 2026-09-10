ALTER TABLE "DocumentProcessingJob"
ADD COLUMN "leaseToken" UUID,
ADD COLUMN "leaseOwner" TEXT,
ADD COLUMN "leaseExpiresAt" TIMESTAMP(3);

CREATE INDEX "DocumentProcessingJob_status_leaseExpiresAt_idx"
ON "DocumentProcessingJob"("status", "leaseExpiresAt");
