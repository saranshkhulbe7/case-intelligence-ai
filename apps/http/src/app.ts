import { Hono } from "hono";
import { cors } from "hono/cors";
import { trpcServer } from "@hono/trpc-server";
import type { Env } from "../env";
import { appRouter } from "./router";
import { createTrpcContext } from "./utils/context";

export function createHttpApp(env: Env) {
  const app = new Hono();

  app.get("/health", (c) => {
    return c.json({
      ok: true,
      service: "http",
    });
  });

  app.use(
    "/trpc/*",
    cors({
      origin: env.FRONTEND_ORIGINS,
      credentials: true,
    }),
  );

  app.use(
    "/trpc/*",
    trpcServer({
      router: appRouter,
      createContext: (_options, c) => createTrpcContext(c, env),
    }),
  );

  app.notFound((c) => {
    return c.json({ error: "Route not found" }, 404);
  });

  app.onError((error, c) => {
    console.error("Unhandled HTTP error", error);
    return c.json(
      {
        error: "Internal server error",
      },
      500,
    );
  });

  return app;
}
