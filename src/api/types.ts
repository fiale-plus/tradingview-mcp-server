/**
 * TradingView API types
 */

export interface Filter {
  left: string;
  operation: FilterOperation;
  right: number | string | [number, number];
}

export type FilterOperation =
  | "greater"
  | "less"
  | "egreater"
  | "eless"
  | "equal"
  | "nequal"
  | "in_range"
  | "not_in_range"
  | "crosses"
  | "crosses_above"
  | "crosses_below"
  | "match";

export interface ScreenerRequest {
  filter: Filter[];
  columns: string[];
  sort: {
    sortBy: string;
    sortOrder: "asc" | "desc";
  };
  range: [number, number];
  options?: {
    lang?: string;
  };
  symbols?: {
    query: {
      types: string[];
    };
    tickers: string[];
  };
  markets?: string[];
}

export interface ScreenerResponse {
  totalCount: number;
  data: Array<{
    s: string; // symbol
    d: (number | string | null)[]; // data array
  }>;
}

/**
 * MCP Tool Input types
 */

export interface ScreenStocksInput {
  filters: Array<{
    field: string;
    operator: string;
    value: number | string | [number, number];
  }>;
  markets?: string[];
  sort_by?: string;
  sort_order?: "asc" | "desc";
  limit?: number;
  columns?: string[];
}

export interface ListFieldsInput {
  asset_type?: "stock" | "forex" | "crypto";
  category?: "fundamental" | "technical" | "performance";
}

export interface CompareStocksInput {
  symbols: string[];
  fields?: string[];
}

/**
 * Field metadata
 */

export interface FieldMetadata {
  name: string;
  label: string;
  category: "fundamental" | "technical" | "performance";
  type: "number" | "percent" | "currency" | "string";
  description?: string;
}
