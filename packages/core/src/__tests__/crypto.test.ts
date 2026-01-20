import { describe, expect, it } from "vitest";

import {
  bytesToString,
  clearBytes,
  constantTimeEqual,
  decrypt,
  decryptString,
  deriveSharedSecret,
  deserializeEncryptedMessage,
  deserializeKeyPair,
  encrypt,
  encryptString,
  fromBase64,
  generateKeyPair,
  generateNonce,
  generateSessionId,
  serializeEncryptedMessage,
  serializeKeyPair,
  stringToBytes,
  toBase64,
} from "../crypto";

describe("Key Generation", () => {
  it("should generate a valid key pair", () => {
    const keyPair = generateKeyPair();

    expect(keyPair.publicKey).toBeInstanceOf(Uint8Array);
    expect(keyPair.secretKey).toBeInstanceOf(Uint8Array);
    expect(keyPair.publicKey.length).toBe(32);
    expect(keyPair.secretKey.length).toBe(32);
  });

  it("should generate unique key pairs", () => {
    const keyPair1 = generateKeyPair();
    const keyPair2 = generateKeyPair();

    expect(keyPair1.publicKey).not.toEqual(keyPair2.publicKey);
    expect(keyPair1.secretKey).not.toEqual(keyPair2.secretKey);
  });
});

describe("Key Serialization", () => {
  it("should serialize and deserialize key pairs", () => {
    const original = generateKeyPair();
    const serialized = serializeKeyPair(original);
    const deserialized = deserializeKeyPair(serialized);

    expect(deserialized.publicKey).toEqual(original.publicKey);
    expect(deserialized.secretKey).toEqual(original.secretKey);
  });

  it("should produce base64 strings", () => {
    const keyPair = generateKeyPair();
    const serialized = serializeKeyPair(keyPair);

    expect(typeof serialized.publicKey).toBe("string");
    expect(typeof serialized.secretKey).toBe("string");
    // Base64 characters only
    expect(serialized.publicKey).toMatch(/^[A-Za-z0-9+/]+=*$/);
    expect(serialized.secretKey).toMatch(/^[A-Za-z0-9+/]+=*$/);
  });
});

describe("ECDH Key Exchange", () => {
  it("should derive the same shared secret for both parties", () => {
    const alice = generateKeyPair();
    const bob = generateKeyPair();

    const aliceShared = deriveSharedSecret(alice.secretKey, bob.publicKey);
    const bobShared = deriveSharedSecret(bob.secretKey, alice.publicKey);

    expect(aliceShared).toEqual(bobShared);
    expect(aliceShared.length).toBe(32);
  });

  it("should derive different secrets with different key pairs", () => {
    const alice = generateKeyPair();
    const bob = generateKeyPair();
    const charlie = generateKeyPair();

    const aliceBob = deriveSharedSecret(alice.secretKey, bob.publicKey);
    const aliceCharlie = deriveSharedSecret(alice.secretKey, charlie.publicKey);

    expect(aliceBob).not.toEqual(aliceCharlie);
  });
});

describe("Encryption/Decryption", () => {
  it("should encrypt and decrypt a message", () => {
    const alice = generateKeyPair();
    const bob = generateKeyPair();
    const sharedSecret = deriveSharedSecret(alice.secretKey, bob.publicKey);

    const message = stringToBytes("Hello, World!");
    const encrypted = encrypt(message, sharedSecret);

    expect(encrypted.ciphertext).toBeInstanceOf(Uint8Array);
    expect(encrypted.nonce).toBeInstanceOf(Uint8Array);
    expect(encrypted.nonce.length).toBe(24);

    const decrypted = decrypt(
      encrypted.ciphertext,
      encrypted.nonce,
      sharedSecret,
    );
    expect(decrypted).toEqual(message);
  });

  it("should fail to decrypt with wrong key", () => {
    const alice = generateKeyPair();
    const bob = generateKeyPair();
    const charlie = generateKeyPair();

    const aliceBobSecret = deriveSharedSecret(alice.secretKey, bob.publicKey);
    const aliceCharlieSecret = deriveSharedSecret(
      alice.secretKey,
      charlie.publicKey,
    );

    const message = stringToBytes("Secret message");
    const encrypted = encrypt(message, aliceBobSecret);

    const decrypted = decrypt(
      encrypted.ciphertext,
      encrypted.nonce,
      aliceCharlieSecret,
    );
    expect(decrypted).toBeNull();
  });

  it("should fail to decrypt with wrong nonce", () => {
    const alice = generateKeyPair();
    const bob = generateKeyPair();
    const sharedSecret = deriveSharedSecret(alice.secretKey, bob.publicKey);

    const message = stringToBytes("Secret message");
    const encrypted = encrypt(message, sharedSecret);
    const wrongNonce = generateNonce();

    const decrypted = decrypt(encrypted.ciphertext, wrongNonce, sharedSecret);
    expect(decrypted).toBeNull();
  });

  it("should produce different ciphertext for same message (unique nonces)", () => {
    const alice = generateKeyPair();
    const bob = generateKeyPair();
    const sharedSecret = deriveSharedSecret(alice.secretKey, bob.publicKey);

    const message = stringToBytes("Same message");
    const encrypted1 = encrypt(message, sharedSecret);
    const encrypted2 = encrypt(message, sharedSecret);

    expect(encrypted1.ciphertext).not.toEqual(encrypted2.ciphertext);
    expect(encrypted1.nonce).not.toEqual(encrypted2.nonce);
  });
});

describe("String Encryption", () => {
  it("should encrypt and decrypt strings", () => {
    const alice = generateKeyPair();
    const bob = generateKeyPair();
    const sharedSecret = deriveSharedSecret(alice.secretKey, bob.publicKey);

    const message = "Hello, this is a test message with unicode: 你好 🎉";
    const encrypted = encryptString(message, sharedSecret);
    const decrypted = decryptString(
      encrypted.ciphertext,
      encrypted.nonce,
      sharedSecret,
    );

    expect(decrypted).toBe(message);
  });

  it("should return null for failed string decryption", () => {
    const alice = generateKeyPair();
    const bob = generateKeyPair();
    const charlie = generateKeyPair();

    const aliceBobSecret = deriveSharedSecret(alice.secretKey, bob.publicKey);
    const aliceCharlieSecret = deriveSharedSecret(
      alice.secretKey,
      charlie.publicKey,
    );

    const encrypted = encryptString("Secret", aliceBobSecret);
    const decrypted = decryptString(
      encrypted.ciphertext,
      encrypted.nonce,
      aliceCharlieSecret,
    );

    expect(decrypted).toBeNull();
  });
});

describe("Message Serialization", () => {
  it("should serialize and deserialize encrypted messages", () => {
    const alice = generateKeyPair();
    const bob = generateKeyPair();
    const sharedSecret = deriveSharedSecret(alice.secretKey, bob.publicKey);

    const message = stringToBytes("Test message");
    const encrypted = encrypt(message, sharedSecret);
    const serialized = serializeEncryptedMessage(encrypted);

    expect(typeof serialized.ciphertext).toBe("string");
    expect(typeof serialized.nonce).toBe("string");

    const deserialized = deserializeEncryptedMessage(serialized);
    expect(deserialized.ciphertext).toEqual(encrypted.ciphertext);
    expect(deserialized.nonce).toEqual(encrypted.nonce);

    // Should still decrypt correctly
    const decrypted = decrypt(
      deserialized.ciphertext,
      deserialized.nonce,
      sharedSecret,
    );
    expect(decrypted).toEqual(message);
  });
});

describe("Session ID Generation", () => {
  it("should generate 16-byte session IDs", () => {
    const sessionId = generateSessionId();

    expect(sessionId).toBeInstanceOf(Uint8Array);
    expect(sessionId.length).toBe(16);
  });

  it("should generate unique session IDs", () => {
    const id1 = generateSessionId();
    const id2 = generateSessionId();

    expect(id1).not.toEqual(id2);
  });
});

describe("Nonce Generation", () => {
  it("should generate 24-byte nonces", () => {
    const nonce = generateNonce();

    expect(nonce).toBeInstanceOf(Uint8Array);
    expect(nonce.length).toBe(24);
  });

  it("should generate unique nonces", () => {
    const nonce1 = generateNonce();
    const nonce2 = generateNonce();

    expect(nonce1).not.toEqual(nonce2);
  });
});

describe("Base64 Utilities", () => {
  it("should encode and decode base64", () => {
    const original = new Uint8Array([1, 2, 3, 4, 5, 255, 0, 128]);
    const encoded = toBase64(original);
    const decoded = fromBase64(encoded);

    expect(decoded).toEqual(original);
  });

  it("should handle empty arrays", () => {
    const empty = new Uint8Array(0);
    const encoded = toBase64(empty);
    const decoded = fromBase64(encoded);

    expect(decoded).toEqual(empty);
  });
});

describe("String/Bytes Conversion", () => {
  it("should convert strings to bytes and back", () => {
    const original = "Hello, World! 你好 🎉";
    const bytes = stringToBytes(original);
    const restored = bytesToString(bytes);

    expect(restored).toBe(original);
  });

  it("should handle empty strings", () => {
    const empty = "";
    const bytes = stringToBytes(empty);
    const restored = bytesToString(bytes);

    expect(restored).toBe(empty);
  });
});

describe("Constant Time Comparison", () => {
  it("should return true for equal arrays", () => {
    const a = new Uint8Array([1, 2, 3, 4, 5]);
    const b = new Uint8Array([1, 2, 3, 4, 5]);

    expect(constantTimeEqual(a, b)).toBe(true);
  });

  it("should return false for different arrays", () => {
    const a = new Uint8Array([1, 2, 3, 4, 5]);
    const b = new Uint8Array([1, 2, 3, 4, 6]);

    expect(constantTimeEqual(a, b)).toBe(false);
  });

  it("should return false for arrays of different lengths", () => {
    const a = new Uint8Array([1, 2, 3, 4, 5]);
    const b = new Uint8Array([1, 2, 3, 4]);

    expect(constantTimeEqual(a, b)).toBe(false);
  });
});

describe("Clear Bytes", () => {
  it("should zero out byte array", () => {
    const data = new Uint8Array([1, 2, 3, 4, 5]);
    clearBytes(data);

    expect(data).toEqual(new Uint8Array([0, 0, 0, 0, 0]));
  });
});
