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

export type Conversation = {
  id: number,
  type: string,
  name: string,
  currentKeyVersion: number
};

export async function getRecentConversations() {
  return apiFetch<Conversation[]>("/rooms/recent");
}

export async function uploadKeys(roomId: number, request: UploadRoomKeysApiRequest) {
  return postJson<string>(`api/rooms/${roomId}/keys/bulk`, request);
}

export type MyKeyResponse = {
  roomId: number,
  version: number,
  wrappedByUserId: number,
  wrappedRoomKeyB64: string,
  ivB64: string,
  aadB64: string
}

export async function getRoomKey(roomId: number, version: number) {
  return apiFetch<MyKeyResponse>(`/rooms/${roomId}/my-key?version=${version}`);
}