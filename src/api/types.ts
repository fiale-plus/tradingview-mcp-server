/**
 * TradingView API types
 */

export interface Filter {
  left: string;
  operation: FilterOperation;
  right?: any;  // optional — not needed for empty/nempty operators
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
  | "match"
  | "above%"
  | "below%"
  | "has"
  | "has_none_of"
  | "empty"
  | "nempty";

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
    /** Value to filter on. Optional for 'empty'/'not_empty' operators.
     *  For above_percent/below_percent use [field_name, percent_number] e.g. ["SMA200", 10].
     *  For has/has_none_of use string[].
     */
    value?: number | string | boolean | [number, number] | [string, number] | string[];
  }>;
  markets?: string[];
  sort_by?: string;
  sort_order?: "asc" | "desc";
  limit?: number;
  columns?: string[];
}

export interface ListFieldsInput {
  asset_type?: "stock" | "forex" | "crypto" | "etf";
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
  type: "number" | "percent" | "currency" | "string" | "boolean";
  description?: string;
}
