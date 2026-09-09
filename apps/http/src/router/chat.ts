import z from "zod";
import { getChat, listChats, sendMessage } from "../services/chat.service";
import { protectedProcedure, router } from "../utils/trpc";
import { sendMessageInputSchema } from "@agent-platform/contracts/chat";

export const chatRouter = router({
  list: protectedProcedure.query(({ ctx }) => {
    return listChats(ctx.authUser.id);
  }),
  get: protectedProcedure
    .input(
      z.object({
        chatId: z.string().uuid(),
      }),
    )
    .query(({ ctx, input }) => {
      return getChat(ctx.authUser.id, input.chatId);
    }),
  sendMessage: protectedProcedure
    .input(sendMessageInputSchema)
    .mutation(({ ctx, input }) => {
      return sendMessage(
        ctx.authUser.id,
        input.chatId,
        input.clientMessageId,
        input.content,
      );
    }),
});
