/**
 * @mcc/core - Core package for Mobile Claude Code
 *
 * This package provides:
 * - End-to-end encryption utilities (TweetNaCl)
 * - Protocol types and Zod schemas
 * - QR code payload utilities for pairing
 */

// Crypto utilities
export {
  // Key management
  generateKeyPair,
  serializeKeyPair,
  deserializeKeyPair,
  // Encryption
  encrypt,
  decrypt,
  encryptString,
  decryptString,
  serializeEncryptedMessage,
  deserializeEncryptedMessage,
  // Key exchange
  deriveSharedSecret,
  // Utilities
  generateNonce,
  generateSessionId,
  toBase64,
  fromBase64,
  stringToBytes,
  bytesToString,
  constantTimeEqual,
  clearBytes,
  // Types
  type KeyPair,
  type SerializedKeyPair,
  type EncryptedMessage,
  type SerializedEncryptedMessage,
} from "./crypto";

// Protocol types and schemas
export {
  // Base types
  SessionIdSchema,
  PublicKeySchema,
  ClientRoleSchema,
  TimestampSchema,
  type SessionId,
  type PublicKey,
  type ClientRole,
  type Timestamp,
  // Handshake
  HandshakeInitSchema,
  HandshakeResponseSchema,
  HandshakeCompleteSchema,
  HandshakeMessageSchema,
  type HandshakeInit,
  type HandshakeResponse,
  type HandshakeComplete,
  type HandshakeMessage,
  // Encrypted envelope
  EncryptedEnvelopeSchema,
  type EncryptedEnvelope,
  // Agent states
  AgentStateSchema,
  type AgentState,
  // Events (desktop → mobile)
  AgentStateEventSchema,
  TextContentEventSchema,
  ToolUseEventSchema,
  ToolResultEventSchema,
  PermissionRequestEventSchema,
  DiffContentEventSchema,
  ErrorEventSchema,
  SessionEndedEventSchema,
  ClaudeEventSchema,
  type AgentStateEvent,
  type TextContentEvent,
  type ToolUseEvent,
  type ToolResultEvent,
  type PermissionRequestEvent,
  type DiffContentEvent,
  type ErrorEvent,
  type SessionEndedEvent,
  type ClaudeEvent,
  // Commands (mobile → desktop)
  SendMessageCommandSchema,
  ApprovePermissionCommandSchema,
  RejectPermissionCommandSchema,
  CancelOperationCommandSchema,
  DisconnectCommandSchema,
  CommandSchema,
  type SendMessageCommand,
  type ApprovePermissionCommand,
  type RejectPermissionCommand,
  type CancelOperationCommand,
  type DisconnectCommand,
  type Command,
  // Relay messages
  RelayMessageSchema,
  type RelayMessage,
  // Helpers
  createTimestamp,
  createEncryptedEnvelope,
} from "./protocol";

// QR code utilities
export {
  QR_PAYLOAD_VERSION,
  QrPayloadSchema,
  type QrPayload,
  createQrPayload,
  serializeQrPayload,
  parseQrPayload,
  qrPayloadToHandshakeInit,
  createQrCodeData,
  parseQrCodeData,
  isVersionSupported,
  estimatePayloadSize,
  isPayloadSizeOk,
  MAX_RECOMMENDED_PAYLOAD_SIZE,
} from "./qr-payload";
