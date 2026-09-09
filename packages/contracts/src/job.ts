import z from "zod";

export const runJobSchema = z.object({
  runId: z.string().uuid(),
});

export type RunJobInput = z.infer<typeof runJobSchema>;
