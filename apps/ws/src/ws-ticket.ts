import { publicUserSchema } from "@case-intelligence/contracts/user";
import { z } from "zod";
import { getRedisClient } from "./redis";

const ticketSchema = z.string().uuid();

export async function consumeWsTicket(ticket: string | undefined) {
  const parsedTicket = ticketSchema.safeParse(ticket);
  if (!parsedTicket.success) {
    return null;
  }

  const redis = await getRedisClient();
  const payload = await redis.getDel(`ws-ticket:${parsedTicket.data}`);
  if (!payload) {
    return null;
  }

  try {
    const parsedUser = publicUserSchema.safeParse(JSON.parse(payload));
    return parsedUser.success ? parsedUser.data : null;
  } catch {
    return null;
  }
}
