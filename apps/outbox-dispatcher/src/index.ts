import {
  closeOutboxDispatcher,
  createOutboxDispatcher,
  dispatchNextOutboxEvent,
} from "./dispatcher";
import { env } from "./env";

const dispatcher = createOutboxDispatcher(env);
let shuttingDown = false;

function sleep(duration: number) {
  return new Promise((resolve) => setTimeout(resolve, duration));
}

async function shutdown() {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  await closeOutboxDispatcher(dispatcher);
}

process.on("SIGINT", () => {
  void shutdown();
});
process.on("SIGTERM", () => {
  void shutdown();
});

while (!shuttingDown) {
  const outcome = await dispatchNextOutboxEvent(dispatcher);

  if (outcome !== "sent") {
    await sleep(env.OUTBOX_POLL_INTERVAL_MS);
  }
}
