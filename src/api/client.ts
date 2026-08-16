/**
 * TradingView API Client
 */

import { createRequire } from "module";
import type { ScreenerCell, ScreenerRequest, ScreenerResponse } from "./types.js";
import {
  requestJson,
  type TransportOptions,
  UpstreamError,
} from "./transport.js";

const require = createRequire(import.meta.url);
const pkg = require("../../package.json");

const API_BASE = "https://scanner.tradingview.com";

function isScreenerCell(value: unknown): value is ScreenerCell {
  if (
    value === null
    || typeof value === "number"
    || typeof value === "string"
    || typeof value === "boolean"
  ) {
    return true;
  }
  if (Array.isArray(value)) {
    return value.every(isScreenerCell);
  }
  if (typeof value === "object") {
    return Object.values(value).every(isScreenerCell);
  }
  return false;
}

function isScreenerRow(
  value: unknown,
): value is ScreenerResponse["data"][number] {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  if (!("s" in value) || !("d" in value)) return false;
  return typeof value.s === "string"
    && Array.isArray(value.d)
    && value.d.every(isScreenerCell);
}

function isScreenerResponse(value: unknown): value is ScreenerResponse {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  if (!("totalCount" in value) || !("data" in value)) return false;
  const totalCount = value.totalCount;
  const data = value.data;
  return typeof totalCount === "number"
    && Number.isInteger(totalCount)
    && totalCount >= 0
    && Array.isArray(data)
    && data.every(isScreenerRow);
}

export function validateScreenerResponse(
  value: unknown,
  endpoint: string,
): ScreenerResponse {
  if (!isScreenerResponse(value)) {
    throw new Error(`TradingView returned malformed screener response for ${endpoint}`);
  }
  return value;
}

export class TradingViewClient {
  constructor(private readonly transportOptions: TransportOptions = {}) {}

  private async makeRequest(
    endpoint: string,
    payload: ScreenerRequest,
  ): Promise<ScreenerResponse> {
    try {
      const data = await requestJson(
        `${API_BASE}${endpoint}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "User-Agent": `tradingview-mcp-server/${pkg.version}`,
          },
          body: JSON.stringify(payload),
        },
        this.transportOptions,
      );
      return validateScreenerResponse(data, endpoint);
    } catch (error) {
      if (!(error instanceof UpstreamError)) throw error;
      if (error.kind === "timeout") {
        throw new Error("Request timeout", { cause: error });
      }
      if (error.kind === "http") {
        throw new Error(`TradingView API error: ${error.status} ${error.statusText ?? ""}`.trimEnd(), {
          cause: error,
        });
      }
      if (error.cause instanceof Error) throw error.cause;
      throw error;
    }
  }

  async scanStocks(payload: ScreenerRequest): Promise<ScreenerResponse> {
    return this.makeRequest("/global/scan", payload);
  }

  async scanForex(payload: ScreenerRequest): Promise<ScreenerResponse> {
    return this.makeRequest("/forex/scan", payload);
  }

  async scanCrypto(payload: ScreenerRequest): Promise<ScreenerResponse> {
    return this.makeRequest("/crypto/scan", payload);
  }

  async scanBonds(payload: ScreenerRequest): Promise<ScreenerResponse> {
    return this.makeRequest("/bonds/scan", payload);
  }

  async scanFutures(payload: ScreenerRequest): Promise<ScreenerResponse> {
    return this.makeRequest("/futures/scan", payload);
  }
}
