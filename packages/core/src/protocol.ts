/**
 * Protocol types and Zod schemas for the Mobile Claude Code bridge.
 *
 * This module defines:
 * - Handshake messages for pairing
 * - Encrypted message envelope
 * - Claude Code event types (desktop → mobile)
 * - Command types (mobile → desktop)
 */

import { z } from "zod/v4";

// ============================================================================
// Base Types
// ============================================================================

/**
 * Unique identifier for a session, base64-encoded.
 */
export const SessionIdSchema = z.string().min(1);
export type SessionId = z.infer<typeof SessionIdSchema>;

/**
 * Base64-encoded public key.
 */
export const PublicKeySchema = z.string().min(1);
export type PublicKey = z.infer<typeof PublicKeySchema>;

/**
 * Role of a connected client.
 */
export const ClientRoleSchema = z.enum(["desktop", "mobile"]);
export type ClientRole = z.infer<typeof ClientRoleSchema>;

/**
 * Timestamp in milliseconds since Unix epoch.
 */
export const TimestampSchema = z.number().int().positive();
export type Timestamp = z.infer<typeof TimestampSchema>;

// ============================================================================
// Handshake Messages
// ============================================================================

/**
 * Initial handshake data sent via QR code (desktop → mobile).
 * Contains the session ID, desktop's public key, and relay URL.
 */
export const HandshakeInitSchema = z.object({
  type: z.literal("handshake_init"),
  sessionId: SessionIdSchema,
  desktopPublicKey: PublicKeySchema,
  relayUrl: z.url(),
  version: z.string().default("1.0"),
});
export type HandshakeInit = z.infer<typeof HandshakeInitSchema>;

/**
 * Response from mobile after scanning QR code (mobile → desktop via relay).
 */
export const HandshakeResponseSchema = z.object({
  type: z.literal("handshake_response"),
  sessionId: SessionIdSchema,
  mobilePublicKey: PublicKeySchema,
});
export type HandshakeResponse = z.infer<typeof HandshakeResponseSchema>;

/**
 * Final handshake confirmation (desktop → mobile via relay).
 * After this, both sides have derived the shared secret.
 */
export const HandshakeCompleteSchema = z.object({
  type: z.literal("handshake_complete"),
  sessionId: SessionIdSchema,
  success: z.boolean(),
});
export type HandshakeComplete = z.infer<typeof HandshakeCompleteSchema>;

/**
 * Union of all handshake message types.
 */
export const HandshakeMessageSchema = z.discriminatedUnion("type", [
  HandshakeInitSchema,
  HandshakeResponseSchema,
  HandshakeCompleteSchema,
]);
export type HandshakeMessage = z.infer<typeof HandshakeMessageSchema>;

// ============================================================================
// Encrypted Message Envelope
// ============================================================================

/**
 * Encrypted message wrapper sent over the relay.
 * The relay cannot decrypt the payload.
 */
export const EncryptedEnvelopeSchema = z.object({
  sessionId: SessionIdSchema,
  sender: ClientRoleSchema,
  /** Base64-encoded ciphertext */
  ciphertext: z.string(),
  /** Base64-encoded nonce */
  nonce: z.string(),
  /** Timestamp for replay protection */
  timestamp: TimestampSchema,
});
export type EncryptedEnvelope = z.infer<typeof EncryptedEnvelopeSchema>;

// ============================================================================
// Claude Code Agent States
// ============================================================================

/**
 * The current state of the Claude Code agent.
 */
export const AgentStateSchema = z.enum([
  "idle", // Waiting for user input
  "thinking", // Processing/reasoning
  "tool_use", // Executing a tool
  "waiting_permission", // Waiting for permission approval
  "streaming", // Streaming response text
  "error", // An error occurred
]);
export type AgentState = z.infer<typeof AgentStateSchema>;

// ============================================================================
// Claude Code Events (Desktop → Mobile)
// ============================================================================

/**
 * Agent state change event.
 */
export const AgentStateEventSchema = z.object({
  type: z.literal("agent_state"),
  state: AgentStateSchema,
  timestamp: TimestampSchema,
});
export type AgentStateEvent = z.infer<typeof AgentStateEventSchema>;

/**
 * Text content from the agent (assistant message or thinking).
 */
export const TextContentEventSchema = z.object({
  type: z.literal("text_content"),
  content: z.string(),
  role: z.enum(["assistant", "thinking"]),
  /** True if this is a partial/streaming update */
  isPartial: z.boolean().default(false),
  timestamp: TimestampSchema,
});
export type TextContentEvent = z.infer<typeof TextContentEventSchema>;

/**
 * Tool use event - agent is using a tool.
 */
export const ToolUseEventSchema = z.object({
  type: z.literal("tool_use"),
  toolName: z.string(),
  toolId: z.string(),
  /** Tool input parameters (JSON) */
  input: z.record(z.string(), z.unknown()),
  timestamp: TimestampSchema,
});
export type ToolUseEvent = z.infer<typeof ToolUseEventSchema>;

/**
 * Tool result event - result from a tool execution.
 */
export const ToolResultEventSchema = z.object({
  type: z.literal("tool_result"),
  toolId: z.string(),
  /** Result content (may include diffs, file contents, etc.) */
  result: z.string(),
  isError: z.boolean().default(false),
  timestamp: TimestampSchema,
});
export type ToolResultEvent = z.infer<typeof ToolResultEventSchema>;

/**
 * Permission request event - agent needs user approval.
 */
export const PermissionRequestEventSchema = z.object({
  type: z.literal("permission_request"),
  requestId: z.string(),
  /** Human-readable description of what permission is needed */
  description: z.string(),
  /** The tool or action requiring permission */
  tool: z.string(),
  /** Optional details about the action */
  details: z.string().optional(),
  timestamp: TimestampSchema,
});
export type PermissionRequestEvent = z.infer<
  typeof PermissionRequestEventSchema
>;

/**
 * Diff content event - file changes to display.
 */
export const DiffContentEventSchema = z.object({
  type: z.literal("diff_content"),
  filePath: z.string(),
  /** Unified diff format */
  diff: z.string(),
  timestamp: TimestampSchema,
});
export type DiffContentEvent = z.infer<typeof DiffContentEventSchema>;

/**
 * Error event from the desktop.
 */
export const ErrorEventSchema = z.object({
  type: z.literal("error"),
  message: z.string(),
  code: z.string().optional(),
  timestamp: TimestampSchema,
});
export type ErrorEvent = z.infer<typeof ErrorEventSchema>;

/**
 * Session ended event.
 */
export const SessionEndedEventSchema = z.object({
  type: z.literal("session_ended"),
  reason: z.enum(["user_disconnect", "timeout", "error"]),
  timestamp: TimestampSchema,
});
export type SessionEndedEvent = z.infer<typeof SessionEndedEventSchema>;

/**
 * Union of all events sent from desktop to mobile.
 */
export const ClaudeEventSchema = z.discriminatedUnion("type", [
  AgentStateEventSchema,
  TextContentEventSchema,
  ToolUseEventSchema,
  ToolResultEventSchema,
  PermissionRequestEventSchema,
  DiffContentEventSchema,
  ErrorEventSchema,
  SessionEndedEventSchema,
]);
export type ClaudeEvent = z.infer<typeof ClaudeEventSchema>;

// ============================================================================
// Commands (Mobile → Desktop)
// ============================================================================

/**
 * Send a user message to Claude.
 */
export const SendMessageCommandSchema = z.object({
  type: z.literal("send_message"),
  content: z.string().min(1),
  timestamp: TimestampSchema,
});
export type SendMessageCommand = z.infer<typeof SendMessageCommandSchema>;

/**
 * Approve a pending permission request.
 */
export const ApprovePermissionCommandSchema = z.object({
  type: z.literal("approve_permission"),
  requestId: z.string(),
  timestamp: TimestampSchema,
});
export type ApprovePermissionCommand = z.infer<
  typeof ApprovePermissionCommandSchema
>;

/**
 * Reject a pending permission request.
 */
export const RejectPermissionCommandSchema = z.object({
  type: z.literal("reject_permission"),
  requestId: z.string(),
  timestamp: TimestampSchema,
});
export type RejectPermissionCommand = z.infer<
  typeof RejectPermissionCommandSchema
>;

/**
 * Cancel the current operation (interrupt).
 */
export const CancelOperationCommandSchema = z.object({
  type: z.literal("cancel_operation"),
  timestamp: TimestampSchema,
});
export type CancelOperationCommand = z.infer<
  typeof CancelOperationCommandSchema
>;

/**
 * Disconnect from the session.
 */
export const DisconnectCommandSchema = z.object({
  type: z.literal("disconnect"),
  timestamp: TimestampSchema,
});
export type DisconnectCommand = z.infer<typeof DisconnectCommandSchema>;

/**
 * Union of all commands sent from mobile to desktop.
 */
export const CommandSchema = z.discriminatedUnion("type", [
  SendMessageCommandSchema,
  ApprovePermissionCommandSchema,
  RejectPermissionCommandSchema,
  CancelOperationCommandSchema,
  DisconnectCommandSchema,
]);
export type Command = z.infer<typeof CommandSchema>;

// ============================================================================
// Relay Messages (unencrypted routing layer)
// ============================================================================

/**
 * Message format for relay server routing.
 * The relay uses this to route messages but cannot read the encrypted payload.
 */
export const RelayMessageSchema = z.object({
  sessionId: SessionIdSchema,
  sender: ClientRoleSchema,
  /** Either a handshake message (unencrypted) or encrypted envelope */
  payload: z.union([HandshakeMessageSchema, EncryptedEnvelopeSchema]),
});
export type RelayMessage = z.infer<typeof RelayMessageSchema>;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a timestamp for the current time.
 */
export function createTimestamp(): Timestamp {
  return Date.now();
}

/**
 * Create an encrypted envelope.
 */
export function createEncryptedEnvelope(
  sessionId: SessionId,
  sender: ClientRole,
  ciphertext: string,
  nonce: string,
): EncryptedEnvelope {
  return {
    sessionId,
    sender,
    ciphertext,
    nonce,
    timestamp: createTimestamp(),
  };
}
