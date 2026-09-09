import { z } from "zod";

const envSchema = z.object({
  WS_PORT: z.coerce.number().int().positive().default(5001),
  WS_INSTANCE_ID: z.string().min(1).default("ws-local-1"),
  JWT_SECRET: z.string().min(32),
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
  ACCESS_TOKEN_TTL_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .default(60 * 60 * 24 * 7),

  COOKIE_SECURE: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
});

export type Env = z.infer<typeof envSchema>;

export const env = envSchema.parse(process.env);
