import { apiFetch, postJson } from "./client";

export type CreateDmRequest = {
  otherUserId: number
};

export type CreateDmResponse = {
  roomId: number,
  currentKeyVersion: number
};

export async function createPrivateMessage(req: CreateDmRequest) {
  return postJson<CreateDmResponse>("api/rooms/dm", req);
}

export async function getPublicEcdhForUser(userId: number) {
  return apiFetch<string>(`/users/${userId}`);
}