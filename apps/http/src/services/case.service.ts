import { randomUUID } from "node:crypto";
import { Prisma } from "@agent-platform/db/client";
import { AppError } from "../utils/app-error";
import { db } from "../utils/db";

const CASE_NUMBER_ATTEMPTS = 5;

const caseSelect = {
  id: true,
  caseNumber: true,
  name: true,
  description: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CaseSelect;

function generateCaseNumber() {
  return `CS-${randomUUID().replaceAll("-", "").slice(0, 6).toUpperCase()}`;
}

function isCaseNumberConflict(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

export async function listCases(userId: string) {
  return db.case.findMany({
    where: {
      createdById: userId,
    },
    orderBy: {
      updatedAt: "desc",
    },
    select: caseSelect,
  });
}

export async function getCase(userId: string, caseId: string) {
  const caseItem = await db.case.findFirst({
    where: {
      id: caseId,
      createdById: userId,
    },
    select: caseSelect,
  });

  if (!caseItem) {
    throw new AppError(404, "Case not found");
  }

  return caseItem;
}

export async function createCase(
  userId: string,
  input: {
    name: string;
    description?: string;
  },
) {
  for (let attempt = 0; attempt < CASE_NUMBER_ATTEMPTS; attempt += 1) {
    try {
      return await db.case.create({
        data: {
          name: input.name,
          description: input.description,
          caseNumber: generateCaseNumber(),
          createdById: userId,
        },
        select: caseSelect,
      });
    } catch (error) {
      if (!isCaseNumberConflict(error)) {
        throw error;
      }
    }
  }

  throw new AppError(409, "Unable to allocate a case number");
}
