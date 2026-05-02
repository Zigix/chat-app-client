export type EncryptedMessageDto = {
  id: number;
  roomId: number;
  senderId: number;
  keyVersion: number;
  ciphertextB64: string;
  ivB64: string;
  aadB64?: string;
  createdAt: string;
};

export type UiMessage = {
  id: number;
  roomId: number;
  senderId: number;
  text: string;
  createdAt: string;
  fromMe: boolean;
};