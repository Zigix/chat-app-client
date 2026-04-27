import { useEffect, useState } from "react";
import { createPrivateRoom } from "../services/chatService";
import { setupRoomKeyForRoom } from "../services/roomKeyService";
import { getRecentConversations } from "../api/chat";

export type Conversation = {
  id: number,
  type: string,
  name: string
};

export function useChat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    async function getRecent() {
      const recentConversations = (await getRecentConversations());

      setConversations(recentConversations);
    };

    getRecent();
  }, [])

  async function startPrivateConversation(user: {
    id: number;
    username: string;
  }) {
    const room = await createPrivateRoom(user.id);

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
      name: user.username,
      type: "PRIVATE",
    };

    setConversations((prev) => {
      if (prev.some((c) => c.id === conversation.id)) return prev;
      return [conversation, ...prev];
    });

    setSelectedId(conversation.id);
  }

  return {
    conversations,
    selectedId,
    setSelectedId,
    startPrivateConversation,
  };
}