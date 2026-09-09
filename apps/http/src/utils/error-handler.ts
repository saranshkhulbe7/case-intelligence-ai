import { Prisma } from "@agent-platform/db/client";
import { TRPCError } from "@trpc/server";
import type { StatusCode } from "hono/utils/http-status";
import { ZodError } from "zod";
import { AppError } from "./app-error";

const statusToTrpcCode: Partial<Record<StatusCode, TRPCError["code"]>> = {
  400: "BAD_REQUEST",
  401: "UNAUTHORIZED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  409: "CONFLICT",
};

export function toTrpcError(error: unknown): TRPCError {
  const cause = error instanceof TRPCError ? error.cause : error;

  if (cause instanceof AppError) {
    return new TRPCError({
      code: statusToTrpcCode[cause.statusCode] ?? "INTERNAL_SERVER_ERROR",
      message: cause.message,
      cause,
    });
  }

  if (cause instanceof ZodError) {
    console.error(cause);

    const message = cause.issues
      .map((issue) => {
        const path = issue.path.join(".");
        return path ? `${path}: ${issue.message}` : issue.message;
      })
      .join(", ");

    return new TRPCError({
      code: "BAD_REQUEST",
      message,
      cause,
    });
  }

  if (
    cause instanceof Prisma.PrismaClientKnownRequestError &&
    cause.code === "P2002"
  ) {
    return new TRPCError({
      code: "CONFLICT",
      message: "Resource already exists",
      cause,
    });
  }

  if (error instanceof TRPCError) {
    return error;
  }

  console.error("Unhandled application error", error);

  return new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "Something went wrong",
    cause: error,
  });
}
