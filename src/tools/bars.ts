/**
 * Experimental get_bars tool
 *
 * Fetches historical OHLCV bars from TradingView via WebSocket.
 * REQUIRES TV_EXPERIMENTAL_ENABLED=1 environment variable.
 */

import { TvWsClient } from "../ws/client.js";
import { ChartSession } from "../ws/session.js";
import { isExperimentalEnabled, getWsConfig } from "../ws/auth.js";
import { TimeoutError, SymbolError, ConnectionError } from "../ws/errors.js";
import type { Bar } from "../ws/types.js";

export interface GetBarsInput {
  /** Symbol in EXCHANGE:TICKER format (e.g., BINANCE:BTCUSDT) */
  symbol: string;
  /** Timeframe (default: "1D") */
  timeframe?: string;
  /** Number of bars to fetch (default: 300, max: 5000) */
  limit?: number;
  /** Use extended session (default: false) */
  extended_session?: boolean;
}

export interface GetBarsOutput {
  symbol: string;
  timeframe: string;
  count: number;
  bars: Bar[];
  source: string;
}

/**
 * Fetch historical OHLCV bars from TradingView
 *
 * Connects via WebSocket, creates a chart session, resolves
 * the symbol, fetches bars, and returns them.
 */
export async function getBars(input: GetBarsInput): Promise<GetBarsOutput> {
  if (!isExperimentalEnabled()) {
    throw new Error(
      "Experimental features are disabled. Set TV_EXPERIMENTAL_ENABLED=1 to enable."
    );
  }

  const {
    symbol,
    timeframe = "1D",
    limit = 300,
    extended_session = false,
  } = input;

  if (!symbol) {
    throw new Error("Symbol is required");
  }

  const effectiveLimit = Math.min(Math.max(limit, 1), 5000);

  const config = getWsConfig();
  const client = new TvWsClient({
    server: config.server as any,
    timeout: config.timeout,
    sessionToken: config.authToken,
  });

  let chartSession: ChartSession | null = null;

  try {
    // Connect
    await client.connect();

    // Create chart session
    chartSession = new ChartSession(client);

    // Set market
    chartSession.setMarket(symbol, {
      session: extended_session ? "extended" : "regular",
    });

    // Create series to fetch bars
    chartSession.createSeries(timeframe, effectiveLimit);

    // Wait for data
    const bars = await chartSession.waitForCompletion(config.timeout);

    return {
      symbol,
      timeframe,
      count: bars.length,
      bars,
      source: "experimental_tradingview_ws",
    };
  } catch (err) {
    if (err instanceof TimeoutError) {
      throw new Error(`Experimental bars fetch timed out after ${config.timeout}ms. The symbol may be invalid or the server may be slow.`);
    }
    if (err instanceof ConnectionError) {
      throw new Error(`TradingView websocket connection failed: ${err.message}`);
    }
    if (err instanceof SymbolError) {
      throw new Error(`Symbol error for ${symbol}: ${err.message}`);
    }
    throw err;
  } finally {
    // Cleanup
    chartSession?.delete();
    client.disconnect();
  }
}