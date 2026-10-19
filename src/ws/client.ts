import WebSocket from "ws";
import { randomBytes } from "node:crypto";
import { decodePacket, encodePacket } from "./protocol.js";
import { parseBarData, type Bar } from "./parser.js";

export const BARS_ENDPOINT = "wss://data.tradingview.com/socket.io/websocket";
export const BARS_TIMEOUT_MS = 15_000;

/** Minimal transport surface for deterministic offline tests. */
export interface BarsTransport {
  on(event: "open", listener: () => void): unknown;
  on(event: "message", listener: (data: { toString(): string }) => void): unknown;
  on(event: "error", listener: (error: Error) => void): unknown;
  on(event: "close", listener: (code: number, reason: { toString(): string }) => void): unknown;
  send(data: string): void;
  terminate(): void;
}
export interface BarsClientOptions {
  timeoutMs?: number;
  transportFactory?: () => BarsTransport;
  signal?: AbortSignal;
}

export function fetchBars(
  input: { symbol: string; timeframe: string; limit: number },
  options: BarsClientOptions = {},
): Promise<Bar[]> {
  const timeoutMs = options.timeoutMs ?? BARS_TIMEOUT_MS;
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 60_000) {
    throw new Error("timeoutMs must be an integer between 1 and 60000");
  }
  if (options.signal?.aborted) {
    return Promise.reject(new Error("experimental_get_bars request cancelled"));
  }
  return new Promise((resolve, reject) => {
    let socket: BarsTransport | undefined;
    let settled = false;
    let bars: Bar[] = [];
    const session = `cs_${randomBytes(6).toString("hex")}`;
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      options.signal?.removeEventListener("abort", onAbort);
      // terminate also aborts a pending handshake; close() can wait indefinitely.
      try { socket?.terminate(); } catch { /* Preserve the original outcome. */ }
      if (error) reject(error);
      else resolve(bars.slice(-input.limit));
    };
    const timer = setTimeout(() => finish(new Error(`TradingView bars timed out after ${timeoutMs}ms`)), timeoutMs);
    const onAbort = () => finish(new Error("experimental_get_bars request cancelled"));
    const send = (m: string, p: unknown[]) => socket!.send(encodePacket({ m, p }));
    try {
      socket = options.transportFactory?.() ?? new WebSocket(BARS_ENDPOINT, {
        origin: "https://www.tradingview.com",
        handshakeTimeout: timeoutMs,
        maxPayload: 8 * 1024 * 1024,
      });
      socket.on("error", (error) => finish(new Error(`TradingView WebSocket error: ${error.message}`)));
      socket.on("close", (code, reason) => finish(new Error(`TradingView WebSocket closed before series completion (code ${code}, reason: ${reason?.toString() || "none"})`)));
      options.signal?.addEventListener("abort", onAbort, { once: true });
      if (options.signal?.aborted) onAbort();
      socket.on("open", () => {
        if (settled) return;
        try {
          send("set_auth_token", ["unauthorized_user_token"]);
          send("chart_create_session", [session, ""]);
          send("resolve_symbol", [session, "symbol_1", `=${JSON.stringify({ symbol: input.symbol, adjustment: "splits", session: "regular" })}`]);
          send("create_series", [session, "s1", "s1", "symbol_1", input.timeframe, input.limit]);
          send("switch_timezone", [session, "Etc/UTC"]);
        } catch (error) { finish(error instanceof Error ? error : new Error(String(error))); }
      });
      socket.on("message", (data) => {
        if (settled) return;
        try {
          for (const message of decodePacket(data.toString())) {
            if (settled) break;
            if (typeof message === "string") {
              socket!.send(encodePacket(message));
              continue;
            }
            const { m, p } = message;
            if (["symbol_error", "series_error", "critical_error", "protocol_error"].includes(m)) {
              const reason = p.at(-1);
              const detail = typeof reason === "string" && reason.length > 0 && reason !== session ? reason : JSON.stringify(p);
              throw new Error(`TradingView ${m} for ${input.symbol}: ${detail.slice(0, 300)}`);
            }
            if (p[0] !== session) continue;
            if (m === "timescale_update" || m === "du") {
              const update = p[1];
              if (typeof update === "object" && update !== null && "s1" in update) {
                bars = parseBarData(update.s1, bars).slice(-input.limit);
              }
            }
            if (m === "series_completed" && p[1] === "s1") {
              finish(bars.length === 0 ? new Error(`no bars returned for ${input.symbol}`) : undefined);
            }
          }
        } catch (error) { finish(error instanceof Error ? error : new Error(String(error))); }
      });
    } catch (error) { finish(error instanceof Error ? error : new Error(String(error))); }
  });
}
