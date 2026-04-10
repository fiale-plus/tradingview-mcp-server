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
  search           Search for symbols by name or ticker
  metainfo         Get market metadata and available fields
  ta               Technical analysis summary for symbols
  rank-ta          Rank symbols by TA scores
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
  tradingview-cli search apple --exchange NASDAQ --limit 10
  tradingview-cli metainfo america
  tradingview-cli ta NASDAQ:AAPL NASDAQ:NVDA --timeframes 60 240 1D 1W
  tradingview-cli rank-ta NASDAQ:AAPL NASDAQ:MSFT NASDAQ:NVDA --timeframes 60 1D --weights '{"1D": 3}'
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

export const SEARCH_HELP = `Usage: tradingview-cli search <query> [options]

Search for TradingView symbols by name, ticker, or description.

Options:
  --exchange <ex>        Filter by exchange (e.g., NASDAQ, NYSE)
  --asset-type <type>    Filter by asset type: stock, forex, crypto, cfd, futures, index, economic
  --limit <n>            Maximum results (1-50, default: 20)
  --start <n>            Offset for pagination (default: 0)
  -f, --format <format>  Output format: json, csv, table (default: json)
  -h, --help             Show help

Examples:
  tradingview-cli search apple
  tradingview-cli search bitcoin --asset-type crypto
  tradingview-cli search microsoft --exchange NASDAQ --limit 5`;

export const METAINFO_HELP = `Usage: tradingview-cli metainfo <market> [options]

Get metadata about a TradingView market screener, including available fields.

Options:
  --fields <field>       Specific field names to look up (repeatable)
  --mode <mode>          Output mode: summary (default) or raw
  -f, --format <format>  Output format: json, csv, table (default: json)
  -h, --help             Show help

Examples:
  tradingview-cli metainfo america
  tradingview-cli metainfo america --fields name --fields close
  tradingview-cli metainfo america --mode raw`;

export const TA_HELP = `Usage: tradingview-cli ta <symbol...> [options]

Get TradingView-style technical analysis summary for symbols across timeframes.

Options:
  --timeframes <tf>     Timeframes: 1, 3, 5, 15, 30, 45, 60, 120, 180, 240, 1D, 1W, 1M (repeatable, default: 60 240 1D 1W)
  --no-components       Hide oscillator/MA score breakdown
  -f, --format <format> Output format: json, csv, table (default: json)
  -h, --help            Show help

Examples:
  tradingview-cli ta NASDAQ:AAPL
  tradingview-cli ta NASDAQ:AAPL NASDAQ:NVDA --timeframes 60 240 1D 1W
  tradingview-cli ta NASDAQ:AAPL --no-components`;

export const RANK_TA_HELP = `Usage: tradingview-cli rank-ta <symbol...> [options]

Rank symbols by weighted technical analysis scores.

Options:
  --timeframes <tf>     Timeframes (repeatable, default: 60 240 1D 1W)
  --weights <json>      Per-timeframe weights as JSON (default: equal weight)
  -f, --format <format> Output format: json, csv, table (default: json)
  -h, --help             Show help

Examples:
  tradingview-cli rank-ta NASDAQ:AAPL NASDAQ:MSFT NASDAQ:NVDA
  tradingview-cli rank-ta NASDAQ:AAPL NASDAQ:MSFT --timeframes 60 1D --weights '{"1D": 3}'`;

export const EXPERIMENTAL_BARS_HELP = `Usage: tradingview-cli experimental bars <symbol> [options]

[EXPERIMENTAL] Fetch historical OHLCV bars for a symbol via TradingView WebSocket.
Requires TV_EXPERIMENTAL_ENABLED=1.

Options:
  --timeframe <tf>       Timeframe: 1, 3, 5, 15, 30, 45, 60, 120, 180, 240, 1D, 1W, 1M (default: 1D)
  --limit <n>            Number of bars (default: 300, max: 5000)
  --extended-session     Include extended/pre-market session
  -f, --format <format>  Output format: json, csv, table (default: json)
  -h, --help             Show help

Examples:
  TV_EXPERIMENTAL_ENABLED=1 tradingview-cli experimental bars BINANCE:BTCUSDT --timeframe 60
  TV_EXPERIMENTAL_ENABLED=1 tradingview-cli experimental bars NASDAQ:AAPL --timeframe 1D --limit 100`;

export const EXPERIMENTAL_STREAM_QUOTES_HELP = `Usage: tradingview-cli experimental stream-quotes <symbol...> [options]

[EXPERIMENTAL] Stream real-time quotes for symbols for a bounded duration.
Requires TV_EXPERIMENTAL_ENABLED=1.

Options:
  --fields <field>       Quote fields to request (repeatable)
  --duration <seconds>   Collection duration in seconds (default: 10, max: 60)
  -f, --format <format>  Output format: json, csv, table (default: json)
  -h, --help             Show help

Examples:
  TV_EXPERIMENTAL_ENABLED=1 tradingview-cli experimental stream-quotes NASDAQ:AAPL --duration 10
  TV_EXPERIMENTAL_ENABLED=1 tradingview-cli experimental stream-quotes BINANCE:BTCUSDT NASDAQ:NVDA --fields lp bid ask --duration 15`;

export const EXPERIMENTAL_STREAM_BARS_HELP = `Usage: tradingview-cli experimental stream-bars <symbol> [options]

[EXPERIMENTAL] Stream bar updates for a symbol for a bounded duration.
Requires TV_EXPERIMENTAL_ENABLED=1.

Options:
  --timeframe <tf>       Timeframe (default: 1, i.e., 1-minute)
  --duration <seconds>   Collection duration in seconds (default: 30, max: 120)
  --mode <mode>          Streaming mode: rolling or close_only (default: rolling)
  -f, --format <format>  Output format: json, csv, table (default: json)
  -h, --help             Show help

Examples:
  TV_EXPERIMENTAL_ENABLED=1 tradingview-cli experimental stream-bars BINANCE:BTCUSDT --timeframe 1 --duration 30
  TV_EXPERIMENTAL_ENABLED=1 tradingview-cli experimental stream-bars BINANCE:BTCUSDT --mode close_only --duration 60`;
