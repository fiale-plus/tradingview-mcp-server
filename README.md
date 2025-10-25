# TradingView MCP Server

[![NPM Version](https://img.shields.io/npm/v/tradingview-mcp-server?style=flat-square)](https://www.npmjs.com/package/tradingview-mcp-server)
[![NPM Downloads](https://img.shields.io/npm/dm/tradingview-mcp-server?style=flat-square)](https://www.npmjs.com/package/tradingview-mcp-server)
[![Test Status](https://img.shields.io/github/actions/workflow/status/fiale-plus/tradingview-mcp-server/test.yml?branch=main&label=tests&style=flat-square)](https://github.com/fiale-plus/tradingview-mcp-server/actions/workflows/test.yml)
[![License](https://img.shields.io/github/license/fiale-plus/tradingview-mcp-server?style=flat-square)](LICENSE)
[![MCP](https://img.shields.io/badge/MCP-Compatible-blue?style=flat-square)](https://modelcontextprotocol.io)

**Unofficial** Model Context Protocol (MCP) server for TradingView's stock screener API.

🚧 **Work in Progress** - This project is in early development (v0.1.0 MVP).

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Configuration](#configuration)
  - [Claude Desktop](#claude-desktop)
  - [Claude Code](#claude-code-project-level)
  - [Environment Variables](#environment-variables)
- [Usage Examples](#usage-examples)
- [Available Tools](#available-tools)
- [Preset Strategies](#preset-strategies)
- [Common Fields](#common-fields)
- [Field Variants (TTM vs FQ vs FY)](#field-variants-ttm-vs-fq-vs-fy)
- [Development](#development)
- [Important Notes](#important-notes)
- [Contributing](#contributing)
- [License](#license)

## Features

- 🔍 **Screen stocks, forex, and crypto** with advanced filters
- 📊 **40+ fundamental, technical, and performance fields** with TTM/FQ/FY variants
- 🎯 **5 preset strategies** (quality, value, dividend, momentum, growth)
- ⚡ **Configurable caching and rate limiting**
- 🔧 **Works with Claude Desktop and Claude Code**
- 🏦 **Exchange filtering** (NASDAQ, NYSE, CBOE) and primary listing support

## Installation

### Option 1: NPM (Recommended)

```bash
npm install -g tradingview-mcp-server
```

### Option 2: Local Development

```bash
git clone https://github.com/fiale-plus/tradingview-mcp-server.git
cd tradingview-mcp-server
npm install
npm run build
```

## Configuration

### Claude Desktop

Add to your Claude Desktop configuration file:

**Mac**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
**Linux**: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "tradingview": {
      "command": "npx",
      "args": ["-y", "tradingview-mcp-server"],
      "env": {
        "CACHE_TTL_SECONDS": "300",
        "RATE_LIMIT_RPM": "10"
      }
    }
  }
}
```

### Claude Code (Project-Level)

Create `.mcp.json` in your project root:

```json
{
  "mcpServers": {
    "tradingview": {
      "command": "npx",
      "args": ["-y", "tradingview-mcp-server"],
      "env": {
        "CACHE_TTL_SECONDS": "300",
        "RATE_LIMIT_RPM": "10"
      }
    }
  }
}
```

Enable in `.claude/settings.local.json`:

```json
{
  "enableAllProjectMcpServers": true
}
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CACHE_TTL_SECONDS` | Cache time-to-live in seconds (0 to disable) | `300` (5 min) |
| `RATE_LIMIT_RPM` | API requests per minute | `10` |

## Usage Examples

### 1. Screen for Quality Stocks

```
Find high-quality stocks with strong fundamentals using the quality_stocks preset
```

Claude will use the preset with filters:
- ROE > 12%
- Low debt (D/E < 0.7)
- Good margins (Net Margin > 10%)
- Low volatility
- Golden cross (SMA50 > SMA200)

### 2. Custom Screening

```
Screen for stocks with:
- ROE greater than 15%
- P/E ratio less than 25
- Market cap above $1 billion
- Limit to 10 results
```

### 3. List Available Fields

```
What fields can I use for stock screening?
```

Returns all available fields with descriptions, organized by category (fundamental, technical, performance).

### 4. Get Moving Averages

```
Get SMA50 and SMA200 for AAPL
```

### 5. Compare Stocks

```
Compare fundamentals of AAPL, MSFT, and GOOGL
```

## Available Tools

### `screen_stocks`

Screen stocks based on filters.

**Parameters:**
- `filters` - Array of filter conditions (field, operator, value)
- `markets` - Markets to scan (default: `["america"]`)
- `sort_by` - Field to sort by (default: `"market_cap_basic"`)
- `sort_order` - `"asc"` or `"desc"` (default: `"desc"`)
- `limit` - Number of results (1-200, default: 20)

**Operators:**
- `greater`, `less`, `greater_or_equal`, `less_or_equal`
- `equal`, `not_equal`
- `in_range` - For value ranges like `[45, 65]`
- `match` - For text search

### `list_fields`

List available fields for filtering.

**Parameters:**
- `asset_type` - `"stock"`, `"forex"`, or `"crypto"` (default: `"stock"`)
- `category` - `"fundamental"`, `"technical"`, or `"performance"` (optional)

### `get_preset`

Get a pre-configured screening strategy.

**Available Presets:**
- `quality_stocks` - Conservative quality stocks (Avanza-based)
- `value_stocks` - Undervalued stocks with low P/E and P/B
- `dividend_stocks` - High dividend yield with consistent payout
- `momentum_stocks` - Strong momentum and technical signals
- `growth_stocks` - High-growth companies

### `list_presets`

List all available preset strategies.

## Preset Strategies

The server includes 5 pre-configured screening strategies optimized for different investment styles:

### Quality Stocks (Conservative)
**Preset:** `quality_stocks`

High-quality, low-volatility stocks with strong fundamentals and uptrends. Based on Avanza's conservative screening strategy.

**Criteria:**
- ROE > 12%
- Market cap > $200M
- P/E < 40
- P/S < 8
- Debt/Equity < 0.7
- Net margin > 10%
- RSI between 45-65
- Monthly volatility ≤ 3%
- Golden cross (SMA50 > SMA200)

### Value Stocks
**Preset:** `value_stocks`

Undervalued stocks trading below intrinsic value with solid fundamentals.

**Criteria:**
- P/E < 15
- P/B < 1.5
- Market cap > $1B
- ROE > 10%

### Dividend Stocks
**Preset:** `dividend_stocks`

Income-focused stocks with high dividend yields and financial stability.

**Criteria:**
- Dividend yield > 3%
- Market cap > $5B
- Debt/Equity < 1.0

### Momentum Stocks
**Preset:** `momentum_stocks`

Stocks showing strong technical momentum and recent performance.

**Criteria:**
- RSI between 50-70
- SMA50 > SMA200 (golden cross)
- 1-month performance > 5%
- Volume > 1M shares

### Growth Stocks
**Preset:** `growth_stocks`

High-growth companies with strong profitability and margins.

**Criteria:**
- ROE > 20%
- Operating margin > 15%
- Market cap > $1B

## Common Fields

### Fundamental
- `return_on_equity` - ROE (%)
- `price_earnings_ttm` - P/E Ratio
- `price_book_fq` - P/B Ratio
- `debt_to_equity` - Debt/Equity Ratio
- `net_margin_ttm` - Net Margin (%)
- `market_cap_basic` - Market Capitalization
- `dividend_yield_recent` - Dividend Yield (%)

### Technical
- `RSI` - Relative Strength Index (14)
- `SMA50` - 50-day Simple Moving Average
- `SMA200` - 200-day Simple Moving Average
- `Volatility.M` - Monthly Volatility (%)

### Performance
- `close` - Current Price
- `change` - Daily Change (%)
- `volume` - Trading Volume
- `average_volume_90d_calc` - 90-day Average Volume
- `Perf.W`, `Perf.1M`, `Perf.Y` - Performance metrics
- `exchange` - Stock exchange (NASDAQ, NYSE, CBOE)
- `is_primary` - Primary listing indicator

## Field Variants (TTM vs FQ vs FY)

Many financial metrics have multiple time period variants. Understanding these is crucial for accurate screening:

### Time Period Suffixes

- **TTM** (Trailing Twelve Months): Rolling 12-month period
  - Most recent, updates quarterly
  - Example: `return_on_equity`, `price_earnings_ttm`, `net_margin_ttm`

- **FQ** (Fiscal Quarter): Most recent completed quarter
  - Updates quarterly
  - More volatile than TTM
  - Example: `return_on_equity_fq`, `price_book_fq`

- **FY** (Fiscal Year): Most recent completed fiscal year
  - Updates annually
  - Most stable, less frequent updates
  - Example: `debt_to_equity_fy`, `net_margin_fy`

### Common Field Variants

| Base Metric | TTM | FQ | FY |
|-------------|-----|----|----|
| Return on Equity | `return_on_equity` | `return_on_equity_fq` | - |
| Net Margin | `net_margin_ttm` | - | `net_margin_fy` |
| Debt/Equity | `debt_to_equity` | - | `debt_to_equity_fy` |
| Price/Sales | `price_sales_ratio` | - | `price_sales_current` |

### Usage Tips

1. **For conservative screening**: Use FY variants for stability
2. **For current analysis**: Use TTM or FQ for recent performance
3. **Mixing periods**: You can mix different variants in the same filter
4. **TradingView UI matching**: Use FQ/FY variants to match TradingView's web screener exactly

Example using fiscal year data:
```javascript
{
  filters: [
    { field: "return_on_equity_fq", operator: "greater", value: 15 },
    { field: "debt_to_equity_fy", operator: "less", value: 0.6 },
    { field: "net_margin_fy", operator: "greater", value: 12 }
  ]
}
```

## Resources

The server exposes preset configurations as MCP resources:

- `preset://quality_stocks`
- `preset://value_stocks`
- `preset://dividend_stocks`
- `preset://momentum_stocks`
- `preset://growth_stocks`

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build
npm run build

# Run tests
npm test

# Watch tests
npm test:watch
```

## Important Notes

⚠️ **Unofficial API**: This server uses TradingView's unofficial scanner API. It may change without notice.

- No authentication required
- Same access level as TradingView website without login
- No official documentation or support from TradingView
- Use responsibly with rate limiting

## Limitations

- **Current snapshot only** - No historical data
- **Rate limits** - Conservative default (10 req/min) to avoid overloading
- **Calculated fields** - Some metrics (e.g., Revenue per Share) need post-processing
- **Market hours** - Data freshness depends on TradingView's update schedule

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Disclaimer

This is an unofficial tool and is not affiliated with, endorsed by, or connected to TradingView. Use at your own risk.

## Links

- [Model Context Protocol](https://spec.modelcontextprotocol.io)
- [TradingView](https://www.tradingview.com)
- [Claude Desktop](https://claude.ai/download)
- [Claude Code](https://docs.claude.com/claude-code)

---

Built with ❤️ using the [Model Context Protocol](https://modelcontextprotocol.io)
