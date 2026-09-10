import z from "zod";

export const runJobSchema = z.object({
  runId: z.string().uuid(),
});

export type RunJobInput = z.infer<typeof runJobSchema>;

export const documentProcessingJobSchema = z.object({
  processingJobId: z.string().uuid(),
});

export type DocumentProcessingJobInput = z.infer<
  typeof documentProcessingJobSchema
>;
