/**
 * CLI argument parsing and input building
 */

import { parseArgs } from "node:util";
import type { ScreenStocksInput, ListFieldsInput } from "../api/types.js";
import type { PresetsTool } from "../resources/presets.js";

// Option configs for util.parseArgs

export const TOP_LEVEL_OPTIONS = {
  help: { type: "boolean" as const, short: "h" },
  version: { type: "boolean" as const, short: "v" },
} as const;

export const SCREEN_OPTIONS = {
  filters: { type: "string" as const },
  preset: { type: "string" as const },
  markets: { type: "string" as const, multiple: true },
  "sort-by": { type: "string" as const },
  "sort-order": { type: "string" as const },
  limit: { type: "string" as const },
  columns: { type: "string" as const, multiple: true },
  format: { type: "string" as const, short: "f" },
  help: { type: "boolean" as const, short: "h" },
} as const;

export const LOOKUP_OPTIONS = {
  columns: { type: "string" as const, multiple: true },
  format: { type: "string" as const, short: "f" },
  help: { type: "boolean" as const, short: "h" },
} as const;

export const FIELDS_OPTIONS = {
  "asset-type": { type: "string" as const },
  category: { type: "string" as const },
  format: { type: "string" as const, short: "f" },
  help: { type: "boolean" as const, short: "h" },
} as const;

export const PRESET_OPTIONS = {
  format: { type: "string" as const, short: "f" },
  help: { type: "boolean" as const, short: "h" },
} as const;

/**
 * Parse top-level args to extract command and subcommand.
 * Uses strict: false to allow subcommand-specific flags to pass through.
 */
export function parseTopLevel(argv: string[]) {
  const { positionals, values } = parseArgs({
    args: argv,
    options: TOP_LEVEL_OPTIONS,
    allowPositionals: true,
    strict: false,
  });
  return { positionals, values };
}

/**
 * Parse screen command args (after stripping command + subcommand).
 */
export function parseScreenArgs(argv: string[]) {
  return parseArgs({
    args: argv,
    options: SCREEN_OPTIONS,
    allowPositionals: false,
    strict: true,
  });
}

/**
 * Parse lookup command args (after stripping 'lookup').
 */
export function parseLookupArgs(argv: string[]) {
  return parseArgs({
    args: argv,
    options: LOOKUP_OPTIONS,
    allowPositionals: true,
    strict: true,
  });
}

/**
 * Parse fields command args.
 */
export function parseFieldsArgs(argv: string[]) {
  return parseArgs({
    args: argv,
    options: FIELDS_OPTIONS,
    allowPositionals: false,
    strict: true,
  });
}

/**
 * Parse preset/presets command args.
 */
export function parsePresetArgs(argv: string[]) {
  return parseArgs({
    args: argv,
    options: PRESET_OPTIONS,
    allowPositionals: true,
    strict: true,
  });
}

export interface ScreenBuildResult {
  input: ScreenStocksInput;
  /** True if the preset is symbol-based and should use lookupSymbols instead */
  isSymbolLookup: boolean;
  symbols?: string[];
}

/**
 * Build a ScreenStocksInput from parsed CLI values, optionally merging a preset.
 */
export function buildScreenInput(
  values: Record<string, any>,
  presetsTool: PresetsTool
): ScreenBuildResult {
  let base: Partial<ScreenStocksInput> & { symbols?: string[] } = {};
  let isSymbolLookup = false;
  let symbols: string[] | undefined;

  if (values.preset) {
    const preset = presetsTool.getPreset(values.preset);
    if (!preset) {
      throw new Error(
        `Unknown preset: ${values.preset}. Run 'tradingview-cli presets' to see available presets.`
      );
    }

    if (preset.symbols) {
      isSymbolLookup = true;
      symbols = preset.symbols;
      base.columns = preset.columns;
    } else {
      base = {
        filters: preset.filters ?? [],
        markets: preset.markets,
        sort_by: preset.sort_by,
        sort_order: preset.sort_order,
        columns: preset.columns,
      };
    }
  }

  const cliFilters = values.filters ? JSON.parse(values.filters) : [];

  const input: ScreenStocksInput = {
    filters: [...(base.filters ?? []), ...cliFilters],
    markets: values.markets ?? base.markets,
    sort_by: values["sort-by"] ?? base.sort_by,
    sort_order: values["sort-order"] ?? base.sort_order,
    limit: values.limit ? parseInt(values.limit, 10) : undefined,
    columns: values.columns ?? base.columns,
  };

  return { input, isSymbolLookup, symbols };
}

/**
 * Build lookup input from positional symbols and options.
 */
export function buildLookupInput(
  positionals: string[],
  values: Record<string, any>
) {
  if (positionals.length === 0) {
    throw new Error(
      "No symbols provided. Usage: tradingview-cli lookup <symbol...>"
    );
  }
  return {
    symbols: positionals,
    columns: values.columns as string[] | undefined,
  };
}

/**
 * Build fields input from parsed options.
 */
export function buildFieldsInput(values: Record<string, any>): ListFieldsInput {
  return {
    asset_type: values["asset-type"] as ListFieldsInput["asset_type"],
    category: values.category as ListFieldsInput["category"],
  };
}
