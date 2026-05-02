import {
  createOrGetPrivateConversation,
  getRoomKey,
  uploadKeys,
} from "../api/chat";
import { getUserPublicEcdhJwk } from "../api/users";
import { b64ToBytes, utf8 } from "../crypto/bytes";
import {
  aesGcmDecryptBytes,
  deriveEcdhSharedSecretBits,
  hkdfDeriveAesGcmKey,
  importAesKeyFromRaw,
  importEcdhPublicJwk,
} from "../crypto/webcrypto";
import { getCryptoSession } from "../state/cryptoSession";
import { putRoomKey } from "../state/roomKeysStore";
import type { UploadRoomKeysApiRequest } from "./roomKeyService";

export async function createPrivateRoom(otherUserId: number) {
  return await createOrGetPrivateConversation({ otherUserId });
}

export async function uploadRoomKeys(
  roomId: number,
  request: UploadRoomKeysApiRequest,
) {
  return await uploadKeys(roomId, request);
}

export async function getRoomKeys(roomId: number, version: number) {
  const myKeyResponse = await getRoomKey(roomId, version);

  const myCryptoSession = getCryptoSession();

  if (myKeyResponse.wrappedByUserId === myCryptoSession.myUserId) {
    const myRoomKey = await aesGcmDecryptBytes(
      myCryptoSession.myMasterKey,
      b64ToBytes(myKeyResponse.ivB64),
      b64ToBytes(myKeyResponse.wrappedRoomKeyB64),
      b64ToBytes(myKeyResponse.aadB64),
    );

    const roomKeyCryptoKey = await importAesKeyFromRaw(myRoomKey);

    putRoomKey(roomId, { key: roomKeyCryptoKey, version: version });
  } else {
    const wrappedByPublicEcdhJwk = await getUserPublicEcdhJwk(
      myKeyResponse.wrappedByUserId,
    );

    console.log(wrappedByPublicEcdhJwk);

    const wrapperPublicKey = await importEcdhPublicJwk(JSON.stringify(wrappedByPublicEcdhJwk));

    console.log(wrapperPublicKey);

    const sharedSecret = await deriveEcdhSharedSecretBits(
      myCryptoSession.myEcdhPrivateKey,
      wrapperPublicKey,
    );

    const derivedKey = await hkdfDeriveAesGcmKey({
      ikm: sharedSecret,
      salt: new Uint8Array([]),
      info: utf8.enc(`room-key-wrap:${myKeyResponse.roomId}`),
    });

    const roomKeyRaw = await aesGcmDecryptBytes(
      derivedKey,
      b64ToBytes(myKeyResponse.ivB64),
      b64ToBytes(myKeyResponse.wrappedRoomKeyB64),
      b64ToBytes(myKeyResponse.aadB64),
    );

    const roomKeyCryptoKey = await importAesKeyFromRaw(roomKeyRaw);
    putRoomKey(roomId, {key: roomKeyCryptoKey, version: version});
  }
}
