// src/ws/useWebSocket.ts

import { useEffect, useState } from "react";
import { connectWs, disconnectWs, isWsConnected } from "../services/wsService";


export function useWebSocket(token: string | null) {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!token) return;

    console.log("token:");
    console.log(token);

    const client = connectWs(token);

    client.onConnect = () => {
      console.log("[WS] connected");
      setConnected(true);
    };

    client.onWebSocketClose = () => {
      console.log("[WS] disconnected");
      setConnected(false);
    };

    client.onStompError = (frame) => {
      console.error("[WS] STOMP error", frame.headers["message"], frame.body);
      setConnected(false);
    };

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setConnected(isWsConnected());

    return () => {
      disconnectWs();
      setConnected(false);
    };
  }, [token]);

  return { connected };
}