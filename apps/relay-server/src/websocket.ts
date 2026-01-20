import type { FastifyInstance } from "fastify";
import type { WebSocket } from "ws";

import type { SessionStore } from "./session-store.js";
import type { ClientRole, RelayMessage, RelayResponse } from "./types.js";

interface ClientContext {
  sessionId: string | null;
  role: ClientRole | null;
}

function send(socket: WebSocket, message: RelayResponse): void {
  if (socket.readyState === 1) {
    socket.send(JSON.stringify(message));
  }
}

function parseMessage(data: string): RelayMessage | null {
  try {
    const parsed = JSON.parse(data) as unknown;
    if (typeof parsed !== "object" || parsed === null) return null;

    const msg = parsed as Record<string, unknown>;
    if (typeof msg.session_id !== "string") return null;
    if (msg.role !== "desktop" && msg.role !== "mobile") return null;
    if (!["join", "message", "ping", "leave"].includes(msg.type as string))
      return null;

    return {
      session_id: msg.session_id,
      role: msg.role,
      type: msg.type as RelayMessage["type"],
      payload: typeof msg.payload === "string" ? msg.payload : undefined,
    };
  } catch {
    return null;
  }
}

export function setupWebSocket(
  fastify: FastifyInstance,
  sessionStore: SessionStore,
): void {
  fastify.get("/ws", { websocket: true }, (socket: WebSocket) => {
    const ctx: ClientContext = {
      sessionId: null,
      role: null,
    };

    fastify.log.info("WebSocket connection established");

    socket.on("message", (data: Buffer) => {
      const message = parseMessage(data.toString());

      if (!message) {
        send(socket, { type: "error", error: "Invalid message format" });
        return;
      }

      switch (message.type) {
        case "join":
          handleJoin(socket, message, ctx, sessionStore, fastify);
          break;
        case "message":
          handleMessage(socket, message, ctx, sessionStore, fastify);
          break;
        case "ping":
          handlePing(socket, message, ctx, sessionStore);
          break;
        case "leave":
          handleLeave(socket, ctx, sessionStore, fastify);
          break;
      }
    });

    socket.on("close", () => {
      if (ctx.sessionId && ctx.role) {
        const peer = sessionStore.getPeer(ctx.sessionId, ctx.role);
        sessionStore.removeClient(ctx.sessionId, ctx.role);

        if (peer) {
          send(peer.socket, { type: "peer_left" });
        }

        fastify.log.info(
          { sessionId: ctx.sessionId, role: ctx.role },
          "Client disconnected",
        );
      }
    });

    socket.on("error", (err) => {
      fastify.log.error(
        { err, sessionId: ctx.sessionId, role: ctx.role },
        "WebSocket error",
      );
    });
  });
}

function handleJoin(
  socket: WebSocket,
  message: RelayMessage,
  ctx: ClientContext,
  sessionStore: SessionStore,
  fastify: FastifyInstance,
): void {
  // If already joined a session, leave it first
  if (ctx.sessionId && ctx.role) {
    const peer = sessionStore.getPeer(ctx.sessionId, ctx.role);
    sessionStore.removeClient(ctx.sessionId, ctx.role);
    if (peer) {
      send(peer.socket, { type: "peer_left" });
    }
  }

  const now = new Date();
  const { existingPeer } = sessionStore.addClient(message.session_id, {
    socket,
    role: message.role,
    connectedAt: now,
    lastHeartbeat: now,
  });

  ctx.sessionId = message.session_id;
  ctx.role = message.role;

  fastify.log.info(
    { sessionId: message.session_id, role: message.role },
    "Client joined session",
  );

  // Notify the joining client
  send(socket, { type: "joined" });

  // Notify peer if exists
  if (existingPeer) {
    send(existingPeer.socket, { type: "peer_joined" });
  }
}

function handleMessage(
  socket: WebSocket,
  message: RelayMessage,
  ctx: ClientContext,
  sessionStore: SessionStore,
  fastify: FastifyInstance,
): void {
  if (!ctx.sessionId || !ctx.role) {
    send(socket, { type: "error", error: "Not joined to a session" });
    return;
  }

  if (ctx.sessionId !== message.session_id || ctx.role !== message.role) {
    send(socket, { type: "error", error: "Session/role mismatch" });
    return;
  }

  const peer = sessionStore.getPeer(ctx.sessionId, ctx.role);
  if (!peer) {
    send(socket, { type: "error", error: "Peer not connected" });
    return;
  }

  // Forward the encrypted payload to the peer (blind relay)
  send(peer.socket, { type: "message", payload: message.payload });

  fastify.log.debug(
    { sessionId: ctx.sessionId, from: ctx.role },
    "Message relayed",
  );
}

function handlePing(
  socket: WebSocket,
  message: RelayMessage,
  ctx: ClientContext,
  sessionStore: SessionStore,
): void {
  if (ctx.sessionId && ctx.role) {
    sessionStore.updateHeartbeat(ctx.sessionId, ctx.role);
  }
  send(socket, { type: "pong" });
}

function handleLeave(
  socket: WebSocket,
  ctx: ClientContext,
  sessionStore: SessionStore,
  fastify: FastifyInstance,
): void {
  if (!ctx.sessionId || !ctx.role) {
    send(socket, { type: "error", error: "Not joined to a session" });
    return;
  }

  const peer = sessionStore.getPeer(ctx.sessionId, ctx.role);
  sessionStore.removeClient(ctx.sessionId, ctx.role);

  if (peer) {
    send(peer.socket, { type: "peer_left" });
  }

  fastify.log.info(
    { sessionId: ctx.sessionId, role: ctx.role },
    "Client left session",
  );

  ctx.sessionId = null;
  ctx.role = null;
}
