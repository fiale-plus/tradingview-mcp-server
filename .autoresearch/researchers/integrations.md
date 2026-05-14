# Researcher: integrations

## Assignment
Research ecosystem integration opportunities — portfolio tools, export formats, workflow automation, and complementary MCP servers.

## Summary (Round 1 + Round 2)
- **Total findings: 58** (8 from R1 + 50 from R2)
- **HIGH_VALUE: 40** | **MEDIUM_VALUE: 15** | **LOW_VALUE: 3**

---

## HIGH_VALUE Findings

### MCP Composition: Persistence & Tracking

1. **Filesystem MCP** (R1, impact:6, feasibility:9, complexity:low) — Official @modelcontextprotocol/server-filesystem. Basic persistence: save screening results as JSON/CSV files. No code changes to TradingView server.

2. **Google Sheets MCP** (R1, impact:8, feasibility:9, complexity:low) — Multiple servers (mcp-google-sheets, mcp-gdrive, Composio). Screen stocks → push to Google Sheets for portfolio tracking. CRUD, batching, formatting, sharing.

3. **SQLite MCP** (R1, impact:8, feasibility:9, complexity:low) — 165+ SQLite MCP servers. Store daily screening snapshots → query trends over time. Enables strategy performance tracking and historical analysis.

4. **Notion MCP** (R2 cycle 8, impact:8, feasibility:9, complexity:low) — Official makenotion/notion-mcp-server (22 tools). Investment CRM: screen stocks → create database entries with metrics, thesis, sector, date. Searchable, persistent investment database.

5. **Airtable MCP** (R2 cycle 9, impact:7, feasibility:9, complexity:low) — domdomegg/airtable-mcp-server (428 stars). Rich views: gallery for charts, kanban by strategy, calendar by earnings date. Airtable automations trigger on new records.

6. **Screening Diff via Filesystem** (R2 cycle 30, impact:7, feasibility:7, complexity:medium) — /track-screen command saves daily screening results to docs/local/screening-history/, compares with previous run to show new entries, exits, and metric changes. Session-scoped diff feasible in-server.

### MCP Composition: Communication & Alerts

7. **Slack/Discord MCP** (R1, impact:7, feasibility:9, complexity:low) — Slack native MCP server (March 2026). Screening alert workflows: run daily screens → post top picks to investment channels. Team-based investment workflows.

8. **Email MCP** (R2 cycle 5, impact:7, feasibility:9, complexity:low) — mcp-email-server (196 stars, IMAP+SMTP). Daily email digests: screen at market open → email formatted digest. Alert workflows. Multiple providers (Gmail, Outlook, ProtonMail).

9. **Google Calendar MCP** (R2 cycle 36, impact:8, feasibility:8, complexity:low) — keeper.sh (477 stars, multi-calendar). Screen watchlist → fetch earnings dates (earnings_release_next_trading_date_fq) → create calendar events. Ex-dividend date reminders. Highly practical for active investors.

### MCP Composition: Research & Fundamental Data

10. **SEC EDGAR MCP** (R1, impact:9, feasibility:8, complexity:low) — sec-edgar-mcp on PyPI/Docker/GitHub. 13M+ filings. Screen quality stocks → deep dive 10-K/10-Q for top picks. Killer due diligence workflow.

11. **FRED MCP** (R1, impact:8, feasibility:8, complexity:low) — 800,000+ economic time series. Macro-aware screening: check GDP/CPI/unemployment/rates → select defensive vs growth strategy.

12. **Alpha Vantage MCP** (R2 cycle 13, impact:9, feasibility:9, complexity:low) — Official alphavantage/alpha_vantage_mcp (102 stars). News sentiment, earnings call transcripts, 60+ technical indicators, insider transactions, institutional holdings, options with Greeks. Most comprehensive financial data MCP available.

13. **Yahoo Finance MCP** (R2 cycle 42, impact:8, feasibility:9, complexity:low) — Alex2Yang97/yahoo-finance-mcp (238 stars). FREE, no API key. Historical prices, dividends, splits, earnings history, institutional owners, news. mcp-optionsflow (27 stars) for options chains specifically.

14. **Obsidian MCP** (R1, impact:7, feasibility:8, complexity:low) — Investment journaling: screen results → create analysis notes with frontmatter tags. Builds investment knowledge base. Multiple mature servers.

15. **Insider Trading MCP (form4_mcp)** (R2 cycle 18, impact:8, feasibility:8, complexity:low) — coledie/form4_mcp (JS, August 2025). SEC Form 4 data. Screen quality stocks → check insider buying activity. Insider accumulation + strong fundamentals = powerful combined signal.

16. **Polygon.io MCP** (R2 cycle 34, impact:7, feasibility:7, complexity:medium) — polymcp (Rust, Jan 2026). Real-time quotes, options chains, tick data, corporate actions. Valuable for quants and options traders who need data beyond TradingView screener.

### MCP Composition: Trading & Execution

17. **Alpaca MCP** (R2 cycle 1, impact:8, feasibility:7, complexity:medium) — wlu03/alpaca-mcp-server (TypeScript). Commission-free trading. Screen stocks → place orders via Alpaca paper/live trading. Screen-to-execute workflow. Paper trading for safe testing.

18. **Interactive Brokers MCP** (R2 cycle 2, impact:9, feasibility:8, complexity:high) — IB_MCP (rcontesti, 101 stars), interactive-brokers-mcp (77 stars), 32+ total repos. Professional screen-to-execute: stocks, options, futures, forex. Institutional-grade execution. Requires TWS/Gateway connection.

19. **QuantConnect MCP** (R2 cycle 6, impact:8, feasibility:8, complexity:medium) — Official QuantConnect MCP server (65 stars). Screen candidates → backtest strategy on LEAN engine → analyze performance → refine filters. Closes the loop from idea generation to strategy validation.

### MCP Composition: Workflow Automation

20. **n8n Integration** (R2 cycle 11, impact:8, feasibility:7, complexity:medium) — n8n has native MCP Client Tool support. Schedule trigger → call TradingView MCP tools → process results → Slack/email. Enables 24/7 autonomous screening without user interaction.

21. **GitHub MCP** (R2 cycle 12, impact:7, feasibility:9, complexity:low) — Official github/github-mcp-server. Investment idea pipeline: screen stocks → create GitHub Issues with metrics, thesis → track via GitHub Projects kanban (Screened → Researching → Watchlist → Active → Exited).

22. **PDF Generation MCP** (R2 cycle 4, impact:7, feasibility:8, complexity:low) — studiomeyer-io/mcp-pdf (7 templates, 10 themes, zero deps), xavdp-pro/mcp-document-generator (PDF+DOCX+XLSX). Generate professional investment reports: screening criteria + results table + analysis. Share with team/clients.

23. **GitHub Gists for Preset Sharing** (R2 cycle 7, impact:6, feasibility:8, complexity:medium) — gistpad-mcp (188 stars). Export custom preset configs as Gists → share URLs → others import. Community preset registry pattern.

### Server Architecture Improvements

24. **HTTP/SSE Transport** (R2 cycle 21, impact:8, feasibility:8, complexity:medium) — Add Streamable HTTP transport alongside stdio. Enables: remote deployment, multi-client access, n8n/Make.com/Zapier integration, cloud hosting. ~100 lines code. Keep stdio as primary, HTTP as optional via HTTP_PORT env var.

25. **MCP Prompt Protocol** (R2 cycle 14, impact:8, feasibility:9, complexity:medium) — Add prompts capability to TradingView MCP. Expose workflow prompts as slash commands in Claude Desktop: /quality-screen, /daily-briefing {market}, /due-diligence {symbol}, /sector-rotation. Medium complexity: requires ListPromptsRequestSchema + GetPromptRequestSchema handlers.

### Claude Code Command Library Expansion

26. **Command Library Expansion** (R2 cycle 45, impact:9, feasibility:10, complexity:low) — Add 10+ new commands. Zero server code changes. Priority order: /smart-screen, /due-diligence, /compare-peers, /position-size, /sector-rotation, /investment-thesis, /compare-screens, /macro-dashboard, /portfolio-risk, /rebalance-portfolio. Multiplies server use cases by 5x.

27. **Smart Screen Command** (R2 cycle 44, impact:9, feasibility:9, complexity:low) — /smart-screen: auto-selects strategy based on market regime. Checks VIX + major index drawdowns → picks growth/quality/defensive preset → runs screener. Combines market-regime.md + run-screener.md. Zero server code.

28. **Due Diligence Command** (R2 cycle 25, impact:8, feasibility:10, complexity:low) — /due-diligence {symbol}: structured checklist evaluation (profitability, balance sheet, growth, valuation, technical, analyst consensus). Pass/fail/neutral per criterion with actual values. Zero server code.

29. **Sector Rotation Command** (R2 cycle 24, impact:8, feasibility:9, complexity:medium) — /sector-rotation: screens each GICS sector for performance metrics, ranks by 1M/3M/6M relative performance, overlays economic cycle model. Multiple screen_stocks calls.

30. **Macro Dashboard Command** (R2 cycle 39, impact:8, feasibility:9, complexity:medium) — /macro-dashboard: single lookup_symbols call fetches major indexes, sector ETFs (XLK/XLF/XLE etc.), bonds (TNX/TYX), commodities (GOLD/CL1!), USD index, VIX. Multi-panel dashboard output.

31. **Position Sizing Command** (R2 cycle 28, impact:7, feasibility:9, complexity:low) — /position-size {symbol} {portfolio_value} {risk_pct}: fetches ATR via lookup_symbols, applies risk-based formula. Outputs shares, dollar amount, portfolio weight, stop-loss level.

32. **Portfolio Risk Command** (R2 cycle 40, impact:8, feasibility:9, complexity:medium) — /portfolio-risk: lookup_symbols for all positions → compute portfolio beta, sector concentration, single-stock concentration. Flag risks: >20% sector, >10% single stock, beta > 1.5.

33. **Compare Peers Command** (R2 cycle 29, impact:8, feasibility:10, complexity:low) — /compare-peers {symbols...}: fetches PE, PB, EV/EBITDA, ROE, ROIC, margins, growth, debt for all symbols via single lookup_symbols call. Rich comparison table.

34. **Investment Thesis Command** (R2 cycle 23, impact:8, feasibility:10, complexity:low) — /investment-thesis {symbol}: lookup metrics → check which presets it passes → generate structured Markdown thesis template with real data. Optionally saves to docs/local/.

35. **Compare Screens Command** (R2 cycle 37, impact:7, feasibility:10, complexity:low) — /compare-screens {preset1} {preset2}: runs both → computes overlap, unique picks, aggregate metrics. Shows strategy differences. Zero server code.

36. **Rebalance Portfolio Command** (R2 cycle 15, impact:7, feasibility:9, complexity:medium) — /rebalance-portfolio: current holdings + target allocation by strategy → screen each bucket → identify underperformers → generate rebalancing trades.

37. **Tax Loss Harvest Command** (R2 cycle 16, impact:7, feasibility:8, complexity:medium) — /tax-loss-harvest: input holdings with cost basis → identify positions with losses > threshold → screen for sector/size alternatives. Wash sale rule reminder embedded.

38. **Cross-Market Correlation Command** (R2 cycle 27, impact:7, feasibility:9, complexity:low) — /macro-correlation: fetch equities + bonds (TNX) + gold + USD + oil + crypto performance via lookup_symbols. Risk-on/risk-off signals from cross-asset performance.

39. **Market Sentiment Command** (R2 cycle 20, impact:7, feasibility:9, complexity:low) — Enhance /market-regime with VIX (CBOE:VIX via lookup_symbols) and Fear & Greed (mcp-server-fear-greed MCP). Full regime: ATH drawdowns + VIX + Fear/Greed index.

### Preset Library Expansion

40. **New Presets (6 additions)** (R2 cycle 47, impact:9, feasibility:10, complexity:low) — Add to presets.ts: earnings_momentum (EPS surprise + technical), dividend_aristocrats (25+ years consecutive growth), deep_value (low PB/PE/PS), high_quality_international (Europe/Asia), small_cap_growth (market cap < 2B + high growth), analyst_favorites (Recommend.All > 0.3 + upside to target > 20%).

### Integration Documentation

41. **Multi-MCP Workflow Guide** (R2 cycle 46/50, impact:10, feasibility:10, complexity:low) — Comprehensive claude_desktop_config.json examples for 4 investor archetypes: PASSIVE (TradingView + Google Sheets + Email), ACTIVE (TradingView + Alpha Vantage + IBKR + Slack), SYSTEMATIC (TradingView + QuantConnect + SQLite + GitHub), TEAM (TradingView + Notion + GitHub + Slack + Calendar). Compounds value of all composition findings.

---

## MEDIUM_VALUE Findings

42. **Social Sentiment MCP** (R1, impact:7, feasibility:7, complexity:medium) — Xpoz (Twitter/Reddit/TikTok), ICE Reddit Signals & Sentiment. Useful but adds API key complexity.

43. **Schwab API** (R2 cycle 3, impact:7, feasibility:5, complexity:high) — No Schwab MCP exists yet. Underlying libraries (schwabdev 709 stars) exist. Needs to be built from scratch. IBKR covers professional use case.

44. **Watchlist Management** (R2 ux-dx-r2 cycle 1) — In-memory watchlist CRUD. Session-scoped only (lost on restart). Better served by filesystem MCP.

45. **Screening Diff (in-server)** (R2 ux-dx-r2 cycle 2) — Session-scoped snapshot-and-diff. Run screen → save snapshot → re-run → diff entrants/exits. Limited by session scope.

46. **IPO Calendar via Finnhub** (R2 cycle 19, impact:6, feasibility:7, complexity:medium) — Finnhub MCP servers exist (10+ repos). Finnhub has IPO calendar endpoint. Post-IPO data in TradingView covers most actionable part.

47. **Power BI MCP** (R2 cycle 32, impact:5, feasibility:6, complexity:high) — Microsoft official Power BI MCP (509 stars). Complex pipeline: screening → Power BI dataset → visualization. Better for enterprise with existing PBI infrastructure.

48. **Plugin Architecture** (R2 cycle 35, impact:7, feasibility:7, complexity:high) — Dynamic plugin loading from plugins/ dir. listChanged notifications. Most needs met by presets + commands without full plugin system.

49. **Team Collaboration Patterns** (R2 cycle 33, impact:6, feasibility:7, complexity:medium) — HTTP transport (concurrent access) + shared presets via git + Notion/Airtable team database + Slack broadcasting. Document as 'team investment workflow' guide.

50. **DRIP Analysis Command** (R2 cycle 26, impact:6, feasibility:9, complexity:low) — /drip-analysis: dividend data via lookup_symbols, DRIP projection over years. Dividend aristocrat screen (consecutive growth > 25 years) is the higher-value piece.

51. **Make.com Integration** (R2 cycle 31, impact:6, feasibility:6, complexity:high) — Unofficial Make.com MCP servers. Requires HTTP transport first. n8n is simpler alternative.

52. **MCP Elicitation/Sampling** (R2 cycle 49, impact:7, feasibility:7, complexity:high) — Elicitation enables mid-execution user prompts; Sampling enables server-side LLM analysis. Claude's reasoning handles most of this without server changes.

53. **Linear MCP** (R2 cycle 48, impact:6, feasibility:9, complexity:low) — jerhadf/linear-mcp-server (347 stars). Create Linear issues from screener results. Better for dev-team investors. GitHub/Notion more popular with general investors.

54. **Analyst Data via Finnhub** (R2 cycle 22, impact:6, feasibility:8, complexity:low) — Covered by TradingView fields (Recommend.All, target prices) + Finnhub MCP for historical upgrade/downgrade feed.

55. **Peer Review Workflow** (R2 cycle 41, impact:6, feasibility:8, complexity:medium) — TradingView + GitHub Issues + Slack composition. Process workflow, documented as multi-MCP recipe.

---

## LOW_VALUE / NOT_FEASIBLE Findings

56. **Options Strategy Screening** (R2 cycle 17, impact:5, feasibility:4) — TradingView scanner does NOT support options contracts. Use Alpha Vantage or Yahoo Finance (mcp-optionsflow) MCP instead.

57. **Webhook Inbound Triggers** (R2 cycle 10, impact:6, feasibility:6) — Current stdio architecture doesn't support inbound webhooks. Requires HTTP transport refactor first. n8n with native MCP client is simpler.

58. **Zapier Integration** (R2 cycle 38, impact:5, feasibility:5) — Zapier → TradingView MCP requires HTTP transport + custom code steps. n8n is better choice with native MCP client support.

59. **Permalink/Embed Sharing** (R2 cycle 43, impact:5, feasibility:6) — Solved by CSV export (already in run-screener command) + HTTP transport (cycle 21). Not a standalone feature.

---

## Key Architecture Insight

TradingView MCP is best positioned as the **SCREENING LAYER** in a composed financial research stack:

```
Claude Desktop / Claude Code
  ├── TradingView MCP            (screening, analysis, market regime)
  │
  ├── RESEARCH LAYER
  │   ├── Alpha Vantage MCP      (news, sentiment, earnings transcripts)
  │   ├── Yahoo Finance MCP      (historical data, institutional owners - FREE)
  │   ├── SEC EDGAR MCP          (10-K/10-Q filings, insider transactions)
  │   └── Polygon.io MCP         (real-time quotes, options chains)
  │
  ├── PERSISTENCE LAYER
  │   ├── SQLite MCP             (historical screening snapshots)
  │   ├── Google Sheets MCP      (portfolio tracking spreadsheets)
  │   ├── Notion MCP             (investment CRM database)
  │   └── Airtable MCP           (structured tracking with rich views)
  │
  ├── ACTION LAYER
  │   ├── Alpaca MCP             (commission-free trade execution)
  │   ├── IBKR MCP               (professional execution - stocks/options/futures)
  │   └── QuantConnect MCP       (strategy backtesting)
  │
  ├── COLLABORATION LAYER
  │   ├── Slack MCP              (team alerts, daily digests)
  │   ├── Email MCP              (daily digest automation)
  │   ├── GitHub MCP             (investment idea tracking)
  │   └── Google Calendar MCP    (earnings date tracking)
  │
  └── AUTOMATION LAYER
      └── n8n                    (scheduled screening via MCP Client Tool)
```

## Implementation Priority

**Immediate (zero server code, high impact):**
1. 10+ new Claude Code commands (command library expansion)
2. 6 new preset strategies (preset library expansion)
3. Integration documentation with 4 investor archetype configs

**Short-term (server code changes, high impact):**
4. HTTP/SSE transport for remote deployment and n8n integration
5. MCP Prompt protocol for slash commands in Claude Desktop

**Documentation-only (high impact, no code):**
6. Multi-MCP workflow guide with claude_desktop_config.json examples
7. Investor archetype playbooks (PASSIVE, ACTIVE, SYSTEMATIC, TEAM)
