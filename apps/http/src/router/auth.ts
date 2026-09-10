import z from "zod";

import { loginService, signupService } from "../services/auth.service";
import { sign } from "@case-intelligence/auth/jwt";
import { protectedProcedure, publicProcedure, router } from "../utils/trpc";
import { authCookieUtils } from "../utils/cookies/auth";
import { getRedisClient } from "../utils/redis";

export const authRouter = router({
  signup: publicProcedure
    .input(
      z.object({
        name: z.string().trim().min(1),
        email: z.string().trim().email(),
        password: z.string().trim().min(8),
      }),
    )
    .mutation(async ({ input }) => {
      const user = await signupService(input.name, input.email, input.password);
      return { user };
    }),
  login: publicProcedure
    .input(
      z.object({
        email: z.string().trim().email(),
        password: z.string().trim().min(8),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const user = await loginService(input.email, input.password);
      const token = sign(
        { user },
        {
          secret: ctx.appEnv.JWT_SECRET,
          ttlSeconds: ctx.appEnv.ACCESS_TOKEN_TTL_SECONDS,
        },
      );
      authCookieUtils.setAuthCookie(ctx.c, token);
      return { user };
    }),
  me: publicProcedure.query(async ({ ctx }) => {
    return {
      user: ctx.authUser,
    };
  }),
  logout: publicProcedure.mutation(async ({ ctx }) => {
    authCookieUtils.deleteAuthCookie(ctx.c);
    return {
      ok: "true",
      message: "logout successful",
    };
  }),
  createWsTicket: protectedProcedure.mutation(async ({ ctx }) => {
    const ticket = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 30_000).toISOString();
    const redis = await getRedisClient();

    await redis.set(`ws-ticket:${ticket}`, JSON.stringify(ctx.authUser), {
      EX: 30,
    });

    return {
      ticket,
      expiresAt,
    };
  }),
});
