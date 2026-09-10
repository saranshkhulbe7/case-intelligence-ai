import { createClient } from "redis";
import { env } from "../../env";

const redis = createClient({
  url: env.REDIS_URL,
});

let connectPromise: Promise<unknown> | null = null;

redis.on("error", () => {
  console.error("Redis client error");
});

export async function getRedisClient() {
  if (redis.isReady) {
    return redis;
  }

  if (!redis.isOpen) {
    connectPromise ??= redis.connect();
    try {
      await connectPromise;
    } catch {
      connectPromise = null;
      throw new Error("Redis connection unavailable");
    }
  }

  return redis;
}

export async function closeRedisClient() {
  if (redis.isOpen) {
    await redis.quit();
  }
}
