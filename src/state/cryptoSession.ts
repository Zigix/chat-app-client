export type CryptoSession = {
  myUserId: number;
  myMasterKey: CryptoKey;
  myEcdhPrivateKey: CryptoKey;
  myEcdhPublicKey: CryptoKey;
};

let session: CryptoSession | null = null;

export function setCryptoSession(s: CryptoSession) {
  session = s;
}

export function getCryptoSession(): CryptoSession {
  if (!session) throw new Error("Crypto session not initialized (missing ECDH keys in memory)");
  return session;
}

export function clearCryptoSession() {
  session = null;
}
