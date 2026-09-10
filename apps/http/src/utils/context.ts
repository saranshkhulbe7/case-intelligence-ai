import { verify } from "@case-intelligence/auth/jwt";
import { Context } from "hono";
import { authCookieUtils } from "./cookies/auth";
import type { Env } from "../../env";

export function createTrpcContext(c: Context, appEnv: Env) {
  const token = authCookieUtils.getAuthCookie(c);
  const authUser = token
    ? verify({ token }, { secret: appEnv.JWT_SECRET })
    : null;
  return {
    c,
    appEnv,
    authUser,
  };
}

export type TrpcContext = ReturnType<typeof createTrpcContext>;
