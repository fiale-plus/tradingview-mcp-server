<div align="center">
  <img src="docs/images/banner.png" alt="TradingView MCP Server Banner" width="100%">
</div>

<div align="center">

[![NPM Version](https://img.shields.io/npm/v/tradingview-mcp-server?style=flat-square)](https://www.npmjs.com/package/tradingview-mcp-server)
[![NPM Downloads](https://img.shields.io/npm/dm/tradingview-mcp-server?style=flat-square)](https://www.npmjs.com/package/tradingview-mcp-server)
[![Test Status](https://img.shields.io/github/actions/workflow/status/fiale-plus/tradingview-mcp-server/test.yml?branch=main&label=tests&style=flat-square)](https://github.com/fiale-plus/tradingview-mcp-server/actions/workflows/test.yml)
[![License](https://img.shields.io/github/license/fiale-plus/tradingview-mcp-server?style=flat-square)](LICENSE)
[![MCP](https://img.shields.io/badge/MCP-Compatible-blue?style=flat-square)](https://modelcontextprotocol.io)

**Unofficial** Model Context Protocol (MCP) server for TradingView's stock screener API.

</div>

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Configuration](#configuration)
- [Quick Start](#quick-start)
- [Documentation](#documentation)
- [Available Tools](#available-tools)
- [Important Notes](#important-notes)
- [Contributing](#contributing)
- [License](#license)

## Features

- 🔍 **Screen stocks, forex, and crypto** with advanced filters
- 📊 **75+ fundamental, technical, and performance fields** with TTM/FQ/FY variants
- 🎯 **6 preset strategies** (quality, value, dividend, momentum, growth, comprehensive)
- ⚡ **Performance optimized** - minimal (7 fields) vs extended (35 fields) column sets
- 💰 **Comprehensive valuation metrics** - EV, EV/EBIT, EV/EBITDA, PEG, margins, ROIC
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

Add to your Claude config file (`~/Library/Application Support/Claude/claude_desktop_config.json` on Mac):

```json
{
  "mcpServers": {
    "tradingview": {
      "command": "npx",
      "args": ["-y", "tradingview-mcp-server"]
    }
  }
}
```

### Claude Code

Create `.mcp.json` in your project root:

```json
{
  "mcpServers": {
    "tradingview": {
      "command": "npx",
      "args": ["-y", "tradingview-mcp-server"]
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

**Optional environment variables:**
- `CACHE_TTL_SECONDS` - Cache duration (default: 300)
- `RATE_LIMIT_RPM` - Requests per minute (default: 10)

## Quick Start

### Using Presets

Ask Claude to use pre-configured screening strategies:

```
Find quality growth stocks using the comprehensive screener
```

```
Show me dividend stocks with yield above 3%
```

```
Screen for value stocks with low P/E ratios
```

### Custom Screening

```
Screen for stocks with:
- ROE greater than 15%
- P/E ratio less than 25
- Market cap above $1 billion
```

### Exploring Fields

```
What fields can I use for stock screening?
```

```
Show me all valuation-related fields
```

## Documentation

### 📚 Comprehensive Guides

- **[Preset Strategies](docs/presets.md)** - All 6 preset strategies with detailed criteria, use cases, and examples
- **[Field Reference](docs/fields.md)** - Complete guide to all 75+ fields with descriptions and usage examples
- **[Development Guide](docs/development.md)** - Local setup, testing, and extending the server

### 🔧 Advanced Topics

- **[Field Variants (TTM/FQ/FY)](docs/fields.md#understanding-field-variants)** - Understanding time periods
- **[Column Optimization](docs/presets.md#performance-characteristics)** - Minimal vs extended column sets
- **[Custom Presets](docs/development.md#creating-new-presets)** - Creating your own screening strategies

## Available Tools

### `screen_stocks`

Screen stocks based on filters.

**Parameters:**
- `filters` - Array of filter conditions (field, operator, value)
- `markets` - Markets to scan (default: `["america"]`)
- `sort_by` - Field to sort by (default: `"market_cap_basic"`)
- `sort_order` - `"asc"` or `"desc"` (default: `"desc"`)
- `limit` - Number of results (1-200, default: 20)
- `columns` - Optional array of columns to return (default: minimal 7 fields for performance)

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
- `quality_stocks` - Conservative quality (ROE >12%, low debt, low volatility)
- `value_stocks` - Undervalued (P/E <15, P/B <1.5)
- `dividend_stocks` - High yield (>3%, low debt)
- `momentum_stocks` - Technical strength (RSI 50-70, golden cross)
- `growth_stocks` - High growth (ROE >20%, margins >15%)
- `quality_growth_screener` - Comprehensive 16-filter screen with 35 extended columns

See **[Preset Strategies Guide](docs/presets.md)** for detailed criteria and usage.

### `list_presets`

List all available preset strategies.

## Key Features at a Glance

### 75+ Available Fields

The server provides comprehensive coverage across categories:

- **Fundamental** - Core metrics (ROE, P/E, P/B), valuation (EV, EV/EBIT, PEG), margins (gross, operating, pre-tax), returns (ROA, ROIC), balance sheet (debt, assets, current ratio)
- **Technical** - RSI, moving averages (SMA50, SMA200), volatility, beta
- **Performance** - Price, volume, growth metrics, sector/industry

See **[Complete Field Reference](docs/fields.md)** for all 75+ fields with descriptions and examples.

### 6 Preset Strategies

Pre-configured screens for common investment strategies:

| Preset | Style | Key Criteria | Columns |
|--------|-------|--------------|---------|
| `quality_stocks` | Conservative | ROE >12%, low debt, low volatility | 7 default |
| `value_stocks` | Value | P/E <15, P/B <1.5 | 7 default |
| `dividend_stocks` | Income | Yield >3%, low debt | 7 default |
| `momentum_stocks` | Momentum | RSI 50-70, golden cross | 7 default |
| `growth_stocks` | Growth | ROE >20%, margins >15% | 7 default |
| `quality_growth_screener` | Comprehensive | 16 filters, deep analysis | 35 extended |

See **[Preset Strategies Guide](docs/presets.md)** for detailed criteria, use cases, and examples.

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

For development setup and guidelines, see the **[Development Guide](docs/development.md)**.

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
