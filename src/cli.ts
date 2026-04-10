#!/usr/bin/env node

/**
 * TradingView CLI
 * Command-line interface for TradingView stock screener API
 */

import { createRequire } from "module";
import { TradingViewClient } from "./api/client.js";
import { SearchClient } from "./api/search.js";
import { MetainfoClient } from "./api/metainfo.js";
import { ScreenTool } from "./tools/screen.js";
import { SearchTool } from "./tools/search.js";
import { MetainfoTool } from "./tools/metainfo.js";
import { TATool } from "./tools/ta.js";
import { FieldsTool } from "./tools/fields.js";
import { PresetsTool } from "./resources/presets.js";
import { Cache } from "./utils/cache.js";
import { RateLimiter } from "./utils/rateLimit.js";
import { formatOutput, type OutputFormat } from "./cli/formatters.js";
import {
  parseTopLevel,
  parseScreenArgs,
  parseLookupArgs,
  parseFieldsArgs,
  parsePresetArgs,
  parseSearchArgs,
  parseMetainfoArgs,
  parseTAArgs,
  buildScreenInput,
  buildLookupInput,
  buildFieldsInput,
  buildSearchInput,
  buildMetainfoInput,
  buildTAInput,
  buildRankTAInput,
} from "./cli/parseArgs.js";
import {
  MAIN_HELP,
  SCREEN_HELP,
  LOOKUP_HELP,
  SEARCH_HELP,
  METAINFO_HELP,
  TA_HELP,
  RANK_TA_HELP,
  FIELDS_HELP,
  PRESET_HELP,
  PRESETS_HELP,

} from "./cli/help.js";

const require = createRequire(import.meta.url);
const pkg = require("../package.json");

// Configuration from environment
const CACHE_TTL = parseInt(process.env.CACHE_TTL_SECONDS || "300");
const RATE_LIMIT_RPM = parseInt(process.env.RATE_LIMIT_RPM || "10");

// Initialize components (no cache.startCleanup — CLI is short-lived)
const client = new TradingViewClient();
const searchClient = new SearchClient();
const metainfoClient = new MetainfoClient();
const cache = new Cache(CACHE_TTL);
const rateLimiter = new RateLimiter(RATE_LIMIT_RPM);
const screenTool = new ScreenTool(client, cache, rateLimiter);
const searchTool = new SearchTool(searchClient, cache, rateLimiter);
const metainfoTool = new MetainfoTool(metainfoClient, cache, rateLimiter);
const taTool = new TATool(client, cache, rateLimiter);
const fieldsTool = new FieldsTool();
const presetsTool = new PresetsTool();

async function main() {
  const argv = process.argv.slice(2);

  if (argv.length === 0) {
    process.stdout.write(MAIN_HELP + "\n");
    return;
  }

  const { positionals, values: topValues } = parseTopLevel(argv);

  if (topValues.version) {
    process.stdout.write(`tradingview-cli v${pkg.version}\n`);
    return;
  }

  if (topValues.help && positionals.length === 0) {
    process.stdout.write(MAIN_HELP + "\n");
    return;
  }

  const command = positionals[0];

  switch (command) {
    case "screen":
      await handleScreen(positionals.slice(1), argv);
      break;
    case "lookup":
      await handleLookup(argv.slice(1));
      break;
    case "search":
      await handleSearch(argv.slice(1));
      break;
    case "metainfo":
      await handleMetainfo(argv.slice(1));
      break;
    case "ta":
      await handleTA(argv.slice(1));
      break;
    case "rank-ta":
      await handleRankTA(argv.slice(1));
      break;
    case "fields":
      await handleFields(argv.slice(1));
      break;
    case "preset":
      await handlePreset(argv.slice(1));
      break;
    case "presets":
      await handlePresets(argv.slice(1));
      break;
    default:
      process.stderr.write(
        `Unknown command: ${command}\nRun 'tradingview-cli --help' for usage.\n`
      );
      process.exit(1);
  }
}

async function handleScreen(subPositionals: string[], fullArgv: string[]) {
  const assetType = subPositionals[0];
  if (
    !assetType ||
    !["stocks", "forex", "crypto", "etf"].includes(assetType)
  ) {
    process.stderr.write(
      `Missing or invalid asset type. Use: stocks, forex, crypto, etf\n\n`
    );
    process.stdout.write(SCREEN_HELP + "\n");
    process.exit(1);
  }

  // Strip 'screen' and asset type from argv, keep only flags
  const flagStart = fullArgv.indexOf(assetType) + 1;
  const flagArgv = fullArgv.slice(flagStart);

  const { values } = parseScreenArgs(flagArgv);

  if (values.help) {
    process.stdout.write(SCREEN_HELP + "\n");
    return;
  }

  const format = (values.format as OutputFormat) || "json";
  const { input, isSymbolLookup, symbols } = buildScreenInput(
    values,
    presetsTool
  );

  let result: any;

  if (isSymbolLookup) {
    process.stderr.write(
      `Note: preset '${values.preset}' uses direct symbol lookup\n`
    );
    result = await screenTool.lookupSymbols({
      symbols: symbols!,
      columns: input.columns,
    });
  } else {
    switch (assetType) {
      case "stocks":
        result = await screenTool.screenStocks(input);
        break;
      case "forex":
        result = await screenTool.screenForex(input);
        break;
      case "crypto":
        result = await screenTool.screenCrypto(input);
        break;
      case "etf":
        result = await screenTool.screenETF(input);
        break;
    }
  }

  process.stdout.write(formatOutput(result, format) + "\n");
}

async function handleLookup(argv: string[]) {
  const { positionals, values } = parseLookupArgs(argv);

  if (values.help) {
    process.stdout.write(LOOKUP_HELP + "\n");
    return;
  }

  const format = (values.format as OutputFormat) || "json";
  const input = buildLookupInput(positionals, values);
  const result = await screenTool.lookupSymbols(input);
  process.stdout.write(formatOutput(result, format) + "\n");
}

async function handleFields(argv: string[]) {
  const { values } = parseFieldsArgs(argv);

  if (values.help) {
    process.stdout.write(FIELDS_HELP + "\n");
    return;
  }

  const format = (values.format as OutputFormat) || "json";
  const input = buildFieldsInput(values);
  const result = fieldsTool.listFields(input);
  process.stdout.write(formatOutput(result, format) + "\n");
}

async function handlePreset(argv: string[]) {
  const { positionals, values } = parsePresetArgs(argv);

  if (values.help) {
    process.stdout.write(PRESET_HELP + "\n");
    return;
  }

  const name = positionals[0];
  if (!name) {
    process.stderr.write(
      `Missing preset name. Run 'tradingview-cli presets' to see available presets.\n`
    );
    process.exit(1);
  }

  const format = (values.format as OutputFormat) || "json";
  const preset = presetsTool.getPreset(name);
  if (!preset) {
    process.stderr.write(
      `Unknown preset: ${name}. Run 'tradingview-cli presets' to see available presets.\n`
    );
    process.exit(1);
  }

  process.stdout.write(formatOutput(preset, format) + "\n");
}

async function handlePresets(argv: string[]) {
  const { values } = parsePresetArgs(argv);

  if (values.help) {
    process.stdout.write(PRESETS_HELP + "\n");
    return;
  }

  const format = (values.format as OutputFormat) || "json";
  const result = presetsTool.listPresets();
  process.stdout.write(formatOutput(result, format) + "\n");
}

async function handleSearch(argv: string[]) {
  const { positionals, values } = parseSearchArgs(argv);

  if (values.help) {
    process.stdout.write(SEARCH_HELP + "\n");
    return;
  }

  const format = (values.format as OutputFormat) || "json";
  const input = buildSearchInput(positionals, values);
  const result = await searchTool.searchSymbols(input);
  process.stdout.write(formatOutput(result, format) + "\n");
}

async function handleMetainfo(argv: string[]) {
  const { positionals, values } = parseMetainfoArgs(argv);

  if (values.help) {
    process.stdout.write(METAINFO_HELP + "\n");
    return;
  }

  const format = (values.format as OutputFormat) || "json";
  const input = buildMetainfoInput(positionals, values);
  const result = await metainfoTool.getMetainfo(input);
  process.stdout.write(formatOutput(result, format) + "\n");
}

async function handleTA(argv: string[]) {
  const { positionals, values } = parseTAArgs(argv);

  if (values.help) {
    process.stdout.write(TA_HELP + "\n");
    return;
  }

  const format = (values.format as OutputFormat) || "json";
  const input = buildTAInput(positionals, values);
  const result = await taTool.getTASummary(input);
  process.stdout.write(formatOutput(result, format) + "\n");
}

async function handleRankTA(argv: string[]) {
  const { positionals, values } = parseTAArgs(argv);

  if (values.help) {
    process.stdout.write(RANK_TA_HELP + "\n");
    return;
  }

  const format = (values.format as OutputFormat) || "json";
  const input = buildRankTAInput(positionals, values);
  const result = await taTool.rankByTA(input);
  process.stdout.write(formatOutput(result, format) + "\n");
}

main().catch((err) => {
  process.stderr.write(`Error: ${err.message}\n`);
  process.exit(1);
});

// Experimental tools are not part of core-path — see feat/lab-path branch
