# Project Context: Remote Bridge for Claude Code

## 1. Executive Summary

**Objective:** Build a secure, low-latency system allowing a user to control an interactive **Claude Code** CLI session running on their Desktop (macOS / Windows / Linux) from a Mobile Device (iOS / Android).

**Core Constraint:** The Mobile Client must render a rich, *agent-aware* UI (parsing state, permissions, and diffs) rather than a simple raw terminal stream.

**Connectivity:** Must work over the internet without port forwarding (NAT traversal via a relay).

---

## 2. System Architecture

### 2.1 Connectivity Strategy: The “Blind Relay”

- **Pattern:** WebSocket Relay (Client ⇄ Server ⇄ Client)
- **Infrastructure:** Node.js / Fastify server hosted on Fly.io
- **Behaviour:**  
  The Relay Server is intentionally *dumb*. It only routes messages based on `session_id` and cannot decrypt payloads.
- **Rationale:**  
  Avoids WebRTC complexity (reliable text delivery is more important than low-latency video) and mitigates port-forwarding security risks.

### 2.2 Security Model: Zero Trust

- **End-to-End Encryption (E2EE):**  
  All payloads are encrypted on-device using **TweetNaCl.js** (NaCl Box) before transmission.

- **Pairing Flow:**
  1. Desktop displays a QR code containing `SessionID` and `Desktop_PublicKey`
  2. Mobile scans the QR code and generates `Mobile_KeyPair`
  3. **Handshake:** Devices exchange public keys via the relay and derive a shared secret (ECDH)
  4. **Authentication:** Connection is accepted only if the handshake signature is valid

---

## 3. Monorepo Structure (TurboRepo)

```
/remote-bridge
├── apps/
│   ├── desktop/        # Electron + React (Vite) + node-pty (The Host)
│   ├── mobile/         # Expo (React Native) + FlashList (The Client)
│   └── relay-server/   # Fastify + WebSocket (Deployable to Fly.io)
└── packages/
    ├── core/           # Shared Zod schemas, crypto logic, protocol types
    ├── ui/             # Shared UI components (Tamagui / NativeWind)
    └── tsconfig/       # Shared TypeScript configs
```
