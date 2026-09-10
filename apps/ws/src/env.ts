import { z } from "zod";

const envSchema = z.object({
  WS_PORT: z.coerce.number().int().positive().default(4500),
  WS_INSTANCE_ID: z.string().min(1).default("ws-local-1"),
  REDIS_URL: z.string().url(),
  FRONTEND_ORIGINS: z
    .string()
    .min(1)
    .transform((value) => {
      return value
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean);
    })
    .pipe(z.array(z.string().url()).min(1)),
});

export type Env = z.infer<typeof envSchema>;

export const env = envSchema.parse(process.env);
