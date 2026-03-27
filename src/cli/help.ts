/**
 * CLI help text for all commands
 */

export const MAIN_HELP = `Usage: tradingview-cli <command> [options]

Commands:
  screen stocks    Screen stocks by fundamental/technical criteria
  screen forex     Screen forex pairs
  screen crypto    Screen cryptocurrencies
  screen etf       Screen ETFs
  lookup           Look up specific symbols by ticker
  fields           List available screening fields
  preset           Get a preset screening strategy
  presets          List all available presets

Global options:
  -f, --format <json|csv|table>  Output format (default: json)
  -h, --help                     Show help
  -v, --version                  Show version

Environment variables:
  CACHE_TTL_SECONDS   Cache duration in seconds (default: 300)
  RATE_LIMIT_RPM      Requests per minute (default: 10)

Examples:
  tradingview-cli screen stocks --preset quality_stocks --limit 10
  tradingview-cli screen stocks --filters '[{"field":"price_earnings_ttm","operator":"less","value":15}]'
  tradingview-cli lookup NASDAQ:AAPL TVC:SPX
  tradingview-cli fields --asset-type stock --category fundamental
  tradingview-cli presets`;

export const SCREEN_HELP = `Usage: tradingview-cli screen <stocks|forex|crypto|etf> [options]

Options:
  --filters <json>       Filter array as JSON string
  --preset <name>        Load a preset strategy (merges with --filters)
  --markets <market>     Market to screen (repeatable, stocks/etf only)
  --sort-by <field>      Field to sort by
  --sort-order <asc|desc> Sort direction
  --limit <n>            Max results (1-200, default: 20)
  --columns <col>        Columns to include (repeatable)
  -f, --format <format>  Output format: json, csv, table (default: json)
  -h, --help             Show help

Filter syntax:
  Each filter is an object with: field, operator, value
  Operators: greater, less, greater_or_equal, less_or_equal, equal, not_equal,
             in_range, not_in_range, crosses, crosses_above, crosses_below,
             match, above_percent, below_percent, has, has_none_of, empty, not_empty

Examples:
  tradingview-cli screen stocks --preset quality_stocks --limit 10
  tradingview-cli screen stocks --filters '[{"field":"RSI","operator":"in_range","value":[40,60]}]'
  tradingview-cli screen stocks --preset value_stocks --sort-by price_earnings_ttm
  tradingview-cli screen forex --limit 20 --sort-by volume
  tradingview-cli screen crypto --filters '[{"field":"market_cap_basic","operator":"greater","value":1000000000}]'
  tradingview-cli screen etf --preset dividend_stocks -f csv`;

export const LOOKUP_HELP = `Usage: tradingview-cli lookup <symbol...> [options]

Look up specific symbols (stocks, indexes, forex, crypto) by ticker.

Options:
  --columns <col>        Columns to include (repeatable)
  -f, --format <format>  Output format: json, csv, table (default: json)
  -h, --help             Show help

Examples:
  tradingview-cli lookup NASDAQ:AAPL
  tradingview-cli lookup NASDAQ:AAPL NYSE:MSFT TVC:SPX
  tradingview-cli lookup TVC:SPX TVC:DJI --columns close change volume -f table`;

export const FIELDS_HELP = `Usage: tradingview-cli fields [options]

List available screening fields and their metadata.

Options:
  --asset-type <type>    Asset type: stock, forex, crypto, etf (default: stock)
  --category <cat>       Filter by category: fundamental, technical, performance
  -f, --format <format>  Output format: json, csv, table (default: json)
  -h, --help             Show help

Examples:
  tradingview-cli fields
  tradingview-cli fields --asset-type crypto
  tradingview-cli fields --asset-type stock --category fundamental -f table`;

export const PRESET_HELP = `Usage: tradingview-cli preset <name>

Get details of a preset screening strategy.

Options:
  -f, --format <format>  Output format: json, csv, table (default: json)
  -h, --help             Show help

Examples:
  tradingview-cli preset quality_stocks
  tradingview-cli preset market_indexes`;

export const PRESETS_HELP = `Usage: tradingview-cli presets

List all available preset screening strategies.

Options:
  -f, --format <format>  Output format: json, csv, table (default: json)
  -h, --help             Show help`;
