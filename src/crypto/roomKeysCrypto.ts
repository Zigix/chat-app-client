import { bytesToB64, randomBytes, utf8 } from "./bytes";
import { aesGcmEncryptBytes, importEcdhPublicJwk, deriveEcdhSharedSecretBits, hkdfDeriveAesGcmKey } from "./webcrypto";

type GroupMember = {
  userId: number;
  publicEcdhJwk: string; // dla innych userów
};

type SenderContext = {
  userId: number;
  mkAesKey: CryptoKey;
  ecdhPrivateKey: CryptoKey;
};

export async function createRoomKeysForUsers(params: {
  roomId: number;
  sender: SenderContext;
  members: GroupMember[]; // zawiera też sendera!
  version: number;
}) {
  const { roomId, sender, members, version } = params;

  // ======================
  // 1. Generate RoomKey
  // ======================
  const roomKeyRaw = randomBytes(32);

  const keyItems: {
    userId: number;
    wrappedRoomKeyB64: string;
    ivB64: string;
    aadB64: string;
  }[] = [];

  // ======================
  // 2. Iterate users
  // ======================
  for (const member of members) {
    let encrypted;
    let aad: Uint8Array;

    // ======================
    // 2A. Sender → używa MK
    // ======================
    if (member.userId === sender.userId) {
      aad = utf8.enc(JSON.stringify({
        roomId,
        userId: member.userId,
        type: "room_key_mk"
      }));

      encrypted = await aesGcmEncryptBytes(
        sender.mkAesKey,
        roomKeyRaw,
        aad
      );
    } 
    // ======================
    // 2B. Others → ECDH
    // ======================
    else {
      const pubKey = await importEcdhPublicJwk(member.publicEcdhJwk);

      const sharedSecret = await deriveEcdhSharedSecretBits(
        sender.ecdhPrivateKey,
        pubKey
      );

      const derivedKey = await hkdfDeriveAesGcmKey({
        ikm: sharedSecret,
        salt: new Uint8Array([]),
        info: utf8.enc(`room-key-wrap:${roomId}`)
      });

      aad = utf8.enc(JSON.stringify({
        roomId,
        userId: member.userId,
        type: "room_key_ecdh"
      }));

      encrypted = await aesGcmEncryptBytes(
        derivedKey,
        roomKeyRaw,
        aad
      );
    }

    keyItems.push({
      userId: member.userId,
      wrappedRoomKeyB64: bytesToB64(encrypted.ciphertext),
      ivB64: bytesToB64(encrypted.iv),
      aadB64: bytesToB64(aad)
    });
  }

  // ======================
  // 3. Return API payload
  // ======================
  return {
    request: {
      version,
      wrappedByUserId: sender.userId,
      keyItems
    },

    // lokalnie do użycia (np. do szyfrowania wiadomości)
    roomKeyRaw
  };
}