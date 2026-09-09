import type { Context } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
const ACCESS_TOKEN_COOKIE_NAME = "access-token";

type CookieContext = {
  req: unknown;
};

type AuthCookieOptions = {
  secure: boolean;
  ttlSeconds: number;
};

export function createAuthCookies(options: AuthCookieOptions) {
  return {
    getAuthCookie(c: CookieContext) {
      return getCookie(c as Context, ACCESS_TOKEN_COOKIE_NAME);
    },

    setAuthCookie(c: CookieContext, token: string) {
      setCookie(c as Context, ACCESS_TOKEN_COOKIE_NAME, token, {
        httpOnly: true,
        secure: options.secure,
        sameSite: "Lax",
        path: "/",
        maxAge: options.ttlSeconds,
      });
    },

    deleteAuthCookie(c: CookieContext) {
      deleteCookie(c as Context, ACCESS_TOKEN_COOKIE_NAME, {
        path: "/",
      });
    },
  };
}

export type AuthCookies = ReturnType<typeof createAuthCookies>;
