/**
 * TradingView WebSocket module
 *
 * EXPERIMENTAL — browserless WebSocket adapter for TradingView data
 *
 * This module provides direct access to TradingView's real-time data
 * feed via their WebSocket protocol. It is NOT part of the stable
 * API surface and requires TV_EXPERIMENTAL_ENABLED=1.
 */

export { TvWsClient } from "./client.js";
export { ChartSession, QuoteSession } from "./session.js";
export { parseBarData, parseQuoteData, isSeriesCompleted, normalizeTime } from "./parser.js";
export { encodePacket, decodePacket, genSessionId } from "./protocol.js";
export { getAuthToken, isExperimentalEnabled, getWsConfig } from "./auth.js";
export {
  TvWsError,
  ConnectionError,
  AuthError,
  SymbolError,
  TimeoutError,
} from "./errors.js";
export type {
  Bar,
  Quote,
  WsConfig,
  SessionMessage,
  SeriesResult,
  BarEvent,
  QuoteEvent,
  QuoteField,
  Timeframe,
} from "./types.js";
export { VALID_TIMEFRAMES, INTERVAL_MAP, DEFAULT_QUOTE_FIELDS } from "./types.js";