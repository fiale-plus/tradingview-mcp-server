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

const RESULT_METADATA_SCHEMA = {
  type: "object",
  properties: {
    retrieved_at: { type: "string", format: "date-time" },
    source: { type: "string" },
    cache_hit: { type: "boolean" },
    requested_count: { type: "integer", minimum: 0 },
    returned_count: { type: "integer", minimum: 0 },
    missing_symbols: STRING_ARRAY,
    unavailable_symbols: STRING_ARRAY,
  },
  required: [
    "retrieved_at",
    "source",
    "cache_hit",
    "requested_count",
    "returned_count",
    "missing_symbols",
  ],
  additionalProperties: false,
} as const;

function withMetadata(properties: Record<string, unknown>) {
  return {
    ...properties,
    metadata: RESULT_METADATA_SCHEMA,
  };
}

const METADATA_REQUIRED = ["metadata"] as const;

function collectionSchema(name: string) {
  return {
    type: "object",
    properties: withMetadata({
      total_count: { type: "integer" },
      [name]: { type: "array", items: OBJECT_ROW },
    }),
    required: ["total_count", name, ...METADATA_REQUIRED],
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
    properties: withMetadata({
      total_count: { type: "integer" },
      symbols: { type: "array", items: OBJECT_ROW },
    }),
    required: ["total_count", "symbols", ...METADATA_REQUIRED],
    additionalProperties: true,
  },
  search_symbols: {
    type: "object",
    properties: withMetadata({
      query: { type: "string" },
      count: { type: "integer" },
      symbols: { type: "array", items: OBJECT_ROW },
    }),
    required: ["query", "count", "symbols", ...METADATA_REQUIRED],
    additionalProperties: true,
  },
  get_market_metainfo: {
    type: "object",
    properties: withMetadata({
      market: { type: "string" },
      requested_fields: STRING_ARRAY,
      metainfo: OBJECT_ROW,
    }),
    required: ["market", ...METADATA_REQUIRED],
    additionalProperties: true,
  },
  get_ta_summary: {
    type: "object",
    properties: withMetadata({
      symbols: { type: "array", items: OBJECT_ROW },
    }),
    required: ["symbols", ...METADATA_REQUIRED],
    additionalProperties: true,
  },
  rank_by_ta: {
    type: "object",
    properties: withMetadata({
      requested_symbols: { type: "integer" },
      timeframes: STRING_ARRAY,
      weights: { type: "object", additionalProperties: { type: "number" } },
      ranked: { type: "array", items: OBJECT_ROW },
      excluded_symbols: { type: "array", items: OBJECT_ROW },
    }),
    required: ["requested_symbols", "timeframes", "weights", "ranked", "excluded_symbols", ...METADATA_REQUIRED],
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
