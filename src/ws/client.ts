/**
 * TradingView WebSocket Client
 *
 * Low-level WebSocket client for connecting to TradingView's
 * real-time data feed. Handles connection, message dispatch,
 * and session management.
 *
 * This is an EXPERIMENTAL module. Do not use in stable tool paths.
 */

import WebSocket from "ws";
import { EventEmitter } from "events";
import { encodePacket, decodePacket, createPong } from "./protocol.js";
import { createSetAuthToken } from "./protocol.js";
import type { WsConfig, SessionMessage } from "./types.js";
import { ConnectionError, TimeoutError } from "./errors.js";

export type ClientEvent =
  | "connected"
  | "disconnected"
  | "error"
  | "message"
  | "ping";

interface PendingRequest {
  resolve: (data: any) => void;
  reject: (error: Error) => void;
  timer: NodeJS.Timeout;
}

/**
 * TradingView WebSocket client
 *
 * Connects to TradingView's data websocket, authenticates,
 * and dispatches messages to registered sessions.
 */
export class TvWsClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private config: Required<WsConfig> & { sessionSign?: string };
  private sessions: Map<string, (message: SessionMessage) => void> = new Map();
  private connected = false;
  private messageBuffer: string[] = [];
  private sentAuth = false;

  constructor(config?: WsConfig) {
    super();
    const defaultConfig = {
      server: "data" as const,
      timeout: 10000,
      sessionToken: "unauthorized_user_token",
    };
    const envConfig = {
      server: (process.env.TV_WS_ENDPOINT || "data") as "data" | "prodata" | "widgetdata",
      timeout: parseInt(process.env.TV_WS_TIMEOUT_MS || "10000", 10),
      sessionToken: process.env.TV_SESSION_ID || "unauthorized_user_token",
      sessionSign: process.env.TV_SESSION_SIGN,
    };
    this.config = { ...defaultConfig, ...envConfig, ...config } as Required<WsConfig> & { sessionSign?: string };
  }

  /**
   * Connect to TradingView WebSocket
   */
  async connect(): Promise<void> {
    if (this.connected && this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    const url = `wss://${this.config.server}.tradingview.com/socket.io/websocket?type=chart`;

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (!this.connected) {
          this.ws?.close();
          reject(new TimeoutError(`Connection timeout after ${this.config.timeout}ms`));
        }
      }, this.config.timeout);

      try {
        this.ws = new WebSocket(url, {
          origin: "https://www.tradingview.com",
        });
      } catch (err) {
        clearTimeout(timeout);
        reject(new ConnectionError(`Failed to create WebSocket: ${(err as Error).message}`));
        return;
      }

      this.ws.on("open", () => {
        clearTimeout(timeout);
        this.connected = true;
        this.sentAuth = false;

        // Send auth token on connect
        const authMsg = createSetAuthToken(this.config.sessionToken);
        this.sendRaw(authMsg);
        this.sentAuth = true;

        // Flush buffered messages
        this.flushBuffer();

        this.emit("connected");
        resolve();
      });

      this.ws.on("message", (data: WebSocket.Data) => {
        this.handleMessage(data.toString());
      });

      this.ws.on("close", () => {
        this.connected = false;
        this.emit("disconnected");
      });

      this.ws.on("error", (err: Error) => {
        clearTimeout(timeout);
        this.emit("error", new ConnectionError(`WebSocket error: ${err.message}`));
        if (!this.connected) {
          reject(new ConnectionError(`WebSocket error: ${err.message}`));
        }
      });
    });
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.connected = false;
    }
  }

  /**
   * Register a session handler
   * @param sessionId - Session ID to listen for
   * @param handler - Callback for messages targeting this session
   */
  registerSession(sessionId: string, handler: (message: SessionMessage) => void): void {
    this.sessions.set(sessionId, handler);
  }

  /**
   * Unregister a session handler
   * @param sessionId - Session ID to remove
   */
  unregisterSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  /**
   * Send a typed message to TradingView
   * @param type - Message type (e.g., 'create_series')
   * @param params - Message parameters
   */
  send(type: string, params: any[]): void {
    const message = { m: type, p: params };
    const encoded = encodePacket(message);

    if (this.connected && this.ws?.readyState === WebSocket.OPEN && this.sentAuth) {
      this.ws.send(encoded);
    } else {
      // Buffer until connected and auth'd
      this.messageBuffer.push(encoded);
    }
  }

  /**
   * Send a raw encoded message
   */
  private sendRaw(message: { m: string; p: string[] }): void {
    const encoded = encodePacket(message);
    if (this.connected && this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(encoded);
    } else {
      this.messageBuffer.push(encoded);
    }
  }

  /**
   * Flush buffered messages
   */
  private flushBuffer(): void {
    while (this.messageBuffer.length > 0 && this.connected && this.ws?.readyState === WebSocket.OPEN) {
      const msg = this.messageBuffer.shift()!;
      this.ws.send(msg);
    }
  }

  /**
   * Handle incoming message from WebSocket
   */
  private handleMessage(rawData: string): void {
    const packets = decodePacket(rawData);

    for (const packet of packets) {
      if (typeof packet === "number") {
        // Ping - respond with pong
        const pong = createPong(packet);
        if (this.ws?.readyState === WebSocket.OPEN) {
          this.ws.send(pong);
        }
        this.emit("ping", packet);
        continue;
      }

      if (packet.m === "protocol_error") {
        this.emit("error", new ConnectionError(`Protocol error: ${JSON.stringify(packet.p)}`));
        continue;
      }

      // Dispatch to session handlers
      const sessionId = packet.p?.[0];
      if (sessionId && typeof sessionId === "string" && this.sessions.has(sessionId)) {
        const handler = this.sessions.get(sessionId)!;
        handler({
          type: packet.m,
          data: packet.p,
        });
      } else {
        // Unhandled message - emit as generic message
        this.emit("message", {
          type: packet.m,
          data: packet.p,
        });
      }
    }
  }

  /**
   * Check if client is connected
   */
  isConnected(): boolean {
    return this.connected && this.ws?.readyState === WebSocket.OPEN;
  }
}