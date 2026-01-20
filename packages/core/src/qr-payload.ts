/**
 * QR Code payload utilities for the pairing flow.
 *
 * The QR code contains the initial handshake data that allows
 * the mobile device to connect to the desktop via the relay.
 */

import { z } from "zod/v4";

import type { HandshakeInit, PublicKey, SessionId } from "./protocol";

/**
 * QR payload version for future compatibility.
 */
export const QR_PAYLOAD_VERSION = "1";

/**
 * Schema for the compact QR payload format.
 * Uses short keys to minimize QR code size.
 */
export const QrPayloadSchema = z.object({
  /** Version */
  v: z.string(),
  /** Session ID (base64) */
  s: z.string(),
  /** Desktop public key (base64) */
  k: z.string(),
  /** Relay URL */
  r: z.url(),
});
export type QrPayload = z.infer<typeof QrPayloadSchema>;

/**
 * Create a QR payload from handshake init data.
 */
export function createQrPayload(
  sessionId: SessionId,
  desktopPublicKey: PublicKey,
  relayUrl: string,
): QrPayload {
  return {
    v: QR_PAYLOAD_VERSION,
    s: sessionId,
    k: desktopPublicKey,
    r: relayUrl,
  };
}

/**
 * Serialize a QR payload to a string for encoding in the QR code.
 * Uses JSON for simplicity and broad compatibility.
 */
export function serializeQrPayload(payload: QrPayload): string {
  return JSON.stringify(payload);
}

/**
 * Parse and validate a QR payload string.
 * Returns null if the payload is invalid.
 */
export function parseQrPayload(data: string): QrPayload | null {
  try {
    const parsed = JSON.parse(data) as unknown;
    const result = QrPayloadSchema.safeParse(parsed);
    if (!result.success) {
      return null;
    }
    return result.data;
  } catch {
    return null;
  }
}

/**
 * Convert a QR payload to a HandshakeInit message.
 */
export function qrPayloadToHandshakeInit(payload: QrPayload): HandshakeInit {
  return {
    type: "handshake_init",
    sessionId: payload.s,
    desktopPublicKey: payload.k,
    relayUrl: payload.r,
    version: payload.v,
  };
}

/**
 * Create a HandshakeInit and serialize it for QR code display.
 */
export function createQrCodeData(
  sessionId: SessionId,
  desktopPublicKey: PublicKey,
  relayUrl: string,
): string {
  const payload = createQrPayload(sessionId, desktopPublicKey, relayUrl);
  return serializeQrPayload(payload);
}

/**
 * Parse QR code data and return HandshakeInit.
 * Returns null if the data is invalid.
 */
export function parseQrCodeData(data: string): HandshakeInit | null {
  const payload = parseQrPayload(data);
  if (!payload) {
    return null;
  }
  return qrPayloadToHandshakeInit(payload);
}

/**
 * Validate that a QR payload has a supported version.
 */
export function isVersionSupported(payload: QrPayload): boolean {
  return payload.v === QR_PAYLOAD_VERSION;
}

/**
 * Estimate the size of the QR payload in bytes.
 * Useful for ensuring the payload fits in a reasonable QR code.
 */
export function estimatePayloadSize(payload: QrPayload): number {
  return serializeQrPayload(payload).length;
}

/**
 * Maximum recommended payload size for QR codes.
 * QR codes can hold up to ~3KB but smaller is better for scanning reliability.
 */
export const MAX_RECOMMENDED_PAYLOAD_SIZE = 500;

/**
 * Check if a payload is within the recommended size limit.
 */
export function isPayloadSizeOk(payload: QrPayload): boolean {
  return estimatePayloadSize(payload) <= MAX_RECOMMENDED_PAYLOAD_SIZE;
}
