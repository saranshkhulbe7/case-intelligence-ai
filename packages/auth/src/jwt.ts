import jwt from "jsonwebtoken";
import {
  type PublicUser,
  publicUserSchema,
} from "@case-intelligence/contracts/user";

type TokenOptions = {
  secret: string;
};

type SignTokenOptions = TokenOptions & {
  ttlSeconds: number;
};

export function sign(
  { user }: { user: PublicUser },
  { secret, ttlSeconds }: SignTokenOptions,
) {
  return jwt.sign(user, secret, {
    expiresIn: ttlSeconds,
  });
}

export function verify({ token }: { token: string }, { secret }: TokenOptions) {
  try {
    const payload = jwt.verify(token, secret);
    const parsed = publicUserSchema.safeParse(payload);
    if (!parsed.success) {
      return null;
    }
    return {
      id: parsed.data.id,
      name: parsed.data.name,
      email: parsed.data.email,
    };
  } catch {
    return null;
  }
}
