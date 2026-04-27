import { createOrGetPrivateConversation, uploadKeys } from "../api/chat";
import type { UploadRoomKeysApiRequest } from "./roomKeyService";

export async function createPrivateRoom(otherUserId: number) {
  return await createOrGetPrivateConversation({otherUserId});
}

export async function uploadRoomKeys(
  roomId: number,
  request: UploadRoomKeysApiRequest
) {
  return await uploadKeys(roomId, request);
}