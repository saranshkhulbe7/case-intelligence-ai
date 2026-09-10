import { encodeServerEvent } from "@case-intelligence/contracts/ws";
import type { WSContext } from "hono/ws";
import { ZodError } from "zod";

function sendError(ws: WSContext, code: string, message: string) {
  ws.send(
    encodeServerEvent({
      event: "ERROR",
      data: { code, message },
    }),
  );
}

function handleMessageError(error: unknown, ws: WSContext) {
  console.error("[WS] message error", error);
  if (error instanceof SyntaxError) {
    sendError(ws, "INVALID_JSON", "Message must be valid JSON");
    return;
  }
  if (error instanceof ZodError) {
    sendError(ws, "INVALID_EVENT", "Message does not match the WS contract");
    return;
  }
  sendError(ws, "INTERNAL_ERROR", "Something went wrong");
}

export function withMessageErrorHandler(
  handler: (event: MessageEvent, ws: WSContext) => Promise<void> | void,
) {
  return async (event: MessageEvent, ws: WSContext) => {
    try {
      await handler(event, ws);
    } catch (error) {
      handleMessageError(error, ws);
    }
  };
}
