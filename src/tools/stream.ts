/**
 * Experimental streaming tools
 *
 * Bounded quote streaming and bar streaming via WebSocket.
 * REQUIRES TV_EXPERIMENTAL_ENABLED=1 environment variable.
 */

import { TvWsClient } from "../ws/client.js";
import { QuoteSession, ChartSession } from "../ws/session.js";
import { isExperimentalEnabled, getWsConfig } from "../ws/auth.js";
import { TimeoutError, ConnectionError } from "../ws/errors.js";
import type { Bar, Quote, BarEvent } from "../ws/types.js";

export interface StreamQuotesInput {
  /** Symbols to stream quotes for */
  symbols: string[];
  /** Quote fields to request (default: standard set) */
  fields?: string[];
  /** Duration in seconds to collect (default: 10, max: 60) */
  duration_seconds?: number;
}

export interface StreamQuotesOutput {
  duration_seconds: number;
  updates: Quote[];
}

export interface StreamBarsInput {
  /** Symbol in EXCHANGE:TICKER format */
  symbol: string;
  /** Timeframe (default: "1") */
  timeframe?: string;
  /** Duration in seconds to collect (default: 30, max: 120) */
  duration_seconds?: number;
  /** Streaming mode */
  mode?: "rolling" | "close_only";
}

export interface StreamBarsOutput {
  symbol: string;
  timeframe: string;
  mode: string;
  events: BarEvent[];
}

/**
 * Stream real-time quotes for a bounded duration
 *
 * Opens a quote session, collects updates for the specified
 * duration, and returns them as a batch.
 */
export async function streamQuotes(input: StreamQuotesInput): Promise<StreamQuotesOutput> {
  if (!isExperimentalEnabled()) {
    throw new Error(
      "Experimental features are disabled. Set TV_EXPERIMENTAL_ENABLED=1 to enable."
    );
  }

  const {
    symbols,
    fields,
    duration_seconds = 10,
  } = input;

  if (!symbols || symbols.length === 0) {
    throw new Error("At least one symbol is required");
  }

  const effectiveDuration = Math.min(Math.max(duration_seconds, 1), 60);
  const config = getWsConfig();
  const client = new TvWsClient({
    server: config.server as any,
    timeout: config.timeout,
    sessionToken: config.authToken,
  });

  let quoteSession: QuoteSession | null = null;
  const updates: Quote[] = [];

  try {
    await client.connect();

    quoteSession = new QuoteSession(client, fields);

    // Set up quote handler
    quoteSession.on("quote", (quote: Quote) => {
      updates.push(quote);
    });

    // Add symbols
    quoteSession.addSymbols(symbols);

    // Wait for the specified duration
    await new Promise((resolve) => setTimeout(resolve, effectiveDuration * 1000));

    return {
      duration_seconds: effectiveDuration,
      updates,
    };
  } catch (err) {
    if (err instanceof ConnectionError) {
      throw new Error(`TradingView websocket connection failed: ${err.message}`);
    }
    throw err;
  } finally {
    quoteSession?.delete();
    client.disconnect();
  }
}

/**
 * Stream bar updates for a bounded duration
 *
 * Opens a chart session, collects bar events for the specified
 * duration, and returns them as a batch.
 */
export async function streamBars(input: StreamBarsInput): Promise<StreamBarsOutput> {
  if (!isExperimentalEnabled()) {
    throw new Error(
      "Experimental features are disabled. Set TV_EXPERIMENTAL_ENABLED=1 to enable."
    );
  }

  const {
    symbol,
    timeframe = "1",
    duration_seconds = 30,
    mode = "rolling",
  } = input;

  if (!symbol) {
    throw new Error("Symbol is required");
  }

  const effectiveDuration = Math.min(Math.max(duration_seconds, 1), 120);
  const config = getWsConfig();
  const client = new TvWsClient({
    server: config.server as any,
    timeout: config.timeout,
    sessionToken: config.authToken,
  });

  let chartSession: ChartSession | null = null;
  const events: BarEvent[] = [];
  let lastCloseTime = 0;

  try {
    await client.connect();

    chartSession = new ChartSession(client);
    chartSession.setMarket(symbol);
    chartSession.createSeries(timeframe, 1);

    // Set up update handler
    chartSession.on("update", (bars: Bar[]) => {
      if (bars.length === 0) return;
      const latestBar = bars[bars.length - 1];

      if (mode === "close_only") {
        // Only emit when a bar closes (time changes)
        if (latestBar.time !== lastCloseTime && lastCloseTime !== 0) {
          events.push({
            kind: "close",
            bar: latestBar,
          });
        }
        lastCloseTime = latestBar.time;
      } else {
        // Rolling mode - emit every update
        events.push({
          kind: "update",
          bar: latestBar,
        });
      }
    });

    // Wait for the specified duration
    await new Promise((resolve) => setTimeout(resolve, effectiveDuration * 1000));

    return {
      symbol,
      timeframe,
      mode,
      events,
    };
  } catch (err) {
    if (err instanceof ConnectionError) {
      throw new Error(`TradingView websocket connection failed: ${err.message}`);
    }
    throw err;
  } finally {
    chartSession?.delete();
    client.disconnect();
  }
}