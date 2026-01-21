import type { Client, ClientRole, Session } from "./types.js";

export class SessionStore {
  private sessions = new Map<string, Session>();
  private sessionTtlMs: number;

  constructor(sessionTtlMs: number) {
    this.sessionTtlMs = sessionTtlMs;
  }

  /**
   * Get or create a session by ID
   */
  getOrCreate(sessionId: string): Session {
    let session = this.sessions.get(sessionId);
    if (!session) {
      const now = new Date();
      session = {
        id: sessionId,
        desktop: null,
        mobile: null,
        createdAt: now,
        expiresAt: new Date(now.getTime() + this.sessionTtlMs),
      };
      this.sessions.set(sessionId, session);
    }
    return session;
  }

  /**
   * Get a session by ID
   */
  get(sessionId: string): Session | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Add a client to a session
   */
  addClient(
    sessionId: string,
    client: Client,
  ): { session: Session; existingPeer: Client | null } {
    const session = this.getOrCreate(sessionId);
    const existingPeer =
      client.role === "desktop" ? session.mobile : session.desktop;

    if (client.role === "desktop") {
      session.desktop = client;
    } else {
      session.mobile = client;
    }

    // Extend session expiry when a client joins
    session.expiresAt = new Date(Date.now() + this.sessionTtlMs);

    return { session, existingPeer };
  }

  /**
   * Remove a client from a session
   */
  removeClient(sessionId: string, role: ClientRole): Client | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const client = role === "desktop" ? session.desktop : session.mobile;

    if (role === "desktop") {
      session.desktop = null;
    } else {
      session.mobile = null;
    }

    // If both clients are gone, we can remove the session
    if (!session.desktop && !session.mobile) {
      this.sessions.delete(sessionId);
    }

    return client;
  }

  /**
   * Get the peer client for a given role in a session
   */
  getPeer(sessionId: string, role: ClientRole): Client | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    return role === "desktop" ? session.mobile : session.desktop;
  }

  /**
   * Update heartbeat timestamp for a client
   */
  updateHeartbeat(sessionId: string, role: ClientRole): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const client = role === "desktop" ? session.desktop : session.mobile;
    if (client) {
      client.lastHeartbeat = new Date();
    }

    // Extend session expiry on heartbeat
    session.expiresAt = new Date(Date.now() + this.sessionTtlMs);
  }

  /**
   * Clean up expired sessions
   * Returns the number of sessions cleaned up
   */
  cleanupExpired(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [id, session] of this.sessions) {
      if (session.expiresAt.getTime() < now) {
        // Close any connected sockets
        if (session.desktop?.socket.readyState === 1) {
          session.desktop.socket.close(1000, "Session expired");
        }
        if (session.mobile?.socket.readyState === 1) {
          session.mobile.socket.close(1000, "Session expired");
        }
        this.sessions.delete(id);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Get statistics about the session store
   */
  getStats(): { totalSessions: number; activeSessions: number } {
    let activeSessions = 0;
    for (const session of this.sessions.values()) {
      if (session.desktop || session.mobile) {
        activeSessions++;
      }
    }
    return {
      totalSessions: this.sessions.size,
      activeSessions,
    };
  }
}
