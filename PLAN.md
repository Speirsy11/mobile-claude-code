# Mobile Claude Code - Implementation Plan

This document tracks the implementation progress for the Mobile Claude Code project.

---

## Epic 1: Core Package Foundation

Create the shared `@mcc/core` package containing crypto, protocol definitions, and shared types.

### 1.1 Package Setup
- [ ] Create `packages/core` directory structure
- [ ] Set up `package.json` with dependencies (tweetnacl, zod)
- [ ] Configure TypeScript and ESLint configs
- [ ] Add package to workspace

### 1.2 Cryptography Module
- [ ] Implement key pair generation using TweetNaCl
- [ ] Implement NaCl Box encryption/decryption helpers
- [ ] Implement ECDH shared secret derivation
- [ ] Create signing and verification utilities
- [ ] Add unit tests for all crypto functions

### 1.3 Protocol Types & Schemas
- [ ] Define `SessionID` type and generation
- [ ] Define handshake message schemas (Zod)
  - [ ] `HandshakeInit` (desktop → mobile via QR)
  - [ ] `HandshakeResponse` (mobile → desktop)
  - [ ] `HandshakeComplete` (desktop → mobile)
- [ ] Define encrypted message envelope schema
- [ ] Define Claude Code event types
  - [ ] `AgentState` (thinking, tool_use, idle, etc.)
  - [ ] `PermissionRequest`
  - [ ] `DiffContent`
  - [ ] `ToolResult`
  - [ ] `UserInput`
- [ ] Define command types (mobile → desktop)
  - [ ] `SendMessage`
  - [ ] `ApprovePermission`
  - [ ] `RejectPermission`
  - [ ] `CancelOperation`

### 1.4 QR Code Payload
- [ ] Define QR code data structure (SessionID + PublicKey + RelayURL)
- [ ] Implement serialization/deserialization
- [ ] Add validation for QR payload

---

## Epic 2: Relay Server

Build the "blind relay" WebSocket server for message routing.

### 2.1 Project Setup
- [ ] Create `apps/relay-server` directory
- [ ] Set up Fastify with TypeScript
- [ ] Configure WebSocket plugin (@fastify/websocket)
- [ ] Add health check endpoint
- [ ] Set up logging (pino)

### 2.2 Session Management
- [ ] Implement in-memory session store
- [ ] Session creation on first connection
- [ ] Session lookup by `session_id`
- [ ] Session cleanup on disconnect/timeout
- [ ] Handle session expiration (configurable TTL)

### 2.3 WebSocket Routing
- [ ] Implement connection handler
- [ ] Parse incoming messages for `session_id` and `role` (desktop/mobile)
- [ ] Route messages between paired clients
- [ ] Handle client reconnection
- [ ] Implement heartbeat/ping-pong for connection health

### 2.4 Deployment Configuration
- [ ] Create `Dockerfile` for relay server
- [ ] Create `fly.toml` configuration
- [ ] Set up environment variables
- [ ] Document deployment process
- [ ] Add rate limiting for abuse prevention

---

## Epic 3: Desktop Application (Host)

Build the Electron app that hosts Claude Code CLI and bridges to mobile.

### 3.1 Electron Setup
- [ ] Create `apps/desktop` directory
- [ ] Set up Electron with Vite and React
- [ ] Configure electron-builder for packaging
- [ ] Set up IPC communication between main/renderer
- [ ] Configure auto-updater (electron-updater)

### 3.2 Claude Code Integration
- [ ] Implement node-pty wrapper for Claude Code CLI
- [ ] Parse Claude Code stdout for structured events
- [ ] Handle stdin input forwarding
- [ ] Detect Claude Code states (thinking, tool use, waiting for input)
- [ ] Parse permission requests from Claude Code output
- [ ] Parse diff content from tool results

### 3.3 Pairing Flow (Desktop Side)
- [ ] Generate session ID and key pair on app start
- [ ] Connect to relay server
- [ ] Generate QR code with pairing data
- [ ] Display QR code in UI
- [ ] Handle handshake response from mobile
- [ ] Complete ECDH key exchange
- [ ] Transition to paired state

### 3.4 Message Handling
- [ ] Encrypt outgoing messages with shared secret
- [ ] Decrypt incoming messages from mobile
- [ ] Forward Claude Code events to mobile
- [ ] Process commands from mobile (input, permissions)
- [ ] Handle connection loss and reconnection

### 3.5 Desktop UI
- [ ] Pairing screen with QR code
- [ ] Connection status indicator
- [ ] Claude Code terminal view (local debugging)
- [ ] Session info display
- [ ] Disconnect/reset session button
- [ ] System tray integration (optional)

---

## Epic 4: Mobile Application (Client)

Enhance the Expo app to be the rich Claude Code remote client.

### 4.1 QR Scanner & Pairing
- [ ] Add expo-camera or expo-barcode-scanner
- [ ] Implement QR code scanning screen
- [ ] Parse and validate QR payload
- [ ] Generate mobile key pair
- [ ] Connect to relay server
- [ ] Send handshake response
- [ ] Complete ECDH key exchange
- [ ] Store session securely (expo-secure-store)

### 4.2 WebSocket Client
- [ ] Implement WebSocket connection to relay
- [ ] Handle reconnection with exponential backoff
- [ ] Implement heartbeat mechanism
- [ ] Connection state management (connecting, connected, disconnected)

### 4.3 Message Encryption
- [ ] Encrypt outgoing commands
- [ ] Decrypt incoming events
- [ ] Handle decryption failures gracefully

### 4.4 Agent-Aware UI Components
- [ ] **AgentStatusBar** - Shows current agent state (thinking, executing, idle)
- [ ] **MessageList** - Conversation history with FlashList
- [ ] **ThinkingIndicator** - Animated thinking state
- [ ] **ToolUseCard** - Displays tool being used with parameters
- [ ] **PermissionPrompt** - Approve/reject permission requests
- [ ] **DiffViewer** - Syntax-highlighted diff display
- [ ] **InputBar** - Text input with send button
- [ ] **ConnectionStatus** - Connection health indicator

### 4.5 State Management
- [ ] Set up state store (Zustand or Legend State)
- [ ] Conversation history state
- [ ] Current agent state
- [ ] Pending permission requests queue
- [ ] Connection state
- [ ] Session/crypto state

### 4.6 Navigation & Screens
- [ ] **ScanScreen** - QR code scanner for pairing
- [ ] **SessionScreen** - Main conversation/control interface
- [ ] **SettingsScreen** - App settings, disconnect option
- [ ] Handle deep linking for session restoration

---

## Epic 5: Claude Code Output Parsing

Implement robust parsing of Claude Code CLI output into structured events.

### 5.1 Output Parser
- [ ] Research Claude Code output format
- [ ] Implement streaming text parser
- [ ] Detect message boundaries
- [ ] Extract agent state transitions
- [ ] Parse tool use blocks
- [ ] Parse permission request patterns
- [ ] Parse diff/code blocks
- [ ] Handle ANSI escape codes

### 5.2 Event Normalization
- [ ] Convert parsed output to protocol event types
- [ ] Add timestamps to events
- [ ] Handle partial/streaming content
- [ ] Deduplicate repeated events

---

## Epic 6: Security Hardening

Ensure the system meets security requirements.

### 6.1 Cryptographic Security
- [ ] Audit crypto implementation
- [ ] Ensure proper nonce handling (never reuse)
- [ ] Implement key rotation mechanism
- [ ] Secure key storage on both platforms
- [ ] Clear sensitive data from memory when done

### 6.2 Relay Security
- [ ] Verify relay cannot decrypt messages
- [ ] Implement connection authentication
- [ ] Add abuse prevention (rate limiting, max connections)
- [ ] Log security-relevant events (without payload content)

### 6.3 Session Security
- [ ] Implement session timeout
- [ ] Allow manual session termination
- [ ] Detect and handle MITM attempts
- [ ] Secure session ID generation (cryptographically random)

---

## Epic 7: Testing & Quality

Comprehensive testing across all components.

### 7.1 Unit Tests
- [ ] Core package crypto tests
- [ ] Protocol serialization tests
- [ ] Parser tests with sample Claude Code output
- [ ] Relay session management tests

### 7.2 Integration Tests
- [ ] End-to-end pairing flow test
- [ ] Message encryption/decryption round-trip
- [ ] Relay message routing test
- [ ] Reconnection handling test

### 7.3 E2E Tests
- [ ] Full flow: pair → send message → receive response
- [ ] Permission approval flow
- [ ] Connection loss and recovery
- [ ] Multi-session isolation

---

## Epic 8: Deployment & Distribution

Prepare for production deployment and app distribution.

### 8.1 Relay Server Deployment
- [ ] Deploy to Fly.io
- [ ] Set up monitoring and alerts
- [ ] Configure auto-scaling
- [ ] Set up staging environment

### 8.2 Desktop Distribution
- [ ] Configure code signing (macOS, Windows)
- [ ] Set up auto-update server
- [ ] Create installer packages
- [ ] Publish to GitHub Releases

### 8.3 Mobile Distribution
- [ ] Configure EAS Build
- [ ] Set up App Store submission
- [ ] Set up Play Store submission
- [ ] Configure OTA updates

---

## Implementation Order (Recommended)

1. **Epic 1** (Core) - Foundation for everything else
2. **Epic 2** (Relay) - Enables communication testing
3. **Epic 5** (Parser) - Understand Claude Code output format
4. **Epic 3** (Desktop) - Host application
5. **Epic 4** (Mobile) - Client application
6. **Epic 6** (Security) - Harden before production
7. **Epic 7** (Testing) - Ensure reliability
8. **Epic 8** (Deployment) - Ship it

---

## Progress Summary

| Epic | Status | Progress |
|------|--------|----------|
| 1. Core Package | Not Started | 0/17 |
| 2. Relay Server | Not Started | 0/19 |
| 3. Desktop App | Not Started | 0/24 |
| 4. Mobile App | Not Started | 0/26 |
| 5. Output Parser | Not Started | 0/10 |
| 6. Security | Not Started | 0/12 |
| 7. Testing | Not Started | 0/11 |
| 8. Deployment | Not Started | 0/11 |
| **Total** | **Not Started** | **0/130** |
