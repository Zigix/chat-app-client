// src/ws/wsService.ts

import { Client, type IMessage, type StompSubscription } from "@stomp/stompjs";
import type { EncryptedMessageDto } from "../types/types";
import type { WsSendMessage } from "../types/ws";

/* export type WsEvent = {
  id: number,
  roomId: number,
  senderId: number,
  createdAt: Date,
  keyVersion: number,
  cipherTextB64: string,
  ivB64: string,
  aadB64: string
}; */

export type WsEvent =
  | {
      type: "message.created";
      roomId: number;
      message: EncryptedMessageDto;
    }
  | {
      type: "room.created";
      room: string;
    }
  | {
      type: "room.updated";
      room: string;
    };

type Listener = (event: WsEvent) => void;

let client: Client | null = null;
let listeners: Listener[] = [];
// eslint-disable-next-line prefer-const
let roomSubscriptions = new Map<number, StompSubscription>();

function notify(event: WsEvent) {
  listeners.forEach((listener) => listener(event));
}

export function connectWs(token: string) {
  if (client?.active) {
    return client;
  }

  client = new Client({
    brokerURL: "ws://localhost:8080/ws",

    connectHeaders: {
      Authorization: `Bearer ${token}`,
    },

    reconnectDelay: 3000,

    onConnect: () => {
      console.log("[WS] connected");

      client?.subscribe("/user/queue/events", handleMessage);
      client?.subscribe("/topic/rooms", handleMessage);
    },

    onStompError: (frame) => {
      console.error("[WS] STOMP error", frame.headers["message"], frame.body);
    },

    onWebSocketClose: () => {
      console.log("[WS] disconnected");
      roomSubscriptions.clear();
    },
  });

  client.activate();

  return client;
}

export function disconnectWs() {
  roomSubscriptions.clear();

  if (client) {
    client.deactivate();
    client = null;
  }
}

export function subscribeToWs(listener: Listener) {
  listeners.push(listener);

  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

export function subscribeToRoom(roomId: number) {
  if (!client?.connected) {
    console.warn("[WS] Cannot subscribe, client not connected");
    return;
  }

  if (roomSubscriptions.has(roomId)) {
    return;
  }

  const subscription = client.subscribe(
    `/topic/rooms/${roomId}`,
    handleMessage
  );

  roomSubscriptions.set(roomId, subscription);
}

export function unsubscribeFromRoom(roomId: number) {
  const sub = roomSubscriptions.get(roomId);

  if (sub) {
    sub.unsubscribe();
    roomSubscriptions.delete(roomId);
  }
}

export function sendRoomMessage(roomId: number, payload: WsSendMessage) {
  if (!client?.connected) {
    throw new Error("WebSocket is not connected");
  }

  console.log("Payload to send");
  console.log(payload);

  client.publish({
    destination: `/app/rooms/${roomId}/send`,
    body: JSON.stringify(payload),
  });
}

function handleMessage(message: IMessage) {
  try {
    const event = JSON.parse(message.body) as WsEvent;
    notify(event);
  } catch (err) {
    console.error("[WS] Failed to parse message", err, message.body);
  }
}

export function isWsConnected() {
  return Boolean(client?.connected);
}