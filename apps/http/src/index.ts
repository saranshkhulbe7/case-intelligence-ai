import { env } from "../env";
import { createHttpApp } from "./app";
import { db } from "./utils/db";

const app = createHttpApp(env);

const server = Bun.serve({
  port: env.HTTP_PORT,
  fetch: app.fetch,
});
console.log(`Server started at port ${env.HTTP_PORT}`);

async function shutdown() {
  server.stop();
  await db.$disconnect();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
