import z from "zod";
import { createCase, getCase, listCases } from "../services/case.service";
import { protectedProcedure, router } from "../utils/trpc";

export const caseRouter = router({
  list: protectedProcedure.query(({ ctx }) => {
    return listCases(ctx.authUser.id);
  }),
  get: protectedProcedure
    .input(
      z.object({
        caseId: z.string().uuid(),
      }),
    )
    .query(({ ctx, input }) => {
      return getCase(ctx.authUser.id, input.caseId);
    }),
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().trim().min(1).max(160),
        description: z
          .string()
          .trim()
          .max(2_000)
          .optional()
          .transform((value) => value || undefined),
      }),
    )
    .mutation(({ ctx, input }) => {
      return createCase(ctx.authUser.id, input);
    }),
});
