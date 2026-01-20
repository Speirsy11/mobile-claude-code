import { describe, expect, it } from "vitest";

import {
  AgentStateSchema,
  ClaudeEventSchema,
  CommandSchema,
  createEncryptedEnvelope,
  createTimestamp,
  EncryptedEnvelopeSchema,
  HandshakeCompleteSchema,
  HandshakeInitSchema,
  HandshakeMessageSchema,
  HandshakeResponseSchema,
} from "../protocol";

describe("Handshake Schemas", () => {
  describe("HandshakeInit", () => {
    it("should validate valid handshake init", () => {
      const data = {
        type: "handshake_init",
        sessionId: "abc123",
        desktopPublicKey: "base64publickey==",
        relayUrl: "https://relay.example.com",
        version: "1.0",
      };

      const result = HandshakeInitSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should apply default version", () => {
      const data = {
        type: "handshake_init",
        sessionId: "abc123",
        desktopPublicKey: "base64publickey==",
        relayUrl: "https://relay.example.com",
      };

      const result = HandshakeInitSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.version).toBe("1.0");
      }
    });

    it("should reject invalid URL", () => {
      const data = {
        type: "handshake_init",
        sessionId: "abc123",
        desktopPublicKey: "base64publickey==",
        relayUrl: "not-a-url",
      };

      const result = HandshakeInitSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("HandshakeResponse", () => {
    it("should validate valid response", () => {
      const data = {
        type: "handshake_response",
        sessionId: "abc123",
        mobilePublicKey: "base64mobilekey==",
      };

      const result = HandshakeResponseSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe("HandshakeComplete", () => {
    it("should validate valid complete message", () => {
      const data = {
        type: "handshake_complete",
        sessionId: "abc123",
        success: true,
      };

      const result = HandshakeCompleteSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe("HandshakeMessage (discriminated union)", () => {
    it("should parse handshake_init correctly", () => {
      const data = {
        type: "handshake_init",
        sessionId: "abc123",
        desktopPublicKey: "key==",
        relayUrl: "https://relay.example.com",
      };

      const result = HandshakeMessageSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe("handshake_init");
      }
    });

    it("should parse handshake_response correctly", () => {
      const data = {
        type: "handshake_response",
        sessionId: "abc123",
        mobilePublicKey: "key==",
      };

      const result = HandshakeMessageSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe("handshake_response");
      }
    });

    it("should reject unknown type", () => {
      const data = {
        type: "unknown_type",
        sessionId: "abc123",
      };

      const result = HandshakeMessageSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });
});

describe("EncryptedEnvelope", () => {
  it("should validate valid envelope", () => {
    const data = {
      sessionId: "session123",
      sender: "desktop",
      ciphertext: "encrypteddata==",
      nonce: "randomnonce==",
      timestamp: Date.now(),
    };

    const result = EncryptedEnvelopeSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("should reject invalid sender role", () => {
    const data = {
      sessionId: "session123",
      sender: "unknown",
      ciphertext: "encrypteddata==",
      nonce: "randomnonce==",
      timestamp: Date.now(),
    };

    const result = EncryptedEnvelopeSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});

describe("AgentState", () => {
  it("should validate all agent states", () => {
    const validStates = [
      "idle",
      "thinking",
      "tool_use",
      "waiting_permission",
      "streaming",
      "error",
    ];

    for (const state of validStates) {
      const result = AgentStateSchema.safeParse(state);
      expect(result.success).toBe(true);
    }
  });

  it("should reject invalid state", () => {
    const result = AgentStateSchema.safeParse("invalid_state");
    expect(result.success).toBe(false);
  });
});

describe("ClaudeEvent (discriminated union)", () => {
  it("should parse agent_state event", () => {
    const data = {
      type: "agent_state",
      state: "thinking",
      timestamp: Date.now(),
    };

    const result = ClaudeEventSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("should parse text_content event", () => {
    const data = {
      type: "text_content",
      content: "Hello, I'm thinking about this...",
      role: "assistant",
      isPartial: false,
      timestamp: Date.now(),
    };

    const result = ClaudeEventSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("should parse tool_use event", () => {
    const data = {
      type: "tool_use",
      toolName: "read_file",
      toolId: "tool_123",
      input: { path: "/etc/hosts" },
      timestamp: Date.now(),
    };

    const result = ClaudeEventSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("should parse permission_request event", () => {
    const data = {
      type: "permission_request",
      requestId: "req_456",
      description: "Read file /etc/passwd",
      tool: "read_file",
      timestamp: Date.now(),
    };

    const result = ClaudeEventSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("should parse diff_content event", () => {
    const data = {
      type: "diff_content",
      filePath: "/src/index.ts",
      diff: "--- a/src/index.ts\n+++ b/src/index.ts\n@@ -1,1 +1,2 @@\n+console.log('hello');",
      timestamp: Date.now(),
    };

    const result = ClaudeEventSchema.safeParse(data);
    expect(result.success).toBe(true);
  });
});

describe("Command (discriminated union)", () => {
  it("should parse send_message command", () => {
    const data = {
      type: "send_message",
      content: "Hello Claude!",
      timestamp: Date.now(),
    };

    const result = CommandSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("should reject empty message content", () => {
    const data = {
      type: "send_message",
      content: "",
      timestamp: Date.now(),
    };

    const result = CommandSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("should parse approve_permission command", () => {
    const data = {
      type: "approve_permission",
      requestId: "req_123",
      timestamp: Date.now(),
    };

    const result = CommandSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("should parse reject_permission command", () => {
    const data = {
      type: "reject_permission",
      requestId: "req_123",
      timestamp: Date.now(),
    };

    const result = CommandSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("should parse cancel_operation command", () => {
    const data = {
      type: "cancel_operation",
      timestamp: Date.now(),
    };

    const result = CommandSchema.safeParse(data);
    expect(result.success).toBe(true);
  });
});

describe("Helper Functions", () => {
  describe("createTimestamp", () => {
    it("should return current timestamp", () => {
      const before = Date.now();
      const timestamp = createTimestamp();
      const after = Date.now();

      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe("createEncryptedEnvelope", () => {
    it("should create valid envelope", () => {
      const envelope = createEncryptedEnvelope(
        "session123",
        "desktop",
        "ciphertext==",
        "nonce==",
      );

      expect(envelope.sessionId).toBe("session123");
      expect(envelope.sender).toBe("desktop");
      expect(envelope.ciphertext).toBe("ciphertext==");
      expect(envelope.nonce).toBe("nonce==");
      expect(envelope.timestamp).toBeGreaterThan(0);

      const result = EncryptedEnvelopeSchema.safeParse(envelope);
      expect(result.success).toBe(true);
    });
  });
});
