import { createRoomKeysForUsers } from "../crypto/roomKeysCrypto";
import { importAesKeyFromRaw } from "../crypto/webcrypto";
import { getCryptoSession } from "../state/cryptoSession";
import { putRoomKey } from "../state/roomKeysStore";
import { uploadRoomKeys } from "./chatService";

export type UploadRoomKeysApiRequest = {
  version: number;
  wrappedByUserId: number;
  keyItems: {
    userId: number;
    wrappedRoomKeyB64: string;
    ivB64: string;
    aadB64: string;
  }[];
};

type RoomMemberDto = {
  userId: number;
  publicEcdhJwk: string;
};

type SetupRoomKeyParams = {
  roomId: number;
  version: number;
  members: RoomMemberDto[];
};

export async function setupRoomKeyForRoom({
  roomId,
  version,
  members,
}: SetupRoomKeyParams) {
  const cryptoSession = getCryptoSession();

  const result = await createRoomKeysForUsers({
    roomId,
    version,
    members,
    sender: {
      userId: cryptoSession.myUserId,
      mkAesKey: cryptoSession.myMasterKey,
      ecdhPrivateKey: cryptoSession.myEcdhPrivateKey,
    },
  });

  await uploadRoomKeys(roomId, result.request);

  const cryptoKey = await importAesKeyFromRaw(result.roomKeyRaw);

  putRoomKey(roomId, {
    key: cryptoKey,
    version,
  });

  return {
    roomId,
    version,
    key: cryptoKey,
  };
}
