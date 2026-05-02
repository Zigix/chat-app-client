export type WsEvent<T = unknown> = {
  type: string;
  payload: T;
};

export type WsSendMessage = {
  clientMessageId: string;
  keyVersion: number;
  ciphertextB64: string;
  ivB64: string;
  aadB64: string;
};

export type WsNewMessage = {
  id: number;
  roomId: number;
  senderId: number;
  createdAt: string;
  keyVersion: number;
  ciphertextB64: string;
  ivB64: string;
  aadB64: string;
};
