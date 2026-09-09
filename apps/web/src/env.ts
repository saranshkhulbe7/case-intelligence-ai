import { z } from "zod";

const envSchema = z.object({
  VITE_HTTP_URL: z.string().min(1),
  VITE_WS_URL: z.string().min(1),
});

export const env = envSchema.parse(import.meta.env);
