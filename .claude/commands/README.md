# Claude Code Commands

This directory contains custom slash commands for the TradingView MCP Server that demonstrate practical usage patterns and provide quick access to common workflows.

## Available Commands

### `/market-regime` - Market Regime Analysis

**Purpose:** Quickly assess overall market conditions by checking major global indexes relative to their all-time highs.

**What it does:**
1. Fetches current data for Nasdaq Composite, OMX Stockholm 30, and Nikkei 225
2. Calculates drawdown percentages from all-time highs
3. Displays color-coded status table (🟢 green = healthy, 🟡 amber = caution, 🔴 red = warning)
4. Provides market regime summary

**When to use:**
- Before making new investment allocations
- To understand current market positioning
- For risk assessment and position sizing
- Weekly/monthly portfolio reviews

**Example output:**
```
Index              | Current  | ATH      | Drawdown | Status | 1Y Perf | RSI
-------------------|----------|----------|----------|--------|---------|-----
Nasdaq Composite   | 23,827   | 23,261   | +2.43%   | 🟢     | +27.8%  | 69.7
OMX Stockholm 30   | 2,789    | 2,788    | +0.04%   | 🟢     | +7.2%   | 66.5
Nikkei 225         | 50,219   | 49,946   | +0.55%   | 🟢     | +33.0%  | 67.9

Summary: All 3 indexes GREEN (at/near all-time highs)
Regime: Strong bull market with slightly elevated RSI (caution on new entries)
```

---

### `/run-screener` - Interactive Stock Screening

**Purpose:** Run pre-configured screening strategies and save results for further analysis.

**What it does:**
1. Lists all available preset strategies (quality, value, dividend, momentum, growth, etc.)
2. Asks you to select a strategy interactively
3. Runs the screener with the chosen preset
4. Displays summary table of top results
5. Saves complete results to CSV file with timestamp

**When to use:**
- Building watchlists for different investment styles
- Learning what different strategies find
- Comparing results across multiple time periods
- Generating ideas for further research

**Output location:**
- CSV files saved to: `docs/local/screening-runs/`
- Filename format: `{preset_name}_{YYYY-MM-DD_HH-MM-SS}.csv`

**Example workflow:**
```bash
# 1. Run the command
/run-screener

# 2. Select strategy (e.g., "Quality Stocks")

# 3. Review summary table:
#    - Top 10 results shown with key metrics
#    - Total count of matches

# 4. Open CSV for deeper analysis:
#    docs/local/screening-runs/quality_stocks_2025-10-28_22-30-45.csv
```

---

## Usage Tips

### First-time setup

After cloning the repository:

```bash
# Quick setup script (recommended)
./local-setup.sh          # Linux/Mac
local-setup.bat           # Windows

# Or manually:
cp .mcp.json.example .mcp.json
cp .claude/settings.json.example .claude/settings.local.json

# Restart Claude Code
```

### Development mode

For active development on the MCP server:

```bash
# Modify .mcp.json to use local source:
# "args": ["tsx", "src/index.ts"]  # Instead of npx tradingview-mcp-server
```

This runs TypeScript source directly without building, enabling faster iteration.

---

## Creating Custom Commands

Custom commands are markdown files in this directory with frontmatter:

```markdown
---
description: Brief description of what the command does
---

# Command Title

Detailed instructions for Claude Code to execute...
```

**Tips for writing commands:**
1. Be specific and actionable - commands are instructions, not documentation
2. Reference MCP tools explicitly (e.g., `mcp__tradingview__screen_stocks`)
3. Include example responses or table formats
4. Handle edge cases (0 results, errors)
5. Provide clear success criteria

See the [Claude Code documentation](https://docs.claude.com/claude-code) for more details on custom commands.

---

## MCP Tools Used

These commands leverage the following TradingView MCP tools:

- `mcp__tradingview__lookup_symbols` - Direct symbol lookup (indexes, stocks)
- `mcp__tradingview__screen_stocks` - Stock screening with filters
- `mcp__tradingview__get_preset` - Fetch pre-configured strategies
- `mcp__tradingview__list_presets` - List all available presets

For complete MCP tool documentation, see the main [README.md](../../README.md).

---

## Output Directory

The `docs/local/` directory (gitignored) is used for command outputs:

```
docs/local/
└── screening-runs/     # CSV outputs from /run-screener
    ├── quality_stocks_2025-10-28_22-30-45.csv
    ├── value_stocks_2025-10-28_22-35-12.csv
    └── market_indexes_2025-10-28_22-40-33.csv
```

This keeps your analysis organized and prevents clutter in the main repository.
