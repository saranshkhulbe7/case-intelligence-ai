CREATE TYPE "RunStatus" AS ENUM ('QUEUED', 'RUNNING', 'WAITING_FOR_USER', 'COMPLETED', 'FAILED', 'CANCELLED');

CREATE TYPE "RunEventType" AS ENUM ('RUN_CREATED', 'RUN_STARTED', 'RUN_ACTIVITY', 'QUESTION_GROUP_CREATED', 'QUESTION_GROUP_SUBMITTED', 'RUN_COMPLETED', 'RUN_FAILED', 'RUN_CANCELLED');

CREATE TYPE "QuestionResponseType" AS ENUM ('ANSWERED', 'SKIPPED');

CREATE TABLE "Run" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "prompt" TEXT NOT NULL,
    "status" "RunStatus" NOT NULL DEFAULT 'QUEUED',
    "result" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Run_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RunEvent" (
    "id" UUID NOT NULL,
    "runId" UUID NOT NULL,
    "type" "RunEventType" NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RunEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RunQuestionGroup" (
    "id" UUID NOT NULL,
    "runId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),

    CONSTRAINT "RunQuestionGroup_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RunQuestion" (
    "id" UUID NOT NULL,
    "groupId" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "question" TEXT NOT NULL,
    "options" TEXT[],
    "responseType" "QuestionResponseType",
    "answer" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RunQuestion_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Run_userId_createdAt_idx" ON "Run"("userId", "createdAt");

CREATE INDEX "RunEvent_runId_createdAt_idx" ON "RunEvent"("runId", "createdAt");

CREATE INDEX "RunQuestionGroup_runId_createdAt_idx" ON "RunQuestionGroup"("runId", "createdAt");

CREATE INDEX "RunQuestion_groupId_position_idx" ON "RunQuestion"("groupId", "position");

CREATE UNIQUE INDEX "RunQuestion_groupId_position_key" ON "RunQuestion"("groupId", "position");

ALTER TABLE "Run" ADD CONSTRAINT "Run_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RunEvent" ADD CONSTRAINT "RunEvent_runId_fkey" FOREIGN KEY ("runId") REFERENCES "Run"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RunQuestionGroup" ADD CONSTRAINT "RunQuestionGroup_runId_fkey" FOREIGN KEY ("runId") REFERENCES "Run"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RunQuestion" ADD CONSTRAINT "RunQuestion_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "RunQuestionGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
