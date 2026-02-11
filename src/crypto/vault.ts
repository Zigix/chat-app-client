export type VaultDto = {
  version: number;
  kdfSaltB64: string;
  kdfIterations: number;
  wrappedMkB64: string;
  wrappedMkIvB64: string;
  wrappedEcdhPrivB64: string;
  wrappedEcdhPrivIvB64: string;
};

export type RegisterCryptoResult = {
  pubEcdhJwk: string;
  vault: VaultDto;
};

export type SessionKeys = {
  mkRaw32: Uint8Array;
  mkAesKey: CryptoKey;
  ecdhPrivateKey: CryptoKey;
};
