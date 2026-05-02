// chat/hooks/useMessages.ts

import { useEffect, useState } from "react";
import {
  sendRoomMessage,
  subscribeToRoom,
  unsubscribeFromRoom,
  subscribeToWs,
} from "../services/wsService";
import { decryptForRoom, encryptForRoom } from "../services/cryptoService";
import type { EncryptedMessageDto, UiMessage } from "../types/types";
import { getMessagesForRoom } from "../api/chat";

export function useMessages(roomId: number | null, myUserId: number, wsConnected: boolean) {
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [loading, setLoading] = useState(false);

  // 📥 1. LOAD HISTORY
  useEffect(() => {
    if (!roomId) {
      setMessages([]);
      return;
    }

    const currentRoomId = roomId;
    let cancelled = false;

    async function loadMessages() {
      setLoading(true);

      try {
        const res = await getMessagesForRoom(currentRoomId);
        const encryptedMessages = res as unknown as EncryptedMessageDto[];

        const decrypted = await Promise.all(
          encryptedMessages.map(async (m) => ({
            id: m.id,
            roomId: m.roomId,
            senderId: m.senderId,
            createdAt: m.createdAt,
            fromMe: m.senderId === myUserId,
            text: await decryptForRoom(currentRoomId, m),
          }))
        );

        if (!cancelled) {
          setMessages(decrypted);
        }
      } catch (e) {
        console.error("Failed to load messages", e);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadMessages();

    return () => {
      cancelled = true;
    };
  }, [roomId, myUserId]);

  // 📡 2. REAL-TIME WS
  useEffect(() => {
    if (!roomId) return;
    if (!wsConnected) return;

    // 👉 subskrypcja STOMP dla tego roomu
    subscribeToRoom(roomId);

    const unsubscribe = subscribeToWs(async (event) => {
      if (event.type !== "message.created") return;
      if (event.roomId !== roomId) return;

      const m = event.message;

      try {
        const text = await decryptForRoom(roomId, m);

        setMessages((prev) => {
          // deduplikacja (bardzo ważne przy reconnectach)
          if (prev.some((x) => x.id === m.id)) return prev;

          return [
            ...prev,
            {
              id: m.id,
              roomId: m.roomId,
              senderId: m.senderId,
              createdAt: m.createdAt,
              fromMe: m.senderId === myUserId,
              text,
            },
          ];
        });
      } catch (e) {
        console.error("Decrypt failed", e);
      }
    });

    return () => {
      unsubscribe();
      unsubscribeFromRoom(roomId);
    };
  }, [roomId, myUserId, wsConnected]);

  // 📤 3. SEND MESSAGE
  async function sendMessage(text: string) {
    if (!roomId) return;

    try {
      const encrypted = await encryptForRoom(roomId, text);

      sendRoomMessage(roomId, {
        clientMessageId: crypto.randomUUID(),
        ...encrypted,
      });
    } catch (e) {
      console.error("Send message failed", e);
    }
  }

  return {
    messages,
    loading,
    sendMessage,
  };
}