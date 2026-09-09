import z from "zod";

export const publicUserSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
});

export type PublicUser = z.infer<typeof publicUserSchema>;
