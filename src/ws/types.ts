/**
 * TradingView WebSocket types
 * Types for the experimental websocket-based data access
 */

/** Supported timeframe values for TradingView charts */
export type Timeframe =
  | "1"
  | "3"
  | "5"
  | "15"
  | "30"
  | "45"
  | "60"
  | "120"
  | "180"
  | "240"
  | "1D"
  | "1W"
  | "1M";

/** OHLCV bar data */
export interface Bar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/** Real-time quote data */
export interface Quote {
  symbol: string;
  time?: number;
  price?: number;
  bid?: number;
  ask?: number;
  volume?: number;
  change?: number;
  changePercent?: number;
  high?: number;
  low?: number;
  open?: number;
  prevClose?: number;
  description?: string;
  exchange?: string;
  type?: string;
  currency?: string;
}

/** WebSocket client configuration */
export interface WsConfig {
  /** WebSocket endpoint server: 'data' (default), 'prodata', 'widgetdata' */
  server?: "data" | "prodata" | "widgetdata";
  /** Connection timeout in ms (default: 10000) */
  timeout?: number;
  /** Session auth token (default: 'unauthorized_user_token') */
  sessionToken?: string;
  /** Optional session signature */
  sessionSign?: string;
}

/** Parsed session message from TradingView WebSocket */
export interface SessionMessage {
  type: string;
  data: any[];
}

/** Result from creating a series (bars fetch) */
export interface SeriesResult {
  symbol: string;
  timeframe: string;
  bars: Bar[];
  count: number;
}

/** Bar stream event */
export interface BarEvent {
  kind: "update" | "close";
  bar: Bar;
}

/** Quote stream event */
export interface QuoteEvent {
  symbol: string;
  time: number;
  price?: number;
  bid?: number;
  ask?: number;
  volume?: number;
}

/** Valid quote field names */
export type QuoteField =
  | "lp"
  | "bid"
  | "ask"
  | "volume"
  | "ch"
  | "chp"
  | "open_price"
  | "high_price"
  | "low_price"
  | "prev_close_price"
  | "description"
  | "exchange"
  | "type"
  | "currency_code"
  | "market_cap_basic"
  | "pricescale"
  | "minmov"
  | "minmove2";

/** Default quote fields to request */
export const DEFAULT_QUOTE_FIELDS: QuoteField[] = [
  "lp",
  "bid",
  "ask",
  "volume",
  "ch",
  "chp",
  "description",
  "exchange",
  "type",
  "currency_code",
];

/** All known timeframe values for validation */
export const VALID_TIMEFRAMES: Timeframe[] = [
  "1",
  "3",
  "5",
  "15",
  "30",
  "45",
  "60",
  "120",
  "180",
  "240",
  "1D",
  "1W",
  "1M",
];

/**
 * Interval mapping: friendly names to TradingView values
 * TradingView uses number strings for minutes and "1D"/"1W"/"1M" for longer
 */
export const INTERVAL_MAP: Record<string, Timeframe> = {
  "1m": "1",
  "3m": "3",
  "5m": "5",
  "15m": "15",
  "30m": "30",
  "45m": "45",
  "1h": "60",
  "2h": "120",
  "3h": "180",
  "4h": "240",
  "1d": "1D",
  "1w": "1W",
  "1M": "1M",
};