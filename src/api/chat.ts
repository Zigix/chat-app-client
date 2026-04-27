import type { UploadRoomKeysApiRequest } from "../services/roomKeyService";
import { apiFetch, postJson } from "./client";

export type CreateDmRequest = {
  otherUserId: number
};

export type RoomMemberData = {
  memberId: number,
  userId: number,
  username: string,
  role: string,
  publicEcdhJwk: string
}

export type RoomDataResponse = {
  roomId: number,
  roomName: string,
  roomType: string,
  currentKeyVersion: number
  roomMembersDataList: RoomMemberData[]
};

export async function createOrGetPrivateConversation(req: CreateDmRequest) {
  return postJson<RoomDataResponse>("api/rooms/dm", req);
}

export async function getPublicEcdhForUser(userId: number) {
  return apiFetch<string>(`/users/${userId}`);
}

/* export async function getRecentConversations() {
  return apiFetch<Conversation[]>("/rooms/recent");
} */

export type RecentConversation = {
  id: number,
  type: string,
  name: string
};

export async function getRecentConversations() {
  return apiFetch<RecentConversation[]>("/rooms/recent");
}

export async function uploadKeys(roomId: number, request: UploadRoomKeysApiRequest) {
  return postJson<string>(`api/rooms/${roomId}/keys/bulk`, request);
}