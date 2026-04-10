/**
 * TradingView WebSocket error types
 */

/** Base error for TradingView WebSocket operations */
export class TvWsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TvWsError";
  }
}

/** WebSocket connection errors */
export class ConnectionError extends TvWsError {
  constructor(message: string) {
    super(message);
    this.name = "ConnectionError";
  }
}

/** Authentication/session errors */
export class AuthError extends TvWsError {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

/** Symbol resolution errors */
export class SymbolError extends TvWsError {
  public symbol: string;
  constructor(symbol: string, message?: string) {
    super(message || `Symbol error: ${symbol}`);
    this.name = "SymbolError";
    this.symbol = symbol;
  }
}

/** Timeout errors */
export class TimeoutError extends TvWsError {
  constructor(message: string) {
    super(message);
    this.name = "TimeoutError";
  }
}