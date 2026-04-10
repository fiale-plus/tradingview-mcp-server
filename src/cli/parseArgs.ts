/**
 * CLI argument parsing and input building
 */

import { parseArgs } from "node:util";
import type { ScreenStocksInput, ListFieldsInput } from "../api/types.js";
import type { PresetsTool } from "../resources/presets.js";

// Option configs for util.parseArgs

type ParseArgOption = {
  type: "string" | "boolean";
  short?: string;
  multiple?: boolean;
};

type ParseArgOptions = Record<string, ParseArgOption>;

function normalizeRepeatableArgs(
  argv: string[],
  options: ParseArgOptions
): string[] {
  const repeatableOptions = new Set(
    Object.entries(options)
      .filter(([, config]) => config.multiple)
      .map(([name]) => `--${name}`)
  );

  if (repeatableOptions.size === 0) {
    return argv;
  }

  const normalized: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];

    if (!repeatableOptions.has(token)) {
      normalized.push(token);
      continue;
    }

    const firstValue = argv[i + 1];
    if (
      firstValue === undefined ||
      firstValue === "--" ||
      (firstValue.startsWith("-") && firstValue !== "-")
    ) {
      normalized.push(token);
      continue;
    }

    normalized.push(token, firstValue);

    let j = i + 2;
    while (j < argv.length) {
      const next = argv[j];

      if (next === "--" || (next.startsWith("-") && next !== "-")) {
        break;
      }

      normalized.push(token, next);
      j++;
    }

    i = j - 1;
  }

  return normalized;
}

function parseWithRepeatableArgs(
  argv: string[],
  options: ParseArgOptions,
  allowPositionals: boolean
) {
  return parseArgs({
    args: normalizeRepeatableArgs(argv, options),
    options,
    allowPositionals,
    strict: true,
  });
}

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

export const SEARCH_OPTIONS = {
  exchange: { type: "string" as const },
  "asset-type": { type: "string" as const },
  limit: { type: "string" as const },
  start: { type: "string" as const },
  format: { type: "string" as const, short: "f" },
  help: { type: "boolean" as const, short: "h" },
} as const;

export const METAINFO_OPTIONS = {
  fields: { type: "string" as const, multiple: true },
  mode: { type: "string" as const },
  format: { type: "string" as const, short: "f" },
  help: { type: "boolean" as const, short: "h" },
} as const;

export const TA_OPTIONS = {
  timeframes: { type: "string" as const, multiple: true },
  "no-components": { type: "boolean" as const },
  weights: { type: "string" as const },
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

export const EXPERIMENTAL_BARS_OPTIONS = {
  timeframe: { type: "string" as const },
  limit: { type: "string" as const },
  "extended-session": { type: "boolean" as const },
  format: { type: "string" as const, short: "f" },
  help: { type: "boolean" as const, short: "h" },
} as const;

export const EXPERIMENTAL_STREAM_QUOTES_OPTIONS = {
  fields: { type: "string" as const, multiple: true },
  duration: { type: "string" as const },
  format: { type: "string" as const, short: "f" },
  help: { type: "boolean" as const, short: "h" },
} as const;

export const EXPERIMENTAL_STREAM_BARS_OPTIONS = {
  timeframe: { type: "string" as const },
  duration: { type: "string" as const },
  mode: { type: "string" as const },
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
  return parseWithRepeatableArgs(argv, SCREEN_OPTIONS, false);
}

/**
 * Parse lookup command args (after stripping 'lookup').
 */
export function parseLookupArgs(argv: string[]) {
  return parseWithRepeatableArgs(argv, LOOKUP_OPTIONS, true);
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

/**
 * Parse search command args (after stripping 'search').
 */
export function parseSearchArgs(argv: string[]) {
  return parseArgs({
    args: argv,
    options: SEARCH_OPTIONS,
    allowPositionals: true,
    strict: true,
  });
}

/**
 * Parse metainfo command args (after stripping 'metainfo').
 */
export function parseMetainfoArgs(argv: string[]) {
  return parseWithRepeatableArgs(argv, METAINFO_OPTIONS, true);
}

/**
 * Parse ta/rank-ta command args.
 */
export function parseTAArgs(argv: string[]) {
  return parseWithRepeatableArgs(argv, TA_OPTIONS, true);
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

/**
 * Build search input from parsed CLI args.
 */
export function buildSearchInput(positionals: string[], values: Record<string, any>) {
  const query = positionals[0];
  if (!query) {
    throw new Error("No search query provided. Usage: tradingview-cli search <query>");
  }
  return {
    query,
    exchange: values.exchange as string | undefined,
    asset_type: values["asset-type"] as any,
    limit: values.limit ? parseInt(values.limit, 10) : undefined,
    start: values.start ? parseInt(values.start, 10) : undefined,
  };
}

/**
 * Build metainfo input from parsed CLI args.
 */
export function buildMetainfoInput(positionals: string[], values: Record<string, any>) {
  const market = positionals[0];
  if (!market) {
    throw new Error("No market provided. Usage: tradingview-cli metainfo <market>");
  }

  // Support both --fields name --fields close AND --fields name,close
  let fields: string[] | undefined;
  if (values.fields) {
    fields = (values.fields as string[]).flatMap((f: string) =>
      f.includes(",") ? f.split(",").map((s) => s.trim()) : [f]
    );
  }

  return {
    market,
    fields,
    mode: (values.mode as "summary" | "raw") || undefined,
  };
}

/**
 * Build TA summary input from parsed CLI args.
 */
export function buildTAInput(positionals: string[], values: Record<string, any>) {
  const symbols = positionals.length > 0 ? positionals : undefined;
  if (!symbols || symbols.length === 0) {
    throw new Error("No symbols provided. Usage: tradingview-cli ta <symbol...>");
  }
  return {
    symbols,
    timeframes: values.timeframes as string[] | undefined,
    include_components: values["no-components"] ? false : true,
  };
}

/**
 * Build rank-by-TA input from parsed CLI args.
 */
export function buildRankTAInput(positionals: string[], values: Record<string, any>) {
  const symbols = positionals.length > 0 ? positionals : undefined;
  if (!symbols || symbols.length === 0) {
    throw new Error("No symbols provided. Usage: tradingview-cli rank-ta <symbol...>");
  }
  let weights: Record<string, number> | undefined;
  if (values.weights) {
    try {
      weights = JSON.parse(values.weights);
    } catch {
      throw new Error(`Invalid weights JSON: ${values.weights}`);
    }
  }
  return {
    symbols,
    timeframes: values.timeframes as string[] | undefined,
    weights,
  };
}

export function parseExperimentalBarsArgs(argv: string[]) {
  return parseArgs({
    args: argv,
    options: EXPERIMENTAL_BARS_OPTIONS,
    allowPositionals: true,
    strict: true,
  });
}

export function parseExperimentalStreamQuotesArgs(argv: string[]) {
  return parseWithRepeatableArgs(argv, EXPERIMENTAL_STREAM_QUOTES_OPTIONS, true);
}

export function parseExperimentalStreamBarsArgs(argv: string[]) {
  return parseArgs({
    args: argv,
    options: EXPERIMENTAL_STREAM_BARS_OPTIONS,
    allowPositionals: true,
    strict: true,
  });
}

export function buildExperimentalBarsInput(positionals: string[], values: Record<string, any>) {
  const symbol = positionals[0];
  if (!symbol) {
    throw new Error("No symbol provided. Usage: tradingview-cli experimental bars <symbol>");
  }
  return {
    symbol,
    timeframe: values.timeframe as string | undefined,
    limit: values.limit ? parseInt(values.limit, 10) : undefined,
    extended_session: values["extended-session"] as boolean | undefined,
  };
}

export function buildExperimentalStreamQuotesInput(positionals: string[], values: Record<string, any>) {
  if (positionals.length === 0) {
    throw new Error("No symbols provided. Usage: tradingview-cli experimental stream-quotes <symbol...>");
  }
  return {
    symbols: positionals,
    fields: values.fields as string[] | undefined,
    duration_seconds: values.duration ? parseInt(values.duration, 10) : undefined,
  };
}

export function buildExperimentalStreamBarsInput(positionals: string[], values: Record<string, any>) {
  const symbol = positionals[0];
  if (!symbol) {
    throw new Error("No symbol provided. Usage: tradingview-cli experimental stream-bars <symbol>");
  }
  return {
    symbol,
    timeframe: values.timeframe as string | undefined,
    duration_seconds: values.duration ? parseInt(values.duration, 10) : undefined,
    mode: (values.mode as "rolling" | "close_only") || undefined,
  };
}
