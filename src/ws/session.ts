/**
 * TradingView WebSocket sessions
 *
 * Manages chart and quote sessions for real-time data.
 * Chart sessions are used for bar/candle data.
 * Quote sessions are used for real-time price quotes.
 */

import { EventEmitter } from "events";
import { TvWsClient } from "./client.js";
import {
  genSessionId,
  createChartSession,
  createQuoteSession,
  createQuoteSetFields,
  createResolveSymbol,
  createSeries,
  createQuoteAddSymbols,
  createQuoteFastSymbols,
  createQuoteRemoveSymbols,
  createDeleteChartSession,
  createDeleteQuoteSession,
  createSwitchTimezone,
} from "./protocol.js";
import type { Timeframe, Bar, Quote, QuoteField, DEFAULT_QUOTE_FIELDS } from "./types.js";
import { SymbolError, TimeoutError } from "./errors.js";

/**
 * Chart session for fetching bar/candle data
 */
export class ChartSession extends EventEmitter {
  private sessionId: string;
  private client: TvWsClient;
  private symbolKey: string = "";
  private seriesCreated = false;
  private bars: Bar[] = [];
  private symbolInfo: any = null;
  private completed = false;
  private resolveCompletion?: () => void;
  private rejectCompletion?: (err: Error) => void;

  constructor(client: TvWsClient) {
    super();
    this.client = client;
    this.sessionId = genSessionId("cs_");

    // Register session handler
    this.client.registerSession(this.sessionId, (message) => {
      this.handleMessage(message);
    });

    // Create the chart session
    this.client.send("chart_create_session", [this.sessionId, ""]);
  }

  /**
   * Set the market/symbol for this chart session
   */
  setMarket(symbol: string, options?: {
    timeframe?: string;
    range?: number;
    session?: "regular" | "extended";
  }): void {
    this.bars = [];
    this.completed = false;
    this.symbolKey = `symbol_${Date.now()}`;

    const symbolObj: any = {
      symbol,
      adjustment: "splits",
    };

    if (options?.session) {
      symbolObj.session = options.session === "extended" ? "extended" : "regular";
    }

    // Resolve symbol
    this.client.send("resolve_symbol", [
      this.sessionId,
      this.symbolKey,
      `=${JSON.stringify(symbolObj)}`,
    ]);
  }

  /**
   * Create a series to fetch bars
   */
  createSeries(timeframe: string = "1D", count: number = 300): void {
    this.bars = [];
    this.completed = false;

    this.client.send("create_series", [
      this.sessionId,
      "s1",
      "s1",
      this.symbolKey || "symbol_1",
      timeframe,
      count,
    ]);

    // Set timezone
    this.client.send("switch_timezone", [this.sessionId, "Etc/UTC"]);
  }

  /**
   * Wait for series data to complete
   */
  async waitForCompletion(timeoutMs: number = 10000): Promise<Bar[]> {
    if (this.completed) {
      return this.bars;
    }

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        // Return whatever we have on timeout
        resolve(this.bars);
      }, timeoutMs);

      this.once("completed", () => {
        clearTimeout(timer);
        resolve(this.bars);
      });

      this.once("error", (err: Error) => {
        clearTimeout(timer);
        reject(err);
      });
    });
  }

  /**
   * Handle messages for this chart session
   */
  private handleMessage(message: { type: string; data: any[] }): void {
    const { type, data } = message;

    if (type === "timescale_update" || type === "du") {
      // Bar data update
      this.handleTimescaleUpdate(data);
    } else if (type === "series_completed") {
      this.completed = true;
      this.emit("completed", this.bars);
    } else if (type === "symbol_resolved") {
      this.symbolInfo = data[1] || data[2];
      this.emit("symbolLoaded", this.symbolInfo);
    } else if (type === "symbol_error") {
      this.emit("error", new SymbolError(
        data[1] || "unknown",
        `Symbol error: ${data[2] || "unknown error"}`
      ));
    } else if (type === "series_error") {
      this.emit("error", new SymbolError(
        this.symbolKey,
        `Series error: ${data[3] || "unknown error"}`
      ));
    }
  }

  /**
   * Parse timescale update data into bars
   */
  private handleTimescaleUpdate(data: any[]): void {
    // Data format: [sessionId, { seriesId: { s: [{ i: idx, v: [time, open, close, max, min, volume] }] } }]
    const updateData = data[1];
    if (!updateData || typeof updateData !== "object") return;

    for (const [seriesId, seriesData] of Object.entries(updateData)) {
      if (!seriesData || typeof seriesData !== "object") continue;

      const seriesObj = seriesData as any;
      if (!seriesObj.s || !Array.isArray(seriesObj.s)) continue;

      for (const barData of seriesObj.s) {
        const values = barData.v || barData;
        if (!Array.isArray(values) || values.length < 6) continue;

        const bar: Bar = {
          time: values[0],
          open: values[1],
          high: values[2] ?? values[4], // max or close fallback
          low: values[3] ?? values[4],  // min or close fallback
          close: values[4],
          volume: values[5] ?? 0,
        };

        // Deduplicate by time — keep latest
        const existing = this.bars.findIndex((b) => b.time === bar.time);
        if (existing >= 0) {
          this.bars[existing] = bar;
        } else {
          this.bars.push(bar);
        }
      }
    }

    // Sort bars by time ascending
    this.bars.sort((a, b) => a.time - b.time);
    this.emit("update", this.bars);
  }

  /**
   * Get current bars
   */
  getBars(): Bar[] {
    return [...this.bars].sort((a, b) => a.time - b.time);
  }

  /**
   * Get symbol info
   */
  getSymbolInfo(): any {
    return this.symbolInfo;
  }

  /**
   * Delete this chart session
   */
  delete(): void {
    this.client.send("chart_delete_session", [this.sessionId]);
    this.client.unregisterSession(this.sessionId);
    this.removeAllListeners();
  }
}

/**
 * Quote session for real-time price data
 */
export class QuoteSession extends EventEmitter {
  private sessionId: string;
  private client: TvWsClient;
  private quotes: Map<string, Quote> = new Map();
  private completedSymbols: Set<string> = new Set();

  constructor(client: TvWsClient, fields?: string[]) {
    super();
    this.client = client;
    this.sessionId = genSessionId("qs_");

    // Register session handler
    this.client.registerSession(this.sessionId, (message) => {
      this.handleMessage(message);
    });

    // Create the quote session
    this.client.send("quote_create_session", [this.sessionId]);

    // Set fields
    const quoteFields = fields || [
      "lp", "bid", "ask", "volume", "ch", "chp",
      "description", "exchange", "type", "currency_code",
    ];
    this.client.send("quote_set_fields", [this.sessionId, ...quoteFields]);
  }

  /**
   * Add symbols to track
   */
  addSymbols(symbols: string[]): void {
    const params: any[] = [this.sessionId];
    for (const sym of symbols) {
      params.push(sym);
    }
    this.client.send("quote_add_symbols", params);

    // Also set fast symbols for faster initial data
    this.client.send("quote_fast_symbols", [this.sessionId, ...symbols]);
  }

  /**
   * Remove symbols from tracking
   */
  removeSymbols(symbols: string[]): void {
    this.client.send("quote_remove_symbols", [this.sessionId, ...symbols]);
  }

  /**
   * Handle messages for this quote session
   */
  private handleMessage(message: { type: string; data: any[] }): void {
    const { type, data } = message;

    if (type === "qsd") {
      // Quote data update
      // data[1] contains { n: symbol, v: { lp, bid, ask, ... } }
      const quoteData = data[1];
      if (quoteData && quoteData.n) {
        const symbol = quoteData.n;
        const values = quoteData.v || {};
        const quote: Quote = {
          symbol,
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
        this.quotes.set(symbol, quote);
        this.emit("quote", quote);
      }
    } else if (type === "quote_completed") {
      // Symbol loading complete
      const symbol = data[1];
      if (symbol) {
        this.completedSymbols.add(symbol);
        this.emit("completed", symbol);
      }
    }
  }

  /**
   * Get current quotes
   */
  getQuotes(): Map<string, Quote> {
    return this.quotes;
  }

  /**
   * Get quote for a specific symbol
   */
  getQuote(symbol: string): Quote | undefined {
    return this.quotes.get(symbol);
  }

  /**
   * Delete this quote session
   */
  delete(): void {
    this.client.send("quote_delete_session", [this.sessionId]);
    this.client.unregisterSession(this.sessionId);
    this.removeAllListeners();
  }
}