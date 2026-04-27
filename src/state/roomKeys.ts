type RoomKeyEntry = {
  key: CryptoKey;
  version: number;
};

const map = new Map<number, RoomKeyEntry>();

export function putRoomKey(roomId: number, entry: RoomKeyEntry) {
  map.set(roomId, entry);
}

export function getRoomKey(roomId: number) {
  return map.get(roomId);
}

