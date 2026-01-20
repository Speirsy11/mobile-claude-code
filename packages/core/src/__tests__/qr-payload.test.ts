import { describe, expect, it } from "vitest";

import type { QrPayload } from "../qr-payload";
import {
  createQrCodeData,
  createQrPayload,
  estimatePayloadSize,
  isPayloadSizeOk,
  isVersionSupported,
  MAX_RECOMMENDED_PAYLOAD_SIZE,
  parseQrCodeData,
  parseQrPayload,
  QR_PAYLOAD_VERSION,
  qrPayloadToHandshakeInit,
  serializeQrPayload,
} from "../qr-payload";

describe("QR Payload", () => {
  const testSessionId = "dGVzdHNlc3Npb24="; // base64
  const testPublicKey = "dGVzdHB1YmxpY2tleQ=="; // base64
  const testRelayUrl = "https://relay.example.com";

  describe("createQrPayload", () => {
    it("should create a valid QR payload", () => {
      const payload = createQrPayload(
        testSessionId,
        testPublicKey,
        testRelayUrl,
      );

      expect(payload.v).toBe(QR_PAYLOAD_VERSION);
      expect(payload.s).toBe(testSessionId);
      expect(payload.k).toBe(testPublicKey);
      expect(payload.r).toBe(testRelayUrl);
    });
  });

  describe("serializeQrPayload", () => {
    it("should serialize payload to JSON string", () => {
      const payload = createQrPayload(
        testSessionId,
        testPublicKey,
        testRelayUrl,
      );
      const serialized = serializeQrPayload(payload);

      expect(typeof serialized).toBe("string");
      expect(() => JSON.parse(serialized) as unknown).not.toThrow();
    });

    it("should be parseable back", () => {
      const payload = createQrPayload(
        testSessionId,
        testPublicKey,
        testRelayUrl,
      );
      const serialized = serializeQrPayload(payload);
      const parsed = JSON.parse(serialized) as QrPayload;

      expect(parsed.v).toBe(payload.v);
      expect(parsed.s).toBe(payload.s);
      expect(parsed.k).toBe(payload.k);
      expect(parsed.r).toBe(payload.r);
    });
  });

  describe("parseQrPayload", () => {
    it("should parse valid payload", () => {
      const payload = createQrPayload(
        testSessionId,
        testPublicKey,
        testRelayUrl,
      );
      const serialized = serializeQrPayload(payload);
      const parsed = parseQrPayload(serialized);

      expect(parsed).not.toBeNull();
      expect(parsed?.v).toBe(QR_PAYLOAD_VERSION);
      expect(parsed?.s).toBe(testSessionId);
      expect(parsed?.k).toBe(testPublicKey);
      expect(parsed?.r).toBe(testRelayUrl);
    });

    it("should return null for invalid JSON", () => {
      const result = parseQrPayload("not valid json");
      expect(result).toBeNull();
    });

    it("should return null for missing fields", () => {
      const result = parseQrPayload(JSON.stringify({ v: "1", s: "session" }));
      expect(result).toBeNull();
    });

    it("should return null for invalid URL", () => {
      const result = parseQrPayload(
        JSON.stringify({
          v: "1",
          s: "session",
          k: "key",
          r: "not-a-url",
        }),
      );
      expect(result).toBeNull();
    });
  });

  describe("qrPayloadToHandshakeInit", () => {
    it("should convert payload to HandshakeInit", () => {
      const payload = createQrPayload(
        testSessionId,
        testPublicKey,
        testRelayUrl,
      );
      const init = qrPayloadToHandshakeInit(payload);

      expect(init.type).toBe("handshake_init");
      expect(init.sessionId).toBe(testSessionId);
      expect(init.desktopPublicKey).toBe(testPublicKey);
      expect(init.relayUrl).toBe(testRelayUrl);
      expect(init.version).toBe(QR_PAYLOAD_VERSION);
    });
  });

  describe("createQrCodeData / parseQrCodeData", () => {
    it("should create and parse QR code data", () => {
      const data = createQrCodeData(testSessionId, testPublicKey, testRelayUrl);
      const init = parseQrCodeData(data);

      expect(init).not.toBeNull();
      expect(init?.type).toBe("handshake_init");
      expect(init?.sessionId).toBe(testSessionId);
      expect(init?.desktopPublicKey).toBe(testPublicKey);
      expect(init?.relayUrl).toBe(testRelayUrl);
    });

    it("should return null for invalid QR data", () => {
      const result = parseQrCodeData("invalid data");
      expect(result).toBeNull();
    });
  });

  describe("isVersionSupported", () => {
    it("should return true for current version", () => {
      const payload = createQrPayload(
        testSessionId,
        testPublicKey,
        testRelayUrl,
      );
      expect(isVersionSupported(payload)).toBe(true);
    });

    it("should return false for unsupported version", () => {
      const payload = {
        v: "999.0",
        s: testSessionId,
        k: testPublicKey,
        r: testRelayUrl,
      };
      expect(isVersionSupported(payload)).toBe(false);
    });
  });

  describe("Payload Size", () => {
    it("should estimate payload size", () => {
      const payload = createQrPayload(
        testSessionId,
        testPublicKey,
        testRelayUrl,
      );
      const size = estimatePayloadSize(payload);

      expect(size).toBeGreaterThan(0);
      expect(size).toBe(serializeQrPayload(payload).length);
    });

    it("should have reasonable max size constant", () => {
      expect(MAX_RECOMMENDED_PAYLOAD_SIZE).toBeGreaterThan(100);
      expect(MAX_RECOMMENDED_PAYLOAD_SIZE).toBeLessThanOrEqual(1000);
    });

    it("should check if payload size is ok", () => {
      const payload = createQrPayload(
        testSessionId,
        testPublicKey,
        testRelayUrl,
      );
      expect(isPayloadSizeOk(payload)).toBe(true);
    });

    it("should detect oversized payloads", () => {
      // Create a payload with a very long relay URL
      const longUrl = "https://relay.example.com/" + "x".repeat(600);
      const payload = createQrPayload(testSessionId, testPublicKey, longUrl);
      expect(isPayloadSizeOk(payload)).toBe(false);
    });
  });
});
