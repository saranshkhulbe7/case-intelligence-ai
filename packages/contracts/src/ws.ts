import z from "zod";

export const clientWsEventSchema = z.discriminatedUnion("event", [
  z.object({
    event: z.literal("PING"),
    data: z.object({
      sentAt: z.string(),
    }),
  }),
]);

export type ClientWsEvent = z.infer<typeof clientWsEventSchema>;

export const serverWsEventSchema = z.discriminatedUnion("event", [
  z.object({
    event: z.literal("CONNECTED"),
    data: z.object({
      connectionId: z.string(),
      serverId: z.string(),
      connectedAt: z.string(),
    }),
  }),

  z.object({
    event: z.literal("PONG"),
    data: z.object({
      sentAt: z.string(),
      receivedAt: z.string(),
    }),
  }),

  z.object({
    event: z.literal("ERROR"),
    data: z.object({
      code: z.string(),
      message: z.string(),
    }),
  }),
]);

export type ServerWsEvent = z.infer<typeof serverWsEventSchema>;

export function decodeClientEvent(data: string) {
  return clientWsEventSchema.parse(JSON.parse(data));
}

export function encodeServerEvent(event: ServerWsEvent) {
  return JSON.stringify(event);
}

export function decodeServerEvent(data: string) {
  return serverWsEventSchema.parse(JSON.parse(data));
}
