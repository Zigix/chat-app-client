import { encryptPrivateMessage, decryptPrivateMessage } from "./privateMessageCrypto";
import { exportEcdhPublicJwk, generateEcdhKeypair, importEcdhPublicJwk } from "./webcrypto";

// Example: one roundtrip "Alice -> Bob" using the same primitives as the app.
export async function demoPrivateMessageRoundtrip() {
  const alice = await generateEcdhKeypair();
  const bob = await generateEcdhKeypair();

  // In the real app you typically store/transport only the public key (JWK JSON string).
  const alicePubJwk = await exportEcdhPublicJwk(alice.publicKey);
  const bobPubJwk = await exportEcdhPublicJwk(bob.publicKey);

  const alicePub = await importEcdhPublicJwk(alicePubJwk);
  const bobPub = await importEcdhPublicJwk(bobPubJwk);

  const msg = await encryptPrivateMessage({
    senderUserId: "alice",
    recipientUserId: "bob",
    senderEcdhPrivateKey: alice.privateKey,
    recipientEcdhPublicKey: bobPub,
    plaintext: "hej Bob 👋 to jest prywatna wiadomość",
  });

  const plaintext = await decryptPrivateMessage({
    recipientEcdhPrivateKey: bob.privateKey,
    senderEcdhPublicKey: alicePub,
    msg,
  });

  return { msg, plaintext };
}

