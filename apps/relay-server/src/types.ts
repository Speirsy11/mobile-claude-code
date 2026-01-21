import type { WebSocket } from "ws";

export type ClientRole = "desktop" | "mobile";

export interface Client {
  socket: WebSocket;
  role: ClientRole;
  connectedAt: Date;
  lastHeartbeat: Date;
}

export interface Session {
  id: string;
  desktop: Client | null;
  mobile: Client | null;
  createdAt: Date;
  expiresAt: Date;
}

export interface RelayMessage {
  session_id: string;
  role: ClientRole;
  type: "join" | "message" | "ping" | "leave";
  payload?: string;
}

export interface RelayResponse {
  type: "joined" | "peer_joined" | "peer_left" | "message" | "pong" | "error";
  payload?: string;
  error?: string;
}

export interface ServerConfig {
  host: string;
  port: number;
  sessionTtlMs: number;
  heartbeatIntervalMs: number;
  cleanupIntervalMs: number;
}

export const DEFAULT_CONFIG: ServerConfig = {
  host: process.env.HOST ?? "0.0.0.0",
  port: parseInt(process.env.PORT ?? "3001", 10),
  sessionTtlMs: parseInt(
    process.env.SESSION_TTL_MS ?? String(30 * 60 * 1000),
    10,
  ), // 30 minutes
  heartbeatIntervalMs: parseInt(
    process.env.HEARTBEAT_INTERVAL_MS ?? "30000",
    10,
  ), // 30 seconds
  cleanupIntervalMs: parseInt(process.env.CLEANUP_INTERVAL_MS ?? "60000", 10), // 1 minute
};
