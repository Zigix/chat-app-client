import type { WsEvent, WsNewMessage } from "../types/ws";
import { Client } from "@stomp/stompjs";


type Handlers = {
  onNewMessage: (m: WsNewMessage) => void;
  onError?: (e: string) => void;
  onOpen?: () => void;
  onClose?: () => void;
};

export function createWsClient(handlers: Handlers) {
  let ws: WebSocket | null = null;

  function connect() {
    const token = localStorage.getItem("accessToken") ?? "";
    const url = `ws://localhost:8080/ws?token=${encodeURIComponent(token)}`;

    ws = new WebSocket(url);

    ws.onopen = () => handlers.onOpen?.();

    ws.onmessage = (ev) => {
      try {
        const event = JSON.parse(ev.data) as WsEvent;

        if (event.type === "NEW_MESSAGE") {
          handlers.onNewMessage(event.payload as WsNewMessage);
        }
      } catch (e) {
        handlers.onError?.("WS parse error");
        console.error("Failed to parse WS message", e);
      }
    };

    ws.onerror = () => handlers.onError?.("WS error");
    ws.onclose = () => handlers.onClose?.();
  }

  function send<T>(type: string, payload: T) {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket not connected");
    }
    const event: WsEvent<T> = { type, payload };
    ws.send(JSON.stringify(event));
  }

  function disconnect() {
    ws?.close();
    ws = null;
  }

  return { connect, disconnect, send };
}

export const wsClient = new Client({
  brokerURL: "ws://localhost:8080/ws",
  connectHeaders: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
  reconnectDelay: 5000,
});

wsClient.activate();

