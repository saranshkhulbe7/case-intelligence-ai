CREATE TYPE "OutboxStatus" AS ENUM ('PENDING', 'SENT');

CREATE TYPE "OutboxType" AS ENUM ('ENQUEUE_RUN');

CREATE TABLE "OutboxEvent" (
    "id" UUID NOT NULL,
    "type" "OutboxType" NOT NULL,
    "status" "OutboxStatus" NOT NULL DEFAULT 'PENDING',
    "payload" JSONB NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),

    CONSTRAINT "OutboxEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OutboxEvent_status_createdAt_idx" ON "OutboxEvent"("status", "createdAt");
