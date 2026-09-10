import { websocket } from "hono/bun";
import { createWsApp } from "./app";
import { env } from "./env";
import { closeRedisClient } from "./redis";

const app = createWsApp(env);

const server = Bun.serve({
  port: env.WS_PORT,
  fetch: app.fetch,
  websocket,
});

console.log(`WS server started on ws://localhost:${env.WS_PORT}/ws`);

let shuttingDown = false;

async function shutdown() {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  server.stop();
  await closeRedisClient();
  process.exit(0);
}

process.on("SIGINT", () => {
  void shutdown();
});
process.on("SIGTERM", () => {
  void shutdown();
});
