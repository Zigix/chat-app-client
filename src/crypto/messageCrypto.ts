import { b64FromBytes, utf8ToBytes } from "./bytes";

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

// eslint-disable-next-line no-empty-pattern
export function encryptMessage({  }: { plaintext: string; key: CryptoKey }) {
  return {
    // to implement yet
    ciphertextB64: "...",
    ivB64: "...",
    aadB64: "...",
  };
}
