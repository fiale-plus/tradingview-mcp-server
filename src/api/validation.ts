import type { MetainfoInput } from "./metainfo.js";
import type { SearchSymbolsInput } from "./search.js";
import {
  VALID_TIMEFRAMES,
  type RanksByTAInput,
  type TASummaryInput,
  type Timeframe,
} from "./ta.js";
import type { Filter, FilterOperation, ListFieldsInput, ScreenStocksInput } from "./types.js";

const VALID_ASSET_TYPES = ["stock", "forex", "crypto", "etf"] as const;
const VALID_FIELD_CATEGORIES = ["fundamental", "technical", "performance"] as const;
const VALID_SEARCH_ASSET_TYPES = ["stock", "forex", "crypto", "cfd", "futures", "index", "economic"] as const;
const VALID_OPERATORS = [
  "greater",
  "less",
  "greater_or_equal",
  "less_or_equal",
  "equal",
  "not_equal",
  "in_range",
  "not_in_range",
  "crosses",
  "crosses_above",
  "crosses_below",
  "match",
  "above_percent",
  "below_percent",
  "has",
  "has_none_of",
  "empty",
  "not_empty",
] as const;

const OPERATOR_MAP: Record<(typeof VALID_OPERATORS)[number], FilterOperation> = {
  greater: "greater",
  less: "less",
  greater_or_equal: "egreater",
  less_or_equal: "eless",
  equal: "equal",
  not_equal: "nequal",
  in_range: "in_range",
  not_in_range: "not_in_range",
  crosses: "crosses",
  crosses_above: "crosses_above",
  crosses_below: "crosses_below",
  match: "match",
  above_percent: "above%",
  below_percent: "below%",
  has: "has",
  has_none_of: "has_none_of",
  empty: "empty",
  not_empty: "nempty",
};

type PlainObject = Record<string, unknown>;
type ScreenFilterInput = NonNullable<ScreenStocksInput["filters"]>[number];

function isPlainObject(value: unknown): value is PlainObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asObject(value: unknown, context: string): PlainObject {
  if (!isPlainObject(value)) throw new Error(`${context} must be an object`);
  return value;
}

function assertAllowedKeys(value: PlainObject, allowed: readonly string[], context: string): void {
  const unknown = Object.keys(value).find((key) => !allowed.includes(key));
  if (unknown !== undefined) throw new Error(`${context} has unknown argument '${unknown}'`);
}

function nonEmptyString(value: unknown, context: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${context} must be a non-empty string`);
  }
  return value;
}

function optionalString(value: unknown, context: string): string | undefined {
  if (value === undefined) return undefined;
  return nonEmptyString(value, context);
}

function stringArray(
  value: unknown,
  context: string,
  minLength = 1,
  maxLength = Number.POSITIVE_INFINITY
): string[] {
  if (
    !Array.isArray(value) ||
    value.length < minLength ||
    value.length > maxLength ||
    value.some((item) => typeof item !== "string" || item.length === 0)
  ) {
    const range = Number.isFinite(maxLength)
      ? `${minLength} to ${maxLength}`
      : `at least ${minLength}`;
    throw new Error(`${context} must contain ${range} non-empty strings`);
  }
  return value;
}

function optionalStringArray(value: unknown, context: string): string[] | undefined {
  if (value === undefined) return undefined;
  return stringArray(value, context);
}
function optionalBoundedInteger(
  value: unknown,
  minimum: number,
  maximum: number,
  message: string
): number | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "number" || !Number.isInteger(value) || value < minimum || value > maximum) {
    throw new Error(message);
  }
  return value;
}

function finiteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function isNumericRange(value: unknown): value is [number, number] {
  return Array.isArray(value) && value.length === 2 && value.every(finiteNumber);
}

function isStringList(value: unknown): value is string[] {
  return Array.isArray(value) && value.length > 0 && value.every(isNonEmptyString);
}

function validateFilterValue(value: unknown, operator: string, context: string): void {

  if (operator === "empty" || operator === "not_empty") {
    if (value !== undefined) throw new Error(`${context} operator ${operator} does not accept a value`);
    return;
  }
  if (
    operator === "greater" ||
    operator === "less" ||
    operator === "greater_or_equal" ||
    operator === "less_or_equal"
  ) {
    if (!(finiteNumber(value) || isNonEmptyString(value))) {
      throw new Error(`${context} operator ${operator} requires a finite number or field-name string`);
    }
    return;
  }
  if (operator === "equal") {
    if (!(isNonEmptyString(value) || finiteNumber(value) || typeof value === "boolean")) {
      throw new Error(`${context} operator equal requires a non-empty string, finite number, or boolean`);
    }
    return;
  }
  if (operator === "not_equal") {
    if (!(isNonEmptyString(value) || finiteNumber(value))) {
      throw new Error(`${context} operator not_equal requires a non-empty string or finite number`);
    }
    return;
  }
  if (operator === "in_range") {
    if (!(isNumericRange(value) || isStringList(value))) {
      throw new Error(`${context} operator in_range requires two finite numbers or a non-empty string array`);
    }
    return;
  }
  if (operator === "not_in_range") {
    if (!isNumericRange(value)) throw new Error(`${context} operator not_in_range requires two finite numbers`);
    return;
  }
  if (
    operator === "crosses" ||
    operator === "crosses_above" ||
    operator === "crosses_below" ||
    operator === "match"
  ) {
    if (!isNonEmptyString(value)) throw new Error(`${context} operator ${operator} requires a non-empty string`);
    return;
  }
  if (operator === "above_percent" || operator === "below_percent") {
    if (!Array.isArray(value) || value.length !== 2 || !isNonEmptyString(value[0]) || !finiteNumber(value[1])) {
      throw new Error(`${context} operator ${operator} requires [field, finite percent]`);
    }
    return;
  }
  if (operator === "has" || operator === "has_none_of") {
    if (!isStringList(value)) throw new Error(`${context} operator ${operator} requires a non-empty string array`);
    return;
  }
}

function validateFilterInput(value: unknown, index: number): ScreenFilterInput {
  const context = `Invalid filter at index ${index}`;
  if (!isPlainObject(value)) {
    throw new Error(`${context}: expected object with {field, operator, value}`);
  }

  const field = value.field;
  const operator = value.operator;
  const missing: string[] = [];
  if (field === undefined) missing.push("field: undefined");
  if (operator === undefined) missing.push("operator: undefined");
  if (
    typeof operator === "string" &&
    operator !== "empty" &&
    operator !== "not_empty" &&
    value.value === undefined
  ) {
    missing.push("value: undefined");
  }
  if (missing.length > 0) {
    throw new Error(`${context}: missing required properties (${missing.join(", ")})`);
  }
  assertAllowedKeys(value, ["field", "operator", "value"], context);

  const fieldName = nonEmptyString(field, `${context} field`);
  const operatorName = nonEmptyString(operator, `${context} operator`);
  if (!(VALID_OPERATORS as readonly string[]).includes(operatorName)) {
    throw new Error(`Unknown operator: ${operatorName}. Valid operators: ${VALID_OPERATORS.join(", ")}`);
  }
  validateFilterValue(value.value, operatorName, context);
  return {
    field: fieldName,
    operator: operatorName,
    ...(value.value === undefined ? {} : { value: value.value as ScreenFilterInput["value"] }),
  };
}

export function validateScreenFilterInputs(value: unknown): ScreenFilterInput[] {
  if (!Array.isArray(value)) throw new Error("filters must be an array");
  return value.map((filter, index) => validateFilterInput(filter, index));
}

/** Validate and convert MCP filter objects to TradingView filter objects. */
export function validateScreenFilters(value: unknown): Filter[] {
  return validateScreenFilterInputs(value).map((filter) => ({
    left: filter.field,
    operation: OPERATOR_MAP[filter.operator as keyof typeof OPERATOR_MAP],
    ...(filter.value === undefined ? {} : { right: filter.value }),
  }));
}

export function validateScreenInput(value: unknown, allowMarkets = true): ScreenStocksInput {
  const input = asObject(value, "screen input");
  assertAllowedKeys(input, ["filters", "markets", "sort_by", "sort_order", "limit", "columns"], "screen input");
  if (!allowMarkets && input.markets !== undefined) {
    throw new Error("screen input has unknown argument 'markets'");
  }

  const filters = validateScreenFilterInputs(input.filters === undefined ? [] : input.filters);
  const markets = allowMarkets ? optionalStringArray(input.markets, "markets") : undefined;
  const sortBy = optionalString(input.sort_by, "sort_by");
  const sortOrder = input.sort_order;
  if (sortOrder !== undefined && sortOrder !== "asc" && sortOrder !== "desc") {
    throw new Error("sort_order must be 'asc' or 'desc'");
  }
  const limit = optionalBoundedInteger(
    input.limit,
    1,
    200,
    "limit must be an integer from 1 to 200"
  );
  const columns = optionalStringArray(input.columns, "columns");

  return {
    filters,
    ...(markets === undefined ? {} : { markets }),
    ...(sortBy === undefined ? {} : { sort_by: sortBy }),
    ...(sortOrder === undefined ? {} : { sort_order: sortOrder }),
    ...(limit === undefined ? {} : { limit }),
    ...(columns === undefined ? {} : { columns }),
  };
}

export interface LookupSymbolsInput {
  symbols: string[];
  columns?: string[];
}

export function validateLookupInput(value: unknown): LookupSymbolsInput {
  const input = asObject(value, "lookup input");
  assertAllowedKeys(input, ["symbols", "columns"], "lookup input");
  const symbols = stringArray(input.symbols, "symbols", 1, 100);
  const columns = optionalStringArray(input.columns, "columns");
  return {
    symbols,
    ...(columns === undefined ? {} : { columns }),
  };
}

export function validateSearchInput(value: unknown): SearchSymbolsInput {
  const input = asObject(value, "search input");
  assertAllowedKeys(input, ["query", "exchange", "asset_type", "limit", "start"], "search input");
  const query = nonEmptyString(input.query, "query");
  const exchange = optionalString(input.exchange, "exchange");
  const assetType = input.asset_type;
  if (
    assetType !== undefined &&
    (typeof assetType !== "string" || !(VALID_SEARCH_ASSET_TYPES as readonly string[]).includes(assetType))
  ) {
    throw new Error(`asset_type must be one of: ${VALID_SEARCH_ASSET_TYPES.join(", ")}`);
  }
  const limit = optionalBoundedInteger(
    input.limit,
    1,
    50,
    "limit must be an integer from 1 to 50"
  );
  const start = optionalBoundedInteger(
    input.start,
    0,
    Number.MAX_SAFE_INTEGER,
    "start must be a non-negative integer"
  );
  return {
    query,
    ...(exchange === undefined ? {} : { exchange }),
    ...(assetType === undefined ? {} : { asset_type: assetType as SearchSymbolsInput["asset_type"] }),
    ...(limit === undefined ? {} : { limit }),
    ...(start === undefined ? {} : { start }),
  };
}

export function validateMetainfoInput(value: unknown): MetainfoInput {
  const input = asObject(value, "metainfo input");
  assertAllowedKeys(input, ["market", "fields", "mode"], "metainfo input");
  const market = nonEmptyString(input.market, "market");
  const fields = optionalStringArray(input.fields, "fields");
  const mode = input.mode;
  if (mode !== undefined && mode !== "summary" && mode !== "raw") {
    throw new Error("mode must be 'summary' or 'raw'");
  }
  return {
    market,
    ...(fields === undefined ? {} : { fields }),
    ...(mode === undefined ? {} : { mode }),
  };
}

function validateTimeframes(value: unknown): Timeframe[] | undefined {
  if (value === undefined) return undefined;
  const timeframes = stringArray(value, "timeframes").map((timeframe) => timeframe as Timeframe);
  for (const timeframe of timeframes) {
    if (!(VALID_TIMEFRAMES as readonly string[]).includes(timeframe)) {
      throw new Error(`invalid timeframe '${timeframe}'`);
    }
  }
  return timeframes;
}

function validateSymbols(value: unknown): string[] {
  return stringArray(value, "symbols", 1, 50);
}

export function validateTASummaryInput(value: unknown): TASummaryInput {
  const input = asObject(value, "TA input");
  assertAllowedKeys(input, ["symbols", "timeframes", "include_components"], "TA input");
  const symbols = validateSymbols(input.symbols);
  const timeframes = validateTimeframes(input.timeframes);
  const includeComponents = input.include_components;
  if (includeComponents !== undefined && typeof includeComponents !== "boolean") {
    throw new Error("include_components must be a boolean");
  }
  return {
    symbols,
    ...(timeframes === undefined ? {} : { timeframes }),
    ...(includeComponents === undefined ? {} : { include_components: includeComponents }),
  };
}

export function validateRankByTAInput(value: unknown): RanksByTAInput {
  const input = asObject(value, "rank_by_ta input");
  assertAllowedKeys(input, ["symbols", "timeframes", "weights"], "rank_by_ta input");
  const symbols = validateSymbols(input.symbols);
  const timeframes = validateTimeframes(input.timeframes);
  let weights: Record<string, number> | undefined;
  if (input.weights !== undefined) {
    const weightObject = asObject(input.weights, "weights");
    weights = {};
    for (const [timeframe, weight] of Object.entries(weightObject)) {
      if (!finiteNumber(weight) || weight < 0) {
        throw new Error("weights must contain finite non-negative numbers");
      }
      weights[timeframe] = weight;
    }
  }
  return {
    symbols,
    ...(timeframes === undefined ? {} : { timeframes }),
    ...(weights === undefined ? {} : { weights }),
  };
}

export function validateListFieldsInput(value: unknown): ListFieldsInput {
  const input = asObject(value, "list_fields input");
  assertAllowedKeys(input, ["asset_type", "category"], "list_fields input");
  const assetType = input.asset_type;
  if (
    assetType !== undefined &&
    (typeof assetType !== "string" || !(VALID_ASSET_TYPES as readonly string[]).includes(assetType))
  ) {
    throw new Error(`asset_type must be one of: ${VALID_ASSET_TYPES.join(", ")}`);
  }
  const category = input.category;
  if (
    category !== undefined &&
    (typeof category !== "string" || !(VALID_FIELD_CATEGORIES as readonly string[]).includes(category))
  ) {
    throw new Error(`category must be one of: ${VALID_FIELD_CATEGORIES.join(", ")}`);
  }
  return {
    ...(assetType === undefined ? {} : { asset_type: assetType as ListFieldsInput["asset_type"] }),
    ...(category === undefined ? {} : { category: category as ListFieldsInput["category"] }),
  };
}

export function validatePresetInput(value: unknown): { preset_name: string } {
  const input = asObject(value, "preset input");
  assertAllowedKeys(input, ["preset_name"], "preset input");
  return { preset_name: nonEmptyString(input.preset_name, "preset_name") };
}

export function validateEmptyToolInput(value: unknown): Record<string, never> {
  const input = asObject(value, "tool input");
  assertAllowedKeys(input, [], "tool input");
  return {};
}

export { VALID_TIMEFRAMES, VALID_OPERATORS };
