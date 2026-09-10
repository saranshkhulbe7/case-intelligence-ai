import { useEffect, useRef, useState } from "react";
import { env } from "../env";
import {
  decodeServerEvent,
  type ServerWsEvent,
} from "@case-intelligence/contracts/ws";

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
  const [status, setStatus] = useState<RealtimeStatus>("connecting");
  onEventRef.current = onEvent;
  onReconnectRef.current = onReconnect;
  onRepeatedFailureRef.current = onRepeatedFailure;
  useEffect(() => {
    let shouldReconnect = true;
    function connect() {
      setStatus("connecting");
      const socket = new WebSocket(env.VITE_WS_URL);
      socketRef.current = socket;
      socket.addEventListener("open", () => {
        setStatus("connected");
        const wasReconnect = reconnectAttemptRef.current > 0;
        reconnectAttemptRef.current = 0;
        if (wasReconnect) {
          onReconnectRef.current();
        }
      });
      socket.addEventListener("close", () => {
        socketRef.current = null;
        setStatus("disconnected");
        if (!shouldReconnect) {
          return;
        }
        reconnectAttemptRef.current += 1;
        if (reconnectAttemptRef.current % 3 === 0) {
          onRepeatedFailureRef.current();
        }
        const delay = Math.min(
          1000 * 2 ** (reconnectAttemptRef.current - 1),
          10_000,
        );
        reconnectTimerRef.current = window.setTimeout(connect, delay);
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

    connect();

    return () => {
      shouldReconnect = false;
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
