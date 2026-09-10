import { createAuthCookies } from "@case-intelligence/auth/cookie";
import { env } from "../../../env";

export const authCookieUtils = createAuthCookies({
  secure: env.COOKIE_SECURE,
  ttlSeconds: env.ACCESS_TOKEN_TTL_SECONDS,
});
