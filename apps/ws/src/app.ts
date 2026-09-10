import type { PublicUser } from "@case-intelligence/contracts/user";
import {
  decodeClientEvent,
  encodeServerEvent,
} from "@case-intelligence/contracts/ws";
import { Hono } from "hono";
import { upgradeWebSocket } from "hono/bun";
import type { Env } from "./env";
import { withMessageErrorHandler } from "./message-error-handler";
import { consumeWsTicket } from "./ws-ticket";

type WsVariables = {
  authUser: PublicUser;
};

export function createWsApp(env: Env) {
  const app = new Hono<{ Variables: WsVariables }>();

  app.get("/health", (c) => {
    return c.json({
      ok: true,
      service: "ws",
    });
  });

  app.use("/ws", async (c, next) => {
    const origin = c.req.header("Origin");
    if (!origin || !env.FRONTEND_ORIGINS.includes(origin)) {
      return c.text("Forbidden origin", 403);
    }

    let user: PublicUser | null;
    try {
      user = await consumeWsTicket(c.req.query("ticket"));
    } catch {
      return c.text("Authentication unavailable", 503);
    }

    if (!user) {
      return c.text("Authentication required", 401);
    }

    c.set("authUser", user);
    await next();
  });

  app.get(
    "/ws",
    upgradeWebSocket(() => {
      const connectionId = crypto.randomUUID();

      return {
        onOpen(_event, ws) {
          ws.send(
            encodeServerEvent({
              event: "CONNECTED",
              data: {
                serverId: env.WS_INSTANCE_ID,
                connectionId,
                connectedAt: new Date().toISOString(),
              },
            }),
          );
        },

        onMessage: withMessageErrorHandler((event, ws) => {
          const message = decodeClientEvent(String(event.data));

          if (message.event === "PING") {
            ws.send(
              encodeServerEvent({
                event: "PONG",
                data: {
                  sentAt: message.data.sentAt,
                  receivedAt: new Date().toISOString(),
                },
              }),
            );
          }
        }),

        onClose() {},
        onError(error) {
          console.error("[WS] transport error", error);
        },
      };
    }),
  );

  return app;
}
