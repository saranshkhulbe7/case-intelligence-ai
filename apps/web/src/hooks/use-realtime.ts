import { useEffect, useRef, useState } from "react";
import { env } from "../env";
import {
  decodeServerEvent,
  type ServerWsEvent,
} from "@case-intelligence/contracts/ws";
import { trpc } from "../lib/trpc";

type RealtimeStatus = "connecting" | "connected" | "disconnected";

type UseRealtimeOptions = {
  onEvent(event: ServerWsEvent): void;
  onReconnect(): void;
  onRepeatedFailure(): void;
};
export function useRealtime({
  onEvent,
  onReconnect,
  onRepeatedFailure,
}: UseRealtimeOptions) {
  const socketRef = useRef<WebSocket | null>(null);
  const onEventRef = useRef(onEvent);
  const reconnectTimerRef = useRef<number | null>(null);
  const reconnectAttemptRef = useRef(0);
  const onReconnectRef = useRef(onReconnect);
  const onRepeatedFailureRef = useRef(onRepeatedFailure);
  const createWsTicket = trpc.authRouter.createWsTicket.useMutation();
  const createWsTicketRef = useRef(createWsTicket.mutateAsync);
  const [status, setStatus] = useState<RealtimeStatus>("connecting");
  onEventRef.current = onEvent;
  onReconnectRef.current = onReconnect;
  onRepeatedFailureRef.current = onRepeatedFailure;
  createWsTicketRef.current = createWsTicket.mutateAsync;
  useEffect(() => {
    let shouldReconnect = true;
    let connectionAttempt = 0;

    function scheduleReconnect() {
      if (!shouldReconnect) {
        return;
      }

      setStatus("disconnected");
      reconnectAttemptRef.current += 1;
      if (reconnectAttemptRef.current % 3 === 0) {
        onRepeatedFailureRef.current();
      }
      const delay = Math.min(
        1000 * 2 ** (reconnectAttemptRef.current - 1),
        10_000,
      );
      reconnectTimerRef.current = window.setTimeout(() => {
        reconnectTimerRef.current = null;
        void connect();
      }, delay);
    }

    async function connect() {
      const attempt = ++connectionAttempt;
      setStatus("connecting");

      let ticket: string;
      try {
        const response = await createWsTicketRef.current();
        ticket = response.ticket;
      } catch {
        if (shouldReconnect && attempt === connectionAttempt) {
          scheduleReconnect();
        }
        return;
      }

      if (!shouldReconnect || attempt !== connectionAttempt) {
        return;
      }

      let socket: WebSocket;
      try {
        socket = new WebSocket(
          `${env.VITE_WS_URL}?ticket=${encodeURIComponent(ticket)}`,
        );
      } catch {
        if (shouldReconnect && attempt === connectionAttempt) {
          scheduleReconnect();
        }
        return;
      }

      socketRef.current = socket;
      socket.addEventListener("open", () => {
        if (!shouldReconnect || attempt !== connectionAttempt) {
          socket.close();
          return;
        }

        setStatus("connected");
        const wasReconnect = reconnectAttemptRef.current > 0;
        reconnectAttemptRef.current = 0;
        if (wasReconnect) {
          onReconnectRef.current();
        }
      });
      socket.addEventListener("close", () => {
        if (socketRef.current === socket) {
          socketRef.current = null;
        }
        if (!shouldReconnect || attempt !== connectionAttempt) {
          return;
        }
        scheduleReconnect();
      });
      socket.addEventListener("error", (error) => {
        console.error("[Realtime] Websocket error", error);
      });
      socket.addEventListener("message", (event) => {
        try {
          const message = decodeServerEvent(String(event.data));
          onEventRef.current(message);
        } catch (error) {
          console.error("[Realtime] invalid server event", error);
        }
      });
    }

    void connect();

    return () => {
      shouldReconnect = false;
      connectionAttempt += 1;
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, []);
  return {
    status,
  };
}
