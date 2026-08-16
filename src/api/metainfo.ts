/**
 * TradingView Metainfo API
 *
 * Uses the scanner metainfo endpoint to discover available fields for a market.
 * Endpoint: POST https://scanner.tradingview.com/{market}/metainfo
 */

import { createRequire } from "module";
import {
  requestJson,
  type TransportOptions,
  UpstreamError,
} from "./transport.js";

const require = createRequire(import.meta.url);
const pkg = require("../../package.json");

const API_BASE = "https://scanner.tradingview.com";

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
export interface MetainfoRawResponse {
  market: string;
  raw: unknown;
}

type MetainfoPayload = Record<string, unknown> | unknown[];

function validateMetainfoResponse(value: unknown): MetainfoPayload {
  if (Array.isArray(value)) {
    if (
      value.length === 0
      || !value.every((field) =>
        typeof field === "string"
        || (typeof field === "object" && field !== null && !Array.isArray(field))
      )
    ) {
      throw new Error("TradingView returned malformed metainfo response");
    }
    return value;
  }

  if (typeof value !== "object" || value === null) {
    throw new Error("TradingView returned malformed metainfo response");
  }

  if ("fields" in value || "columns" in value) {
    const fields = "fields" in value ? value.fields : value.columns;
    if (typeof fields !== "object" || fields === null) {
      throw new Error("TradingView returned malformed metainfo response");
    }
  } else {
    const values = Object.values(value);
    if (!values.every((field) => typeof field === "object" && field !== null && !Array.isArray(field))) {
      throw new Error("TradingView returned malformed metainfo response");
    }
  }

  return value as Record<string, unknown>;
}

export class MetainfoClient {
  constructor(private readonly transportOptions: TransportOptions = {}) {}

  /**
   * Fetch metainfo for a market.
   */
  async getMetainfo(
    input: MetainfoInput & { mode: "raw" },
  ): Promise<MetainfoRawResponse>;
  async getMetainfo(
    input: MetainfoInput & { mode?: "summary" },
  ): Promise<MetainfoSummaryResponse>;
  async getMetainfo(input: MetainfoInput): Promise<MetainfoSummaryResponse | MetainfoRawResponse>;
  async getMetainfo(
    input: MetainfoInput,
  ): Promise<MetainfoSummaryResponse | MetainfoRawResponse> {
    const { market, fields, mode = "summary" } = input;

    if (!market || market.trim().length < 1) {
      throw new Error("Market is required (e.g., 'america', 'uk', 'germany')");
    }

    const trimmedMarket = market.trim();
    const url = `${API_BASE}/${encodeURIComponent(trimmedMarket)}/metainfo`;

    try {
      const data = await requestJson(
        url,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "User-Agent": `tradingview-mcp-server/${pkg.version}`,
          },
          body: fields ? JSON.stringify({ fields }) : undefined,
        },
        this.transportOptions,
      );

      if (mode === "raw") {
        return {
          market: trimmedMarket,
          raw: data,
        };
      }

      // Summary mode: validate and normalize the response.
      return this.normalizeMetainfo(
        trimmedMarket,
        fields,
        validateMetainfoResponse(data),
      );
    } catch (error) {
      if (!(error instanceof UpstreamError)) throw error;
      if (error.kind === "http" && error.status === 404) {
        throw new Error(`Invalid market: '${market}'. Use markets like 'america', 'uk', 'germany', etc.`, {
          cause: error,
        });
      }
      if (error.kind === "timeout") {
        throw new Error("Metainfo request timeout", { cause: error });
      }
      if (error.kind === "http") {
        throw new Error(`Metainfo request failed: ${error.status} ${error.statusText ?? ""}`.trimEnd(), {
          cause: error,
        });
      }
      if (error.cause instanceof Error) throw error.cause;
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
            // TradingView metainfo uses compact keys: n=name, t=type, r=range
            // Some endpoints use verbose keys: propName, title, kind
            fields.push({
              name: field.n || field.name || field.id || field.propName || String(field),
              label: field.title || field.shortName || field.label || field.n || field.name,
              type: field.t || field.kind || field.type || field.dataType,
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