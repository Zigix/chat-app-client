import { useEffect, useMemo, useState } from "react";
import { createPrivateRoom, getRoomKeys } from "../services/chatService";
import { setupRoomKeyForRoom } from "../services/roomKeyService";
import { getRecentConversations, type Conversation } from "../api/chat";

export function useChat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const selected = useMemo(
    () => conversations.find((c) => c.id === selectedId) ?? null,
    [conversations, selectedId]
  );

  useEffect(() => {
    async function getRecent() {
      const recentConversations = (await getRecentConversations());

      recentConversations.forEach((conv) => getRoomKeys(conv.id, conv.currentKeyVersion));
      setConversations(recentConversations);
    };

    getRecent();
  }, [])

  async function startPrivateConversation(user: {
    id: number;
    username: string;
  }) {
    const room = await createPrivateRoom(user.id);

    const myKey = await getRoomKeys(room.roomId, room.currentKeyVersion);
    console.log("My keys:")
    console.log(myKey);

    console.log(room);

    await setupRoomKeyForRoom({
      roomId: room.roomId,
      version: room.currentKeyVersion,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      members: room.roomMembersDataList.map((m: any) => ({
        userId: m.userId,
        publicEcdhJwk: m.publicEcdhJwk,
      })),
    });

    const conversation: Conversation = {
      id: room.roomId,
      name: room.roomName,
      type: "PRIVATE",
      currentKeyVersion: room.currentKeyVersion
    };

    setConversations((prev) => {
      if (prev.some((c) => c.id === conversation.id)) return prev;
      return [conversation, ...prev];
    });

    setSelectedId(conversation.id);
  }

  return {
    conversations,
    selected,
    selectedId,
    setSelectedId,
    startPrivateConversation,
  };
}