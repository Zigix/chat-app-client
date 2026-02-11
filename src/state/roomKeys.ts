type RoomKeyEntry = {
  version: number;
  key: CryptoKey;
  roomKey: CryptoKey;
  keyVersion: number;
};

const map = new Map<string, RoomKeyEntry>();

export function putRoomKey(roomId: string, entry: RoomKeyEntry) {
  map.set(roomId, entry);
}

export function getRoomKey(roomId: string) {
  return map.get(roomId);
}

