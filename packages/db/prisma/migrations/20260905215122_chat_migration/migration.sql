CREATE TYPE "MessageRole" AS ENUM ('USER', 'ASSISTANT');

CREATE TYPE "MessageStatus" AS ENUM ('STREAMING', 'COMPLETED', 'FAILED', 'CANCELLED');

ALTER TABLE "Run" DROP CONSTRAINT "Run_userId_fkey";

DROP INDEX "Run_userId_createdAt_idx";

ALTER TABLE "Run" DROP COLUMN "prompt",
DROP COLUMN "result",
DROP COLUMN "userId",
ADD COLUMN     "assistantMessageId" UUID,
ADD COLUMN     "chatId" UUID NOT NULL,
ADD COLUMN     "triggerMessageId" UUID NOT NULL;

ALTER TABLE "RunQuestion" ALTER COLUMN "answer" DROP NOT NULL;

CREATE TABLE "Chat" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "title" TEXT,
    "activeRunId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chat_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Message" (
    "id" UUID NOT NULL,
    "chatId" UUID NOT NULL,
    "clientMessageId" UUID,
    "role" "MessageRole" NOT NULL,
    "status" "MessageStatus" NOT NULL DEFAULT 'COMPLETED',
    "content" TEXT NOT NULL DEFAULT '',
    "streamSequence" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Chat_activeRunId_key" ON "Chat"("activeRunId");

CREATE INDEX "Chat_userId_updatedAt_idx" ON "Chat"("userId", "updatedAt");

CREATE UNIQUE INDEX "Message_clientMessageId_key" ON "Message"("clientMessageId");

CREATE INDEX "Message_chatId_createdAt_idx" ON "Message"("chatId", "createdAt");

CREATE UNIQUE INDEX "Run_triggerMessageId_key" ON "Run"("triggerMessageId");

CREATE UNIQUE INDEX "Run_assistantMessageId_key" ON "Run"("assistantMessageId");

CREATE INDEX "Run_chatId_createdAt_idx" ON "Run"("chatId", "createdAt");

ALTER TABLE "Chat" ADD CONSTRAINT "Chat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Chat" ADD CONSTRAINT "Chat_activeRunId_fkey" FOREIGN KEY ("activeRunId") REFERENCES "Run"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Message" ADD CONSTRAINT "Message_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Run" ADD CONSTRAINT "Run_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Run" ADD CONSTRAINT "Run_triggerMessageId_fkey" FOREIGN KEY ("triggerMessageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Run" ADD CONSTRAINT "Run_assistantMessageId_fkey" FOREIGN KEY ("assistantMessageId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;
