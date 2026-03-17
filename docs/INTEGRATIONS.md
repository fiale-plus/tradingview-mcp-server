# Multi-MCP Integration Guide

## Overview

The TradingView MCP Server is a screener and market data source — it finds candidates and monitors conditions. It does not provide news, deep fundamental filings, execution, or persistent storage. Pairing it with other MCP servers fills those gaps and enables end-to-end investment workflows without leaving Claude.

This guide describes four investor archetypes, their recommended MCP stack, example `claude_desktop_config.json` configurations, and a detailed screen-to-execute workflow example.

---

## Investor Archetypes

### Passive Investor

**Profile:** Reviews portfolio monthly, wants low-friction screening and record-keeping.

**MCP Stack:**
- TradingView MCP Server — screening and market data
- Google Sheets MCP — auto-export results to a live spreadsheet
- Google Calendar / Email MCP — reminders for earnings dates and monthly reviews

**Workflow:**
1. `/run-screener` with `quality_stocks` or `dividend_growth` preset
2. Export results to a dedicated Google Sheet via Sheets MCP
3. Set calendar reminder for next earnings date of top picks via Calendar MCP

**Example `claude_desktop_config.json`:**
```json
{
  "mcpServers": {
    "tradingview": {
      "command": "node",
      "args": ["/path/to/tradingview-mcp-server/dist/index.js"],
      "env": {
        "CACHE_TTL_SECONDS": "300",
        "RATE_LIMIT_RPM": "10"
      }
    },
    "google-sheets": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-google-sheets"],
      "env": {
        "GOOGLE_CREDENTIALS": "/path/to/credentials.json"
      }
    },
    "google-calendar": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-google-calendar"],
      "env": {
        "GOOGLE_CREDENTIALS": "/path/to/credentials.json"
      }
    }
  }
}
```

---

### Active Investor

**Profile:** Trades weekly or more frequently, wants news context before acting and notifications when done.

**MCP Stack:**
- TradingView MCP Server — screening, technical setup, macro dashboard
- Alpha Vantage MCP — news, sentiment analysis, earnings transcripts
- Interactive Brokers MCP — order placement and portfolio monitoring
- Slack MCP — trade notifications and daily summaries

**Workflow:**
1. `/smart-screen` to identify candidates based on regime
2. Alpha Vantage MCP to pull recent news sentiment for top candidates
3. Rank by combined score (analyst upside × sentiment × FCF margin)
4. Place limit orders via IBKR MCP
5. Post trade summary to Slack channel via Slack MCP

**Example `claude_desktop_config.json`:**
```json
{
  "mcpServers": {
    "tradingview": {
      "command": "node",
      "args": ["/path/to/tradingview-mcp-server/dist/index.js"],
      "env": {
        "CACHE_TTL_SECONDS": "300",
        "RATE_LIMIT_RPM": "10"
      }
    },
    "alpha-vantage": {
      "command": "npx",
      "args": ["-y", "alpha-vantage-mcp"],
      "env": {
        "ALPHA_VANTAGE_API_KEY": "your-key-here"
      }
    },
    "ibkr": {
      "command": "node",
      "args": ["/path/to/ibkr-mcp/dist/index.js"],
      "env": {
        "IBKR_ACCOUNT": "your-account-id"
      }
    },
    "slack": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-slack"],
      "env": {
        "SLACK_BOT_TOKEN": "xoxb-your-token"
      }
    }
  }
}
```

---

### Systematic / Quant

**Profile:** Builds and backtests rule-based strategies, stores results, and versions strategy code.

**MCP Stack:**
- TradingView MCP Server — live screening and signal generation
- QuantConnect MCP — backtesting screening strategies on historical data
- SQLite MCP — persist screening results and strategy performance over time
- GitHub MCP — version control for strategy definitions and parameters

**Workflow:**
1. Define a screening strategy using TradingView presets or custom filters
2. Pass the same filter logic to QuantConnect MCP for historical backtesting
3. Store backtest results and live screen outputs in SQLite via SQLite MCP
4. Commit strategy updates to GitHub via GitHub MCP for version history

**Example `claude_desktop_config.json`:**
```json
{
  "mcpServers": {
    "tradingview": {
      "command": "node",
      "args": ["/path/to/tradingview-mcp-server/dist/index.js"],
      "env": {
        "CACHE_TTL_SECONDS": "60",
        "RATE_LIMIT_RPM": "10"
      }
    },
    "sqlite": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sqlite", "--db-path", "/path/to/strategies.db"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "your-token-here"
      }
    }
  }
}
```

---

### Team / Research

**Profile:** Investment team sharing research notes, reviewing each other's screens, and coordinating decisions.

**MCP Stack:**
- TradingView MCP Server — screening and candidate data
- Notion MCP — structured research notes and watchlists per analyst
- GitHub MCP — version-controlled strategy definitions with PR review
- Slack MCP — team notifications and screening summaries
- Google Calendar MCP — earnings calendar and investment committee scheduling

**Workflow:**
1. Analyst runs `/due-diligence TICKER` and `/investment-thesis TICKER`
2. Research note written to Notion via Notion MCP with data-filled template
3. Strategy changes submitted as GitHub PR for team review via GitHub MCP
4. Merged strategies trigger a Slack notification with summary via Slack MCP
5. Earnings dates added to shared Google Calendar via Calendar MCP

**Example `claude_desktop_config.json`:**
```json
{
  "mcpServers": {
    "tradingview": {
      "command": "node",
      "args": ["/path/to/tradingview-mcp-server/dist/index.js"],
      "env": {
        "CACHE_TTL_SECONDS": "300",
        "RATE_LIMIT_RPM": "10"
      }
    },
    "notion": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-notion"],
      "env": {
        "NOTION_API_KEY": "secret_your-notion-key"
      }
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "your-token-here"
      }
    },
    "slack": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-slack"],
      "env": {
        "SLACK_BOT_TOKEN": "xoxb-your-token"
      }
    }
  }
}
```

---

## Complementary MCP Servers

### Alpha Vantage MCP

**Stars:** ~102 (official)
**Install:** `npx -y alpha-vantage-mcp`
**API key required:** Yes (free tier available at alphavantage.co)

**What it adds:** Real-time and historical news, sentiment scores per ticker, earnings transcripts, insider transaction filings, and analyst estimates.

**Complementary workflow with TradingView:**
1. Run `screen_stocks` with `quality_compounder` preset to find candidates with strong fundamentals
2. Pass top 5 symbols to Alpha Vantage MCP to retrieve the last 30 days of news and sentiment scores
3. Deprioritize any candidate with a negative sentiment trend even if the fundamentals screen well
4. Use Alpha Vantage earnings transcripts to verify the "moat" narrative before running `/investment-thesis`

**Why combine:** TradingView gives you quantitative signals (margins, RSI, growth rate); Alpha Vantage gives you qualitative context (what management said last quarter, whether insiders are buying).

---

### Yahoo Finance MCP

**Stars:** ~238
**Install:** `npx -y yahoo-finance-mcp` (community)
**API key required:** No (free)

**What it adds:** Historical price series, institutional ownership percentages, analyst price targets, options data, and earnings history — all free.

**Complementary workflow with TradingView:**
1. `/run-screener` with `value_stocks` preset to find low-P/E candidates
2. Yahoo Finance MCP → check institutional ownership change (increasing = smart money building position)
3. Yahoo Finance MCP → check analyst consensus and price target upside
4. Combine: screen rank × (analyst upside %) to prioritize the watchlist

**Why combine:** TradingView's screener does not expose institutional ownership or analyst consensus directly. Yahoo Finance fills this gap at zero cost.

---

### SEC EDGAR MCP

**Stars:** varies (multiple implementations)
**Install:** `npx -y @modelcontextprotocol/server-edgar` or community equivalents
**API key required:** No (SEC data is public)

**What it adds:** Full 10-K and 10-Q filings, 13F institutional holdings reports, insider Form 4 filings, 8-K material event disclosures.

**Complementary workflow with TradingView:**
1. `/due-diligence TICKER` to get the quantitative picture
2. SEC EDGAR MCP → pull the most recent 10-K to verify the revenue breakdown and risk factors section
3. SEC EDGAR MCP → pull 13F filings to see which institutional managers are building positions
4. SEC EDGAR MCP → pull Form 4 to check executive insider buying/selling over the last 6 months
5. Add findings to the `/investment-thesis` output as a "Filing Deep-Dive" section

**Why combine:** TradingView provides derived metrics (margins, growth rates); SEC EDGAR provides the source data that those metrics are calculated from. Discrepancies between the two are a research flag.

---

### n8n (Workflow Automation)

**Type:** Self-hosted or cloud workflow automation platform with native MCP client support
**What it adds:** Scheduled autonomous execution — run screeners on a cron schedule without a human in the loop, filter results against criteria, and trigger notifications or exports automatically.

**Complementary workflow with TradingView:**
1. n8n schedule trigger (e.g., every weekday at 7:00 AM)
2. Call TradingView MCP `screen_stocks` with `quality_growth_screener` filters
3. Filter results: keep only stocks where 1Y return > 15% and RSI < 65
4. Compare against yesterday's results (stored in SQLite or Sheets) to find new entries
5. New entries trigger a Slack message or email with the ticker list

**Why combine:** The TradingView MCP Server is reactive — it responds to prompts. n8n makes it proactive — it runs screeners on a schedule and surfaces changes without requiring a daily manual check.

---

## Screen-to-Execute Workflow Example

This example shows a complete pipeline from screening to order placement using TradingView + Alpha Vantage + IBKR MCP servers.

### Step 1: Screen for candidates

```
Use TradingView MCP screen_stocks with quality_compounder preset, limit 10
```

Returns top 10 stocks ranked by ROIC with: gross margin >40%, ROIC >15%, FCF margin >15%, revenue growth >5%, D/E <0.8.

### Step 2: Enrich with analyst consensus

```
Use TradingView MCP lookup_symbols for the top 10 symbols
Columns: close, price_52_week_high, all_time_high, RSI, beta_1_year
```

Identify which of the 10 are within 15% of their ATH (uptrend intact) and have RSI below 70 (not overbought).

### Step 3: News and sentiment filter

```
Use Alpha Vantage MCP get_news_sentiment for each of the filtered symbols
Look at sentiment score and article count for the past 30 days
```

Exclude any symbol with a negative average sentiment score or >3 negative news articles in the past week.

### Step 4: Rank and score

Compute a composite score for each remaining candidate:

```
Score = (analyst_upside_pct × 0.4) + (sentiment_score × 0.3) + (fcf_margin × 0.3)
```

Take the top 3 by score.

### Step 5: Place orders

```
Use IBKR MCP place_order for each of the top 3 symbols
Order type: limit
Limit price: current close × 1.005 (0.5% above current price to ensure fill)
Position size: equal weight, e.g., $10,000 each
```

### Step 6: Notify

```
Use Slack MCP post_message to #trading-signals channel
Include: symbols purchased, entry prices, composite scores, stop loss levels (close × 0.93)
```

### Monitoring (daily or weekly)

- Re-run `/smart-screen` to check if market regime has shifted
- Re-run `/portfolio-risk` on the new holdings to verify concentration
- Re-run Alpha Vantage sentiment check on open positions to catch news deterioration early

---

## Notes on API Limits

The TradingView MCP Server is rate-limited to 10 requests per minute by default (configurable via `RATE_LIMIT_RPM`). Multi-server workflows that involve many parallel lookups should stagger calls or increase the limit if your usage allows. The `/sector-rotation` command, for example, makes 11 sequential calls and will take approximately 15–30 seconds to complete.

When combining with other MCP servers, be aware that each server has its own rate limits. Alpha Vantage free tier allows 5 requests per minute and 500 per day. Plan your workflows accordingly.
