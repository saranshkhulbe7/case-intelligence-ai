import { websocket } from "hono/bun";
import { createWsApp } from "./app";
import { env } from "./env";

const app = createWsApp(env);

const server = Bun.serve({
  port: env.WS_PORT,
  fetch: app.fetch,
  websocket,
});

console.log(`WS server started on ws://localhost:${env.WS_PORT}/ws`);

function shutdown() {
  server.stop();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
