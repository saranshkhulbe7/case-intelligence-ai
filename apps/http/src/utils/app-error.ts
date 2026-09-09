import type { StatusCode } from "hono/utils/http-status";

export class AppError extends Error {
  constructor(
    public statusCode: StatusCode,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}
