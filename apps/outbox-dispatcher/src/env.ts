import { hostname } from "node:os";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().url(),
  OUTBOX_DISPATCHER_ID: z
    .string()
    .min(1)
    .default(`outbox-${hostname()}-${process.pid}`),
  OUTBOX_POLL_INTERVAL_MS: z.coerce.number().int().positive().default(1_000),
  OUTBOX_LOCK_TIMEOUT_SECONDS: z.coerce.number().int().positive().default(60),
});

export type Env = z.infer<typeof envSchema>;

export const env = envSchema.parse(process.env);
