import { z } from "zod";

export const messageRoleSchema = z.enum(["USER", "ASSISTANT"]);

export const messageStatusSchema = z.enum([
  "STREAMING",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
]);

export const sendMessageInputSchema = z.object({
  chatId: z.string().uuid().nullable(),
  clientMessageId: z.string().uuid(),
  content: z.string().trim().min(1).max(20_000),
});

export type MessageRole = z.infer<typeof messageRoleSchema>;
export type MessageStatus = z.infer<typeof messageStatusSchema>;
export type SendMessageInput = z.infer<typeof sendMessageInputSchema>;
