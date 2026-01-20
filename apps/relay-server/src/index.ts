import fastifyWebsocket from "@fastify/websocket";
import Fastify from "fastify";

import { SessionStore } from "./session-store.js";
import { DEFAULT_CONFIG } from "./types.js";
import { setupWebSocket } from "./websocket.js";

const config = DEFAULT_CONFIG;

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL ?? "info",
    transport:
      process.env.NODE_ENV === "development"
        ? {
            target: "pino-pretty",
            options: {
              colorize: true,
            },
          }
        : undefined,
  },
});

const sessionStore = new SessionStore(config.sessionTtlMs);

// Health check endpoint
fastify.get("/health", () => {
  const stats = sessionStore.getStats();
  return {
    status: "ok",
    timestamp: new Date().toISOString(),
    sessions: stats,
  };
});

// Root endpoint
fastify.get("/", () => {
  return {
    name: "@mcc/relay-server",
    version: "0.1.0",
    description: "Mobile Claude Code blind relay server",
  };
});

// Register WebSocket plugin
await fastify.register(fastifyWebsocket);

// Setup WebSocket routes
setupWebSocket(fastify, sessionStore);

// Session cleanup interval
const cleanupInterval = setInterval(() => {
  const cleaned = sessionStore.cleanupExpired();
  if (cleaned > 0) {
    fastify.log.info({ cleaned }, "Cleaned up expired sessions");
  }
}, config.cleanupIntervalMs);

// Graceful shutdown
const shutdown = async (signal: string) => {
  fastify.log.info({ signal }, "Received shutdown signal");
  clearInterval(cleanupInterval);
  await fastify.close();
  process.exit(0);
};

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

// Start the server
try {
  await fastify.listen({ host: config.host, port: config.port });
  fastify.log.info(`Relay server listening on ${config.host}:${config.port}`);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
