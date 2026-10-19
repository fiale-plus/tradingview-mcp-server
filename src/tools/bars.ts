import { validateBarsInput } from "../api/validation.js";
import { OUTPUT_SCHEMAS } from "../api/schemas.js";
import { createResultMetadata } from "../utils/resultMetadata.js";
import { fetchBars, type BarsClientOptions } from "../ws/client.js";
import { BAR_TIMEFRAMES } from "../api/types.js";

// Process-wide guard: no queue, so rate limiting never extends the 15s deadline.
let inFlight = false;
let lastConnectionStart = -Infinity;
const MIN_CONNECTION_GAP_MS = 2000;

export function isExperimentalEnabled(value = process.env.TV_EXPERIMENTAL_ENABLED): boolean {
  return value !== undefined && ["1", "true", "yes"].includes(value.toLowerCase());
}

export const EXPERIMENTAL_BARS_TOOL = {
  name: "experimental_get_bars",
  description: "[EXPERIMENTAL] Unofficial historical OHLCV bars via TradingView's anonymous public WebSocket. Data may be delayed or limited; may break without notice.",
  inputSchema: {
    type: "object" as const,
    properties: {
      symbol: { type: "string", maxLength: 128, pattern: "^[A-Za-z0-9_][A-Za-z0-9_.-]*:[A-Za-z0-9_][A-Za-z0-9_.!/-]*$", description: "EXCHANGE:TICKER, e.g. NASDAQ:AAPL" },
      timeframe: { type: "string", enum: BAR_TIMEFRAMES, default: "1D" },
      limit: { type: "integer", minimum: 1, maximum: 5000, default: 300 },
    },
    required: ["symbol"],
    additionalProperties: false,
  },
  outputSchema: OUTPUT_SCHEMAS.experimental_get_bars,
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
};

export async function getBars(value: unknown, options: BarsClientOptions & { now?: () => number } = {}) {
  if (!isExperimentalEnabled()) {
    throw new Error("experimental_get_bars is disabled; set TV_EXPERIMENTAL_ENABLED=1 (or true/yes) to enable");
  }
  const input = validateBarsInput(value);
  if (options.signal?.aborted) throw new Error("experimental_get_bars request cancelled");
  if (inFlight) throw new Error("another experimental_get_bars request is in flight");
  const now = (options.now ?? (() => performance.now()))();
  const retryAfter = Math.ceil(MIN_CONNECTION_GAP_MS - (now - lastConnectionStart));
  if (retryAfter > 0) throw new Error(`experimental_get_bars rate limited; retry after ${retryAfter}ms`);
  inFlight = true;
  lastConnectionStart = now;
  let bars;
  try {
    bars = await fetchBars(input, options);
  } finally {
    inFlight = false;
  }
  return {
    symbol: input.symbol,
    timeframe: input.timeframe,
    count: bars.length,
    bars,
    metadata: {
      ...createResultMetadata({ source: "experimental_tradingview_ws", requested_count: input.limit, returned_count: bars.length }),
      experimental: true as const,
    },
  };
}
