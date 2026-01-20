/**
 * Cryptography utilities for end-to-end encryption using TweetNaCl.
 *
 * This module provides:
 * - Key pair generation (X25519)
 * - NaCl Box encryption/decryption
 * - ECDH shared secret derivation
 * - Secure nonce generation
 */

import * as nacl from "tweetnacl";
import * as naclUtil from "tweetnacl-util";

/**
 * A key pair for asymmetric encryption (X25519).
 */
export interface KeyPair {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
}

/**
 * Serializable version of KeyPair using base64 strings.
 */
export interface SerializedKeyPair {
  publicKey: string;
  secretKey: string;
}

/**
 * Result of encryption, containing ciphertext and nonce.
 */
export interface EncryptedMessage {
  ciphertext: Uint8Array;
  nonce: Uint8Array;
}

/**
 * Serializable version of EncryptedMessage using base64 strings.
 */
export interface SerializedEncryptedMessage {
  ciphertext: string;
  nonce: string;
}

/**
 * Generate a new key pair for asymmetric encryption.
 * Uses X25519 (Curve25519) via TweetNaCl.
 */
export function generateKeyPair(): KeyPair {
  const keyPair = nacl.box.keyPair();
  return {
    publicKey: keyPair.publicKey,
    secretKey: keyPair.secretKey,
  };
}

/**
 * Derive a shared secret from our secret key and their public key.
 * Uses ECDH (X25519) to derive a 32-byte shared secret.
 */
export function deriveSharedSecret(
  ourSecretKey: Uint8Array,
  theirPublicKey: Uint8Array,
): Uint8Array {
  return nacl.box.before(theirPublicKey, ourSecretKey);
}

/**
 * Generate a cryptographically secure random nonce.
 * Nonces must NEVER be reused with the same key.
 */
export function generateNonce(): Uint8Array {
  return nacl.randomBytes(nacl.box.nonceLength);
}

/**
 * Generate a cryptographically secure random session ID.
 * Returns 16 random bytes (128 bits of entropy).
 */
export function generateSessionId(): Uint8Array {
  return nacl.randomBytes(16);
}

/**
 * Encrypt a message using the NaCl Box (authenticated encryption).
 * Uses the shared secret derived from ECDH key exchange.
 *
 * @param message - The plaintext message to encrypt
 * @param sharedSecret - The shared secret from deriveSharedSecret()
 * @returns The encrypted message with nonce
 */
export function encrypt(
  message: Uint8Array,
  sharedSecret: Uint8Array,
): EncryptedMessage {
  const nonce = generateNonce();
  const ciphertext = nacl.box.after(message, nonce, sharedSecret);

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- nacl.box.after can return null
  if (!ciphertext) {
    throw new Error("Encryption failed");
  }

  return { ciphertext, nonce };
}

/**
 * Decrypt a message using the NaCl Box.
 *
 * @param ciphertext - The encrypted message
 * @param nonce - The nonce used during encryption
 * @param sharedSecret - The shared secret from deriveSharedSecret()
 * @returns The decrypted plaintext, or null if decryption failed
 */
export function decrypt(
  ciphertext: Uint8Array,
  nonce: Uint8Array,
  sharedSecret: Uint8Array,
): Uint8Array | null {
  return nacl.box.open.after(ciphertext, nonce, sharedSecret);
}

/**
 * Encrypt a string message (convenience wrapper).
 */
export function encryptString(
  message: string,
  sharedSecret: Uint8Array,
): EncryptedMessage {
  return encrypt(naclUtil.decodeUTF8(message), sharedSecret);
}

/**
 * Decrypt to a string (convenience wrapper).
 */
export function decryptString(
  ciphertext: Uint8Array,
  nonce: Uint8Array,
  sharedSecret: Uint8Array,
): string | null {
  const decrypted = decrypt(ciphertext, nonce, sharedSecret);
  if (!decrypted) return null;
  return naclUtil.encodeUTF8(decrypted);
}

// ============================================================================
// Base64 Serialization Utilities
// ============================================================================

/**
 * Serialize a key pair to base64 strings for storage/transmission.
 */
export function serializeKeyPair(keyPair: KeyPair): SerializedKeyPair {
  return {
    publicKey: naclUtil.encodeBase64(keyPair.publicKey),
    secretKey: naclUtil.encodeBase64(keyPair.secretKey),
  };
}

/**
 * Deserialize a key pair from base64 strings.
 */
export function deserializeKeyPair(serialized: SerializedKeyPair): KeyPair {
  return {
    publicKey: naclUtil.decodeBase64(serialized.publicKey),
    secretKey: naclUtil.decodeBase64(serialized.secretKey),
  };
}

/**
 * Serialize an encrypted message to base64 strings.
 */
export function serializeEncryptedMessage(
  encrypted: EncryptedMessage,
): SerializedEncryptedMessage {
  return {
    ciphertext: naclUtil.encodeBase64(encrypted.ciphertext),
    nonce: naclUtil.encodeBase64(encrypted.nonce),
  };
}

/**
 * Deserialize an encrypted message from base64 strings.
 */
export function deserializeEncryptedMessage(
  serialized: SerializedEncryptedMessage,
): EncryptedMessage {
  return {
    ciphertext: naclUtil.decodeBase64(serialized.ciphertext),
    nonce: naclUtil.decodeBase64(serialized.nonce),
  };
}

/**
 * Encode bytes to base64.
 */
export function toBase64(data: Uint8Array): string {
  return naclUtil.encodeBase64(data);
}

/**
 * Decode base64 to bytes.
 */
export function fromBase64(base64: string): Uint8Array {
  return naclUtil.decodeBase64(base64);
}

/**
 * Encode a string to bytes.
 */
export function stringToBytes(str: string): Uint8Array {
  return naclUtil.decodeUTF8(str);
}

/**
 * Decode bytes to a string.
 */
export function bytesToString(bytes: Uint8Array): string {
  return naclUtil.encodeUTF8(bytes);
}

/**
 * Constant-time comparison of two byte arrays.
 * Prevents timing attacks when comparing secrets.
 */
export function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  return nacl.verify(a, b);
}

/**
 * Securely clear sensitive data from memory.
 * Note: This is best-effort in JavaScript due to garbage collection.
 */
export function clearBytes(data: Uint8Array): void {
  data.fill(0);
}
