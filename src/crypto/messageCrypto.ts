import { b64FromBytes, bytesFromB64, toAb, utf8ToBytes } from "./bytes";

export type EncryptedMessage = {
  ciphertextB64: string;
  ivB64: string;
  aadB64: string;
};

export async function encryptMessageAesGcm(
  roomKey: CryptoKey,
  plaintext: string,
  aadObj: unknown
): Promise<EncryptedMessage> {

  const iv = crypto.getRandomValues(new Uint8Array(12));


  const aadJson = JSON.stringify(aadObj);
  const aadBytes = utf8ToBytes(aadJson);

  const pt = utf8ToBytes(plaintext);

  const ctBuf = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv, additionalData: new Uint8Array(aadBytes) },
    roomKey,
    new Uint8Array(pt)
  );

  return {
    ciphertextB64: b64FromBytes(new Uint8Array(ctBuf)),
    ivB64: b64FromBytes(iv),
    aadB64: b64FromBytes(aadBytes),
  };
}

export async function decryptMessageAesGcm(roomKey: CryptoKey, msg: EncryptedMessage): Promise<string> {
  const iv = bytesFromB64(msg.ivB64);
  const aad = bytesFromB64(msg.aadB64);
  const ct = bytesFromB64(msg.ciphertextB64);

  const ptBuf = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: toAb(iv), additionalData: toAb(aad) },
    roomKey,
    toAb(ct)
  );

  return new TextDecoder().decode(new Uint8Array(ptBuf));
}
