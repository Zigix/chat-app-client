import { bytesFromB64, bytesToB64, randomBytes, utf8 } from "./bytes";
import { decryptMessageAesGcm, encryptMessageAesGcm, type EncryptedMessage } from "./messageCrypto";
import { deriveEcdhSharedSecretBits, hkdfDeriveAesGcmKey } from "./webcrypto";

export type EncryptedPrivateMessage = EncryptedMessage & {
  v: 1;
  senderUserId: string;
  recipientUserId: string;
  saltB64: string;
};

function dmInfo(senderUserId: string, recipientUserId: string): Uint8Array {
  return utf8.enc(`dm-v1|${senderUserId}|${recipientUserId}`);
}

export async function encryptPrivateMessage(params: {
  senderUserId: string;
  recipientUserId: string;
  senderEcdhPrivateKey: CryptoKey;
  recipientEcdhPublicKey: CryptoKey;
  plaintext: string;
}): Promise<EncryptedPrivateMessage> {
  const shared = await deriveEcdhSharedSecretBits(params.senderEcdhPrivateKey, params.recipientEcdhPublicKey);
  const salt = randomBytes(16);
  const roomKey = await hkdfDeriveAesGcmKey({
    ikm: shared,
    salt,
    info: dmInfo(params.senderUserId, params.recipientUserId),
  });

  const aad = { v: 1, senderUserId: params.senderUserId, recipientUserId: params.recipientUserId };
  const enc = await encryptMessageAesGcm(roomKey, params.plaintext, aad);

  return {
    v: 1,
    senderUserId: params.senderUserId,
    recipientUserId: params.recipientUserId,
    saltB64: bytesToB64(salt),
    ...enc,
  };
}

export async function decryptPrivateMessage(params: {
  recipientEcdhPrivateKey: CryptoKey;
  senderEcdhPublicKey: CryptoKey;
  msg: EncryptedPrivateMessage;
}): Promise<string> {
  const shared = await deriveEcdhSharedSecretBits(params.recipientEcdhPrivateKey, params.senderEcdhPublicKey);
  const salt = bytesFromB64(params.msg.saltB64);
  const roomKey = await hkdfDeriveAesGcmKey({
    ikm: shared,
    salt,
    info: dmInfo(params.msg.senderUserId, params.msg.recipientUserId),
  });

  const { ciphertextB64, ivB64, aadB64 } = params.msg;
  return decryptMessageAesGcm(roomKey, { ciphertextB64, ivB64, aadB64 });
}

