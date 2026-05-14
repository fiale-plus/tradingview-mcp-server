# Researcher: ux-dx

## Assignment
Research UX/DX improvements — better error messages, output formatting, field discovery, onboarding, and developer experience.

## Summary
- **Round 1**: 14 findings (8 HIGH, 5 MEDIUM, 1 LOW)
- **Round 2**: 50 findings (10 HIGH, 25 MEDIUM, 15 LOW)
- **Combined**: 64 total findings (18 HIGH, 30 MEDIUM, 16 LOW)

---

## HIGH_VALUE Findings

### Round 1

1. **Operator enum constraint** (impact:9, feasibility:10, complexity:low) — Tool schema says "greater, less, ... etc." hiding 6 of 12 operators (not_equal, not_in_range, crosses, crosses_above, crosses_below, match). Adding enum prevents AI hallucination. Highest-leverage schema fix.

2. **get_preset missing 2 presets** (impact:8, feasibility:10, complexity:low) — Description hardcodes 5 names, missing quality_growth_screener and market_indexes. Fix with enum or dynamic generation.

3. **list_fields empty for forex/crypto** (impact:7, feasibility:8, complexity:medium) — screen_forex/screen_crypto work but list_fields returns nothing for them. Should provide known-working field subset.

4. **markets parameter no valid values** (impact:7, feasibility:9, complexity:low) — Only shows "america" and "japan". Users hallucinate market names. Need enum or comprehensive list.

5. **list_presets key/name confusion** (impact:7, feasibility:10, complexity:low) — Returns {name: quality_stocks} losing human-readable name. Should return key + display name separately.

6. **sort_by not auto-included in columns** (impact:7, feasibility:10, complexity:low) — Sorted results don't show sort values. One-line fix per screen method.

7. **Error handler lacks classification** (impact:7, feasibility:8, complexity:medium) — Catch-all returns only error.message. Should categorize (validation/rate_limit/api_error/timeout) with recovery suggestions.

8. **Operator hidden documentation** (impact:8, feasibility:10, complexity:low) — crosses/crosses_above/crosses_below/match operators implemented but invisible in schema. No presets use crosses operators despite being the core of golden cross detection.

### Round 2

9. **list_fields no keyword search** (cycle:3, impact:7, feasibility:9, complexity:low) — No search parameter in list_fields. To find "P/E ratio" field name, AI must receive all ~70 fields. Adding search parameter would filter by name/label/description with case-insensitive matching.

10. **Schema examples missing** (cycle:4, impact:8, feasibility:10, complexity:low) — Zero JSON Schema `examples` properties across all 8 tools. Adding examples to filter items (showing RSI in_range, market_cap greater, exchange in_range) would dramatically reduce AI hallucination on first use.

11. **Empty results have no suggestions** (cycle:7, impact:7, feasibility:9, complexity:low) — {total_count: 0, stocks: []} with no guidance. Should include suggestions array: "try widening numeric ranges, removing most restrictive filters, expanding markets."

12. **run_preset shortcut missing** (cycle:9, impact:7, feasibility:9, complexity:medium) — Executing a preset requires 2 tool calls: get_preset then screen_stocks/lookup_symbols. A run_preset tool would handle dispatch internally (symbols→lookupSymbols, filters→screenStocks).

13. **String filtering completely undocumented** (cycle:23, impact:7, feasibility:10, complexity:low) — Filtering by sector (equal 'Technology'), industry, exchange (in_range ['NASDAQ','NYSE']) is never mentioned in any tool description. This is a major use case that's invisible.

14. **crosses operators undocumented** (cycle:26, impact:8, feasibility:10, complexity:low) — crosses/crosses_above/crosses_below operators are implemented and in OPERATOR_MAP but no description, no examples, no presets. Golden cross (SMA50 crosses_above SMA200) is the most famous technical signal and is completely unusable by discovery.

15. **FieldMetadata lacks example values and ranges** (cycle:28, impact:7, feasibility:8, complexity:medium) — RSI has no hint it's 0-100, typical in_range [30,70]. market_cap_basic has no hint values are raw USD (1B=1000000000). AI needs domain knowledge to build correct filter values.

16. **Sector/industry values undocumented** (cycle:35, impact:7, feasibility:8, complexity:medium) — No canonical sector strings documented. TradingView uses "Technology", "Health Technology", "Finance" etc. (GICS-based). AI must guess capitalization. Should add valid_values to FieldMetadata for string fields.

17. **Exchange prefix discovery missing** (cycle:47, impact:8, feasibility:7, complexity:medium) — No way to find that Apple is NASDAQ:AAPL. No search_symbols tool. The match operator could implement this but it's undiscoverable. A thin wrapper tool "search by company name" would be transformative.

18. **OR filter logic not exposed** (cycle:49, impact:8, feasibility:7, complexity:high) — Only AND logic supported across all filters. TradingView API supports filter2 with {operator:AND|OR, operands:[...]}. Cannot screen "oversold by RSI OR oversold by Stochastic" without OR support.

---

## MEDIUM_VALUE Findings

### Round 1

19. **filters should be optional** (impact:6, feasibility:10, complexity:low) — Common browse use cases (top 20 by market cap) forced to pass empty array. Remove from required array and default to [].

20. **JSON whitespace wasting tokens** (impact:5, feasibility:10, complexity:low) — JSON.stringify(result, null, 2) adds ~30% whitespace. Compact JSON or structuredContent per MCP spec reduces token usage.

21. **Rate limiter silent blocking** (impact:6, feasibility:8, complexity:medium) — No logging or notification when rate limited. Tool call just hangs with no explanation.

22. **forex/crypto lack columns parameter** (impact:6, feasibility:9, complexity:low) — screen_stocks/screen_etf have columns parameter, forex/crypto don't. Inconsistent API surface. NOTE: The input type already includes columns but the implementation ignores it (see cycle 48).

23. **Default columns fundamental-biased** (impact:5, feasibility:7, complexity:medium) — Always includes ROE/PE/DE even for technical queries. Could auto-include sort_by and filter fields only.

24. **Filter value description incomplete** (impact:6, feasibility:10, complexity:low) — Misses boolean, string array (exchange in_range), and field-to-field comparison patterns.

### Round 2

25. **Pagination offset not supported** (cycle:1, impact:6, feasibility:9, complexity:low) — range parameter hardcoded to [0, limit]. API supports [offset, limit] for pagination. Can't retrieve results 21-40 from a 5000-match query.

26. **Cache status opaque** (cycle:2, impact:5, feasibility:9, complexity:low) — No indication if response is fresh or cached. Adding _meta.cached, _meta.cache_age_seconds would show data freshness.

27. **Pagination context missing** (cycle:5, impact:6, feasibility:9, complexity:low) — total_count returned but no returned_count, has_more, or offset. AI doesn't know result set was truncated.

28. **Raw number formatting** (cycle:6, impact:5, feasibility:7, complexity:medium) — 1200000000 instead of "1.2B". Trade-off with numeric comparability. Optional format_numbers parameter recommended.

29. **Symbol format validation missing** (cycle:8, impact:6, feasibility:9, complexity:low) — lookup_symbols accepts 'AAPL' without EXCHANGE: prefix. API silently returns empty. Should validate pattern and suggest NASDAQ:AAPL, NYSE:X formats.

30. **structuredContent/outputSchema not used** (cycle:10, impact:6, feasibility:7, complexity:medium) — MCP SDK supports structuredContent for structured data and outputSchema for type-safe clients. Neither used. Would improve MCP client integrations.

31. **Workflow guidance missing from descriptions** (cycle:11, impact:6, feasibility:10, complexity:low) — screen_stocks field description only shows fundamental examples. No mention of RSI, SMA50, Perf.1M syntax in technical screening context.

32. **get_preset error lacks valid preset list** (cycle:13, impact:6, feasibility:10, complexity:low) — {error: "Preset not found"} with no list of valid presets. AI must call list_presets to recover.

33. **Tool descriptions lack next-step hints** (cycle:14, impact:5, feasibility:10, complexity:low) — list_presets doesn't say "use get_preset with a key". get_preset doesn't say "pass filters to screen_stocks". Missing workflow composition guidance.

34. **Filter field soft validation missing** (cycle:17, impact:6, feasibility:7, complexity:medium) — Typo "price_earning_ttm" passes through silently. Should warn when filter field not in known fields list.

35. **Column token cost undocumented** (cycle:19, impact:5, feasibility:10, complexity:low) — Extended columns (35 fields) produces 5x more tokens than default (7 fields). No guidance on balancing completeness vs context window cost.

36. **Integration test gap** (cycle:20, impact:5, feasibility:7, complexity:medium) — Tests use mocked client, never verify actual API endpoints. Integration smoke tests (INTEGRATION_TEST=1) would catch API changes.

37. **forex/crypto field examples too sparse** (cycle:21, impact:5, feasibility:9, complexity:low) — screen_forex shows only 4 field examples, screen_crypto only 4. Should include RSI, SMA50, ADX, ATR, performance fields.

38. **Symbol format undocumented in workflow** (cycle:24, impact:5, feasibility:10, complexity:low) — Response symbols are EXCHANGE:TICKER format usable in lookup_symbols. This powerful chaining workflow is implicit, not documented.

39. **Named column sets inaccessible** (cycle:29, impact:5, feasibility:8, complexity:low) — DEFAULT_COLUMNS and EXTENDED_COLUMNS are code-only. Users can't request "extended columns" by name. Add column_preset parameter or expose via list_fields.

40. **in_range dual semantics** (cycle:31, impact:6, feasibility:10, complexity:low) — in_range is used for both numeric range [30,70] AND string set membership ['NASDAQ','NYSE']. Nothing in description disambiguates the two usage patterns.

41. **list_presets too minimal** (cycle:32, impact:6, feasibility:10, complexity:low) — Returns only key and description. Missing type (screening vs symbol-lookup), filter_count, markets, sort_by. AI can't distinguish market_indexes from filter presets without calling get_preset.

42. **Dead CompareStocksInput type** (cycle:36, impact:5, feasibility:8, complexity:medium) — CompareStocksInput type defined in types.ts but no compare_stocks tool exists. Clean up dead type or implement as lookup_symbols wrapper.

43. **EXTENDED_COLUMNS invisible to tools** (cycle:40, impact:5, feasibility:8, complexity:low) — 35-field extended column set is used by quality_growth_screener but not accessible by name through any tool. Expose in list_fields as named_sets.

44. **No runtime input validation** (cycle:41, impact:5, feasibility:8, complexity:medium) — All handlers use 'args as any'. No zod validation means invalid argument shapes reach business logic silently.

45. **API timeout not configurable** (cycle:43, impact:5, feasibility:8, complexity:low) — Hardcoded 10s timeout. Should be configurable via API_TIMEOUT_SECONDS env var. Timeout error needs retry suggestion.

46. **No batch screening** (cycle:44, impact:6, feasibility:7, complexity:high) — Multi-strategy comparison requires sequential tool calls. batch_screen would run multiple filter sets concurrently (up to rate limit) and return labeled result sets.

47. **screen_forex default columns miss sort basis** (cycle:46, impact:5, feasibility:9, complexity:low) — Default sort is 'volume' but volume not in default columns. Sort basis invisible in results. Also: no columns parameter (round 1).

48. **screen_crypto/forex ignore columns parameter** (cycle:48, impact:6, feasibility:9, complexity:low) — The Omit<ScreenStocksInput,'markets'> type includes columns but implementation destructures and ignores it. One-line fix: add inputColumns destructuring and use it.

49. **MCP Tool annotations not set** (cycle:50, impact:6, feasibility:10, complexity:low) — readOnlyHint, destructiveHint, idempotentHint, openWorldHint supported by SDK but unused. All tools are read-only and idempotent. Setting these allows MCP clients to safely auto-invoke tools without user confirmation prompts.

---

## LOW_VALUE Findings

### Round 1

50. **MCP title field missing** (impact:4, feasibility:10, complexity:low) — Nice polish, low impact since AI uses name field.

### Round 2

51. **No dry-run mode** (cycle:12, impact:5, feasibility:8, complexity:low) — validateAndConvertFilters is private and unexposed. Low value: API calls are cheap and errors already surface clearly.

52. **Null values lack context** (cycle:15, impact:4, feasibility:7, complexity:medium) — Null fields pass through without explanation. Claude handles nulls well; low value improvement.

53. **No rate_limit_status tool** (cycle:16, impact:4, feasibility:9, complexity:low) — RateLimiter has no public status method. Default 10 RPM is generous; rate limits are rarely hit.

54. **MCP resources undiscoverable** (cycle:18, impact:4, feasibility:8, complexity:low) — preset:// resources functional but not mentioned in tool descriptions. Resources duplicate get_preset tool.

55. **Schema minItems/maxItems missing** (cycle:22, impact:4, feasibility:10, complexity:low) — lookup_symbols symbols array has no schema-level bounds, only runtime checks. Works fine as-is.

56. **Progress notifications not implemented** (cycle:25, impact:4, feasibility:6, complexity:high) — MCP spec supports notifications/progress but rate limit waits are brief; high complexity for low value.

57. **Cache key order-sensitive** (cycle:27, impact:3, feasibility:8, complexity:low) — Column/filter array order produces different cache keys for semantic duplicates. AI is generally consistent in ordering.

58. **sort_by invalid value passes silently** (cycle:30, impact:4, feasibility:8, complexity:low) — No validation of sort_by field name. API handles gracefully by defaulting.

59. **Missing regression tests** (cycle:33, impact:4, feasibility:8, complexity:medium) — No tests for empty filters, sort_by auto-include, or field typo warnings. Should add when implementing those fixes.

60. **name vs symbol undocumented** (cycle:34, impact:4, feasibility:10, complexity:low) — 'name' column (company name string) vs 'symbol' field (EXCHANGE:TICKER) distinction not explained.

61. **screen_etf hidden type filter** (cycle:37, impact:3, feasibility:9, complexity:low) — Implicit type:fund filter appended without documentation. Could deduplicate if user passes same filter manually.

62. **No server_info tool** (cycle:38, impact:3, feasibility:9, complexity:low) — Server version not exposed via tools. MCP handshake exposes it anyway.

63. **Context-aware defaults undocumented** (cycle:39, impact:4, feasibility:9, complexity:low) — screen_forex sort_by:'volume' default has no semantic explanation for forex-specific meaning.

64. **Limit guidance missing** (cycle:42, impact:4, feasibility:10, complexity:low) — No recommendation for appropriate limit values (5-10 for targeted, 20-50 for scans, 100-200 for broad research).

65. **Truncation not mentioned in description** (cycle:45, impact:4, feasibility:10, complexity:low) — "Returns stocks matching" doesn't say "up to limit, see total_count for full match count."

---

## Quick Wins (implement in <30 min each)

### From Round 1 (unchanged)
- Operator enum constraint (add enum to operator field)
- get_preset preset list update (add enum from PRESETS keys)
- sort_by auto-include (one-line per screen method)
- list_presets key/name fix (return key separately from name)
- markets valid values (add to description or enum)
- Make filters optional (remove from required array)

### New from Round 2
- Schema examples for filter items (add examples property)
- crosses operator documentation (update operator description with usage guidance)
- Empty results suggestions (add suggestions field when total_count === 0)
- String filtering documentation (update value description with string patterns)
- get_preset error improvement (include valid preset list in error)
- Workflow composition hints (add "next step" sentences to descriptions)
- in_range dual semantics clarification (update operator description)
- list_presets enrichment (add type, filter_count, markets fields)
- MCP tool annotations (add readOnlyHint:true to all tools)
- screen_crypto/forex columns fix (destructure and use inputColumns)
- Sector valid_values in FieldMetadata (add known sector strings)

## High-Impact Architecture Improvements

1. **OR filter logic** (cycle:49) — Expose TradingView's filter2 parameter for AND/OR compositions
2. **run_preset shortcut** (cycle:9) — Eliminate mandatory 2-step preset execution
3. **search_symbols/find_ticker** (cycle:47) — Exchange prefix discovery via match operator wrapper
4. **FieldMetadata example values** (cycle:28) — Add typical_range, example_filter, notes to each field
5. **list_fields keyword search** (cycle:3) — Filter fields by name/label/description

## Remaining Opportunities (not yet researched)
- Changelog/versioning awareness in tool descriptions
- Debug mode with verbose request/response logging
- Percentage formatting consistency across field types
- Tool dependency documentation (explicit workflow chains)
