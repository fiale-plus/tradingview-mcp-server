/**
 * TradingView Metainfo API
 *
 * Uses the scanner metainfo endpoint to discover available fields for a market.
 * Endpoint: POST https://scanner.tradingview.com/{market}/metainfo
 */

import fetch from "node-fetch";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pkg = require("../../package.json");

const API_BASE = "https://scanner.tradingview.com";
const METAINFO_TIMEOUT = 10000; // 10 seconds

export interface MetainfoField {
  name: string;
  label?: string;
  type?: string;
  description?: string;
}

export interface MetainfoInput {
  market: string;
  fields?: string[];
  mode?: "summary" | "raw";
}

export interface MetainfoSummaryResponse {
  market: string;
  requested_fields: string[];
  metainfo: {
    available: boolean;
    field_count: number;
    fields: MetainfoField[];
  };
}

export class MetainfoClient {
  /**
   * Fetch metainfo for a market.
   */
  async getMetainfo(input: MetainfoInput): Promise<MetainfoSummaryResponse | any> {
    const { market, fields, mode = "summary" } = input;

    if (!market || market.trim().length < 1) {
      throw new Error("Market is required (e.g., 'america', 'uk', 'germany')");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), METAINFO_TIMEOUT);

    try {
      const url = `${API_BASE}/${encodeURIComponent(market.trim())}/metainfo`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": `tradingview-mcp-server/${pkg.version}`,
        },
        body: fields ? JSON.stringify({ fields }) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Invalid market: '${market}'. Use markets like 'america', 'uk', 'germany', etc.`);
        }
        throw new Error(`Metainfo request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as any;

      if (mode === "raw") {
        return {
          market: market.trim(),
          raw: data,
        };
      }

      // Summary mode: normalize the response
      return this.normalizeMetainfo(market.trim(), fields, data);
    } catch (error) {
      clearTimeout(timeout);
      if ((error as Error).name === "AbortError") {
        throw new Error("Metainfo request timeout");
      }
      throw error;
    }
  }

  private normalizeMetainfo(
    market: string,
    requestedFields: string[] | undefined,
    data: any
  ): MetainfoSummaryResponse {
    // TradingView metainfo response structure varies
    // It typically has a 'fields' object or array with field metadata
    const fields: MetainfoField[] = [];

    if (data && typeof data === "object") {
      // Try to extract fields from various response shapes
      const fieldsData = data.fields || data.columns || data;

      if (Array.isArray(fieldsData)) {
        for (const field of fieldsData) {
          if (typeof field === "string") {
            fields.push({ name: field });
          } else if (field && typeof field === "object") {
            fields.push({
              name: field.name || field.id || field.propName || String(field),
              label: field.title || field.shortName || field.label || field.name,
              type: field.kind || field.type || field.dataType,
              description: field.description || field.shortDescription,
            });
          }
        }
      } else if (typeof fieldsData === "object") {
        // Object with field names as keys
        for (const [key, value] of Object.entries(fieldsData)) {
          if (value && typeof value === "object") {
            const v = value as any;
            fields.push({
              name: v.propName || v.name || key,
              label: v.title || v.shortName || v.label || key,
              type: v.kind || v.type || v.dataType,
              description: v.description || v.shortDescription,
            });
          } else {
            fields.push({ name: key });
          }
        }
      }
    }

    // If specific fields were requested, filter to only those
    const filteredFields = requestedFields
      ? fields.filter((f) => requestedFields.includes(f.name))
      : fields;

    return {
      market,
      requested_fields: requestedFields || [],
      metainfo: {
        available: true,
        field_count: filteredFields.length,
        fields: filteredFields,
      },
    };
  }
}