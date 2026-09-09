import { initTRPC, TRPCError } from "@trpc/server";

import superjson from "superjson";
import { toTrpcError } from "./error-handler";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({ transformer: superjson });

const errorMiddleware = t.middleware(async ({ next }) => {
  const result = await next();
  if (!result.ok) {
    throw toTrpcError(result.error);
  }
  return result;
});

const authMiddleware = t.middleware(({ ctx, next }) => {
  if (!ctx.authUser) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  }
  return next({
    ctx: {
      ...ctx,
      authUser: ctx.authUser,
    },
  });
});

export const router = t.router;
export const publicProcedure = t.procedure.use(errorMiddleware);
export const protectedProcedure = publicProcedure.use(authMiddleware);
