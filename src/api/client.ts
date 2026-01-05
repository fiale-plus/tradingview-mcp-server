/**
 * TradingView API Client
 */

import fetch from "node-fetch";
import { createRequire } from "module";
import type { ScreenerRequest, ScreenerResponse } from "./types.js";

const require = createRequire(import.meta.url);
const pkg = require("../../package.json");

const API_BASE = "https://scanner.tradingview.com";
const API_TIMEOUT = 10000; // 10 seconds

export class TradingViewClient {
  private async makeRequest(
    endpoint: string,
    payload: ScreenerRequest
  ): Promise<ScreenerResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), API_TIMEOUT);

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": `tradingview-mcp-server/${pkg.version}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(
          `TradingView API error: ${response.status} ${response.statusText}`
        );
      }

      return (await response.json()) as ScreenerResponse;
    } catch (error) {
      clearTimeout(timeout);
      if ((error as Error).name === "AbortError") {
        throw new Error("Request timeout");
      }
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
}
