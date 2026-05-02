// chat/services/cryptoService.ts

import { decryptMessageAesGcm, encryptMessageAesGcm } from "../crypto/messageCrypto";
import { getRoomKey } from "../state/roomKeysStore";
import type { EncryptedMessageDto } from "../types/types";

export async function encryptForRoom(roomId: number, text: string) {
  const roomKey = getRoomKey(roomId);

  if (!roomKey) {
    throw new Error(`Missing room key for room ${roomId}`);
  }

  const encrypted = await encryptMessageAesGcm(roomKey.key, text, "");

  return {
    keyVersion: roomKey.version,
    ciphertextB64: encrypted.ciphertextB64,
    ivB64: encrypted.ivB64,
    aadB64: encrypted.aadB64,
  };
}

export async function decryptForRoom(roomId: number, message: EncryptedMessageDto) {
  const roomKey = getRoomKey(roomId);

  if (!roomKey) {
    throw new Error(`Missing room key for room ${roomId}`);
  }

  return decryptMessageAesGcm(roomKey.key, {
    ciphertextB64: message.ciphertextB64,
    ivB64: message.ivB64,
    aadB64: message.aadB64 ?? "",
  });
}