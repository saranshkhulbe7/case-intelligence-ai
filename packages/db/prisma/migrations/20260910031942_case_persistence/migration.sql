CREATE TYPE "CaseStatus" AS ENUM ('ACTIVE', 'CLOSED');

CREATE TABLE "Case" (
    "id" UUID NOT NULL,
    "caseNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "CaseStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Case_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Case_caseNumber_key" ON "Case"("caseNumber");

CREATE INDEX "Case_createdById_updatedAt_idx" ON "Case"("createdById", "updatedAt");

ALTER TABLE "Case" ADD CONSTRAINT "Case_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
