import z from "zod";
import { protectedProcedure, router } from "../utils/trpc";
import { cancelRun } from "../services/run.service";

export const runRouter = router({
  cancel: protectedProcedure
    .input(
      z.object({
        runId: z.string().uuid(),
      }),
    )
    .mutation(({ ctx, input }) => {
      return cancelRun(ctx.authUser.id, input.runId);
    }),
});
