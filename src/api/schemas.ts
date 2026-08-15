const OBJECT_ROW = {
  type: "object",
  additionalProperties: true,
} as const;

export const FILTER_VALUE_SCHEMA = {
  oneOf: [
    { type: "number" },
    { type: "string" },
    { type: "boolean" },
    {
      type: "array",
      items: { type: "number" },
      minItems: 2,
      maxItems: 2,
    },
    {
      type: "array",
      items: { type: "string" },
      minItems: 1,
    },
    {
      type: "array",
      prefixItems: [{ type: "string" }, { type: "number" }],
      minItems: 2,
      maxItems: 2,
    },
  ],
  description:
    "Value to compare against. Empty and not_empty omit value. above_percent and below_percent use [field, percent]. has and has_none_of use a non-empty string array.",
} as const;

const STRING_ARRAY = {
  type: "array",
  items: { type: "string" },
} as const;

function collectionSchema(name: string) {
  return {
    type: "object",
    properties: {
      total_count: { type: "integer" },
      [name]: { type: "array", items: OBJECT_ROW },
    },
    required: ["total_count", name],
    additionalProperties: true,
  } as const;
}

export const OUTPUT_SCHEMAS = {
  screen_stocks: collectionSchema("stocks"),
  screen_forex: collectionSchema("pairs"),
  screen_crypto: collectionSchema("cryptocurrencies"),
  screen_etf: collectionSchema("etfs"),
  lookup_symbols: {
    type: "object",
    properties: {
      total_count: { type: "integer" },
      symbols: { type: "array", items: OBJECT_ROW },
    },
    required: ["total_count", "symbols"],
    additionalProperties: true,
  },
  search_symbols: {
    type: "object",
    properties: {
      query: { type: "string" },
      count: { type: "integer" },
      symbols: { type: "array", items: OBJECT_ROW },
    },
    required: ["query", "count", "symbols"],
    additionalProperties: true,
  },
  get_market_metainfo: {
    type: "object",
    properties: {
      market: { type: "string" },
      requested_fields: STRING_ARRAY,
      metainfo: OBJECT_ROW,
    },
    required: ["market"],
    additionalProperties: true,
  },
  get_ta_summary: {
    type: "object",
    properties: {
      symbols: { type: "array", items: OBJECT_ROW },
    },
    required: ["symbols"],
    additionalProperties: true,
  },
  rank_by_ta: {
    type: "object",
    properties: {
      requested_symbols: { type: "integer" },
      timeframes: STRING_ARRAY,
      weights: { type: "object", additionalProperties: { type: "number" } },
      ranked: { type: "array", items: OBJECT_ROW },
    },
    required: ["requested_symbols", "timeframes", "weights", "ranked"],
    additionalProperties: true,
  },
  list_fields: {
    type: "object",
    properties: {
      asset_type: { type: "string" },
      category: { type: "string" },
      field_count: { type: "integer" },
      fields: { type: "array", items: OBJECT_ROW },
    },
    required: ["asset_type", "category", "field_count", "fields"],
    additionalProperties: true,
  },
  get_preset: {
    type: "object",
    additionalProperties: true,
  },
  list_presets: {
    type: "object",
    properties: {
      presets: { type: "array", items: OBJECT_ROW },
    },
    required: ["presets"],
    additionalProperties: true,
  },
} as const;

export type PublicToolName = keyof typeof OUTPUT_SCHEMAS;
