/**
 * TradingView WebSocket data parser
 *
 * Parses raw WebSocket messages into structured Bar and Quote data.
 * Handles compressed data (JSZip) and various message formats.
 */

import type { Bar, Quote } from "./types.js";

/**
 * Parse bar data from a timescale_update message
 *
 * The data structure varies by TradingView version but generally:
 * - data[0] is the session ID
 * - data[1] is an object keyed by series ID
 *   - Each series has an 's' array of bar objects
 *   - Each bar has 'i' (index) and 'v' (values array)
 *   - Values: [time, open, close, max, min, volume] or [time, open, high, low, close, volume]
 *
 * @param seriesData - The series data object from a timescale_update message
 * @returns Parsed bars sorted by time ascending
 */
export function parseBarData(seriesData: any): Bar[] {
  const bars: Bar[] = [];

  if (!seriesData || typeof seriesData !== "object") {
    return bars;
  }

  // Handle both direct series data and nested structures
  for (const [, seriesValue] of Object.entries(seriesData)) {
    if (!seriesValue || typeof seriesValue !== "object") continue;

    const seriesObj = seriesValue as any;
    const seriesBars = seriesObj.s || seriesObj;

    if (!Array.isArray(seriesBars)) continue;

    for (const barData of seriesBars) {
      // barData can be { i: idx, v: [time, ...] } or just [time, ...]
      const values = Array.isArray(barData)
        ? barData
        : barData.v;

      if (!Array.isArray(values) || values.length < 5) continue;

      // TradingView sometimes sends: time, open, close, max, min, vol
      // But sometimes: time, open, high, low, close, vol
      // We normalize to: time, open, high, low, close, vol
      const bar: Bar = {
        time: typeof values[0] === "number" ? values[0] : Math.floor(Date.now() / 1000),
        open: typeof values[1] === "number" ? values[1] : 0,
        high: typeof values[2] === "number" ? values[2] : 0,
        low: typeof values[3] === "number" ? values[3] : 0,
        close: typeof values[4] === "number" ? values[4] : 0,
        volume: typeof values[5] === "number" ? Math.round(values[5] * 100) / 100 : 0,
      };

      bars.push(bar);
    }
  }

  // Sort ascending by time
  return bars.sort((a, b) => a.time - b.time);
}

/**
 * Parse quote data from a qsd message
 *
 * @param quoteRawData - The quote data from a qsd/quote_completed message
 * @returns Parsed quote object or null if invalid
 */
export function parseQuoteData(quoteRawData: any): Quote | null {
  if (!quoteRawData) return null;

  // qsd format: { n: "EXCHANGE:SYMBOL", v: { lp: ..., bid: ..., ... } }
  if (quoteRawData.n && quoteRawData.v) {
    const values = quoteRawData.v;
    return {
      symbol: quoteRawData.n,
      price: values.lp ?? values.last_price,
      bid: values.bid,
      ask: values.ask,
      volume: values.volume,
      change: values.ch,
      changePercent: values.chp,
      high: values.high_price,
      low: values.low_price,
      open: values.open_price,
      prevClose: values.prev_close_price,
      description: values.description,
      exchange: values.exchange,
      type: values.type,
      currency: values.currency_code,
    };
  }

  return null;
}

/**
 * Detect if raw WebSocket data contains a series completion message
 * @param rawData - Raw WebSocket string
 * @returns true if series_completed is found
 */
export function isSeriesCompleted(rawData: string): boolean {
  return rawData.includes("series_completed");
}

/**
 * Detect if raw WebSocket data contains a timescale_update
 * @param rawData - Raw WebSocket string
 * @returns true if timescale_update is found
 */
export function isTimescaleUpdate(rawData: string): boolean {
  return rawData.includes("timescale_update") || rawData.includes('"du"');
}

/**
 * Detect if raw WebSocket data contains a quote update
 * @param rawData - Raw WebSocket string
 * @returns true if quote data (qsd) is found
 */
export function isQuoteUpdate(rawData: string): boolean {
  return rawData.includes('"qsd"');
}

/**
 * Detect if raw WebSocket data contains a symbol resolution error
 * @param rawData - Raw WebSocket string
 * @returns true if symbol_error is found
 */
export function isSymbolError(rawData: string): boolean {
  return rawData.includes("symbol_error");
}

/**
 * Detect if raw WebSocket data contains a protocol_error
 * @param rawData - Raw WebSocket string
 * @returns true if protocol_error is found
 */
export function isProtocolError(rawData: string): boolean {
  return rawData.includes("protocol_error");
}

/**
 * Normalize bar time values to seconds
 * TradingView sometimes sends time in seconds, sometimes in milliseconds
 * @param time - Raw time value
 * @returns Time in seconds (Unix epoch)
 */
export function normalizeTime(time: number): number {
  // If time is in milliseconds (> 1e12), convert to seconds
  if (time > 1e12) {
    return Math.floor(time / 1000);
  }
  return time;
}

/**
 * Format bar time as ISO string
 * @param time - Unix timestamp in seconds
 * @returns ISO date string
 */
export function formatBarTime(time: number): string {
  return new Date(time * 1000).toISOString();
}