import z from "zod";

export const runStatusSchema = z.enum([
  "QUEUED",
  "RUNNING",
  "WAITING_FOR_USER",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
]);

export const runEventTypeSchema = z.enum([
  "RUN_CREATED",
  "RUN_STARTED",
  "RUN_ACTIVITY",
  "QUESTION_GROUP_CREATED",
  "QUESTION_GROUP_SUBMITTED",
  "RUN_COMPLETED",
  "RUN_FAILED",
  "RUN_CANCELLED",
]);

export const questionResponseTypeSchema = z.enum(["ANSWERED", "SKIPPED"]);

export const questionResponseSchema = z.discriminatedUnion("responseType", [
  z.object({
    responseType: z.literal("ANSWERED"),
    questionId: z.string().uuid(),
    answer: z.string().trim().min(1),
  }),
  z.object({
    responseType: z.literal("SKIPPED"),
    questionId: z.string().uuid(),
    answer: z.null(),
  }),
]);

export const submitQuestionGroupSchema = z.object({
  groupId: z.string().uuid(),
  responses: z.array(questionResponseSchema).min(1),
});

export type RunStatus = z.infer<typeof runStatusSchema>;
export type RunEventType = z.infer<typeof runEventTypeSchema>;
export type QuestionResponseType = z.infer<typeof questionResponseTypeSchema>;
export type QuestionResponse = z.infer<typeof questionResponseSchema>;
export type SubmitQuestionGroupInput = z.infer<
  typeof submitQuestionGroupSchema
>;
