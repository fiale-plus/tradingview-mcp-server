---
name: adding-new-preset
description: Use when adding a new preset screening strategy to the MCP server. Ensures presets follow established patterns, include proper documentation, and are tested.
---

# Adding New Preset Strategy

Use this skill when adding a new preset screening strategy (e.g., "small_cap_stocks", "dividend_aristocrats", "turnaround_candidates") to the TradingView MCP server.

## Why This Skill Exists

Presets are core educational tools that codify proven investment strategies. Without discipline:
- Filters may be too loose (returns thousands) or too strict (returns zero)
- Documentation may omit use cases or educational context
- Tests may be missing, breaking the preset silently
- Column choices may bloat payloads or omit critical metrics

This skill ensures new presets are production-ready and educational.

## Checklist

Create TodoWrite todos for each item:

### 1. Research & Design

☐ **Define the investment philosophy**
   - What investment approach does this preset teach? (value, growth, quality, income, momentum, special situations)
   - Who is the target user? (conservative investor, income seeker, growth hunter, etc.)
   - What market conditions favor this strategy?

☐ **Research filter criteria**
   - Review investment literature for this strategy (Graham, Lynch, Buffett, O'Shaughnessy, etc.)
   - List essential metrics (ROE, P/E, debt ratios, technical indicators)
   - Define reasonable thresholds based on market norms and strategy goals
   - Document why each filter matters for this strategy

☐ **Review available fields**
   - Use `docs/fields.md` to confirm all needed fields are available
   - Check field variants (TTM vs FQ vs FY) - use most appropriate for strategy
   - Identify if new fields need to be added to the server first

### 2. Implementation

☐ **Add preset to `src/resources/presets.ts`**
   - Follow existing preset structure exactly
   - Include descriptive `name` and `description`
   - For filter-based presets:
     - Add `filters` array with field, operator, value
     - Specify `markets` (default: `["america"]`)
     - Define `sort_by` and `sort_order`
     - Choose column set: default (7 fields) or extended (35 fields)
   - For symbol-based presets (like market indexes):
     - Add `symbols` array with exact ticker symbols
     - Specify custom `columns` for analysis needs

☐ **Choose appropriate columns**
   - Default (7 fields): Use for quick screening, low payload
   - Extended (35 fields): Use when deep fundamental analysis is essential
   - Custom: Define specific columns if neither default nor extended fits
   - Document rationale in preset description

☐ **Test filter balance**
   - Too strict: Returns 0-2 results → loosen most restrictive filter
   - Too loose: Returns >100 results → tighten key differentiators
   - Ideal: Returns 10-50 results for educational exploration
   - Run manual screen via Claude to verify results make sense

### 3. Documentation

☐ **Add preset section to `docs/presets.md`**
   - Follow existing preset documentation format exactly
   - Include sections:
     - **Preset ID** - The code identifier
     - **Description** - One-sentence strategy summary
     - **Criteria** - Table of all filters with categories and values
     - **Configuration** - JavaScript object showing markets, sort, columns
     - **Returns** - Column set used (default/extended/custom)
     - **Best For** - 4+ learning use cases with educational context
     - **Typical Results** - Expected result count and characteristics

☐ **Write educational content**
   - Explain what this strategy teaches investors
   - Reference investment legends who used this approach
   - Describe market conditions that favor/disfavor this strategy
   - Provide research next steps (what to analyze in results)

### 4. Testing

☐ **Add test case to `src/tests/presets.test.ts`**
   - Test that preset exists and has expected structure
   - Verify required fields (name, description, filters OR symbols)
   - Confirm markets array is valid
   - Check sort_by field is a valid field name
   - For filter-based: Validate each filter has field, operator, value
   - For symbol-based: Verify symbols array is not empty

☐ **Run all tests**
   ```bash
   npm test
   ```
   - Fix any breaking changes to existing presets
   - Ensure new test passes

☐ **Manual validation**
   - Run the preset via Claude Code or Claude Desktop
   - Check result quality: Do results align with strategy intent?
   - Verify payload size: Is it appropriate for use case?
   - Test edge cases: What if TradingView changes fields?

### 5. Integration

☐ **Update command wizard (if applicable)**
   - If preset should appear in `/run-screener` command
   - Add to appropriate question in `.claude/commands/run-screener.md`
   - Choose: "common strategies" (question 1) or "advanced strategies" (question 2)
   - Update mapping logic to include new preset name

☐ **Update documentation index**
   - Ensure preset appears in `docs/presets.md` table of contents
   - Add to overview table if one exists
   - Update README.md preset count if mentioned

☐ **Build and verify**
   ```bash
   npm run build
   npm test
   ```

## Important Constraints

1. **Filter balance** - Preset must return results for educational value
   - 0 results = too strict, defeats learning purpose
   - 1000+ results = too loose, overwhelming for research
   - Sweet spot: 10-50 results for exploration

2. **Column efficiency**
   - Default (7) for most presets - fast, lean payload
   - Extended (35) only when deep analysis is essential
   - Custom when specific metrics matter (e.g., dividend presets need yield columns)

3. **Educational value** - Every preset must teach an investment approach
   - Not just random filters
   - Must represent a real investment philosophy
   - Should reference investment literature or practitioners

4. **Testability** - All presets must have tests
   - Prevents silent breakage
   - Ensures consistent structure
   - Validates filter logic

## Common Mistakes to Avoid

❌ **Adding preset without testing** → Breaks silently when TradingView changes fields
❌ **Too many filters** → Returns zero results, useless for learning
❌ **Random filter combinations** → Doesn't teach coherent investment strategy
❌ **Missing documentation** → Users don't understand when/why to use preset
❌ **Wrong column set** → Extended columns for simple preset bloats payload
❌ **No educational context** → Preset becomes just another filter, not a learning tool

## Example Preset Pattern

```typescript
dividend_aristocrats: {
  name: "Dividend Aristocrats",
  description: "Companies with 25+ years of consecutive dividend increases - ultimate dividend reliability",
  filters: [
    { field: "dividend_yield_recent", operator: "greater", value: 2 },
    { field: "market_cap_basic", operator: "greater", value: 10000000000 }, // $10B+
    { field: "debt_to_equity", operator: "less", value: 0.8 },
    { field: "return_on_equity", operator: "greater", value: 12 },
    // Manual research needed: 25+ years dividend growth (not in API)
  ],
  markets: ["america"],
  sort_by: "dividend_yield_recent",
  sort_order: "desc",
  // Use default columns (7 fields) - simple income screening
}
```

## Verification Before Completion

Before marking this skill complete, confirm:

- [ ] Preset exists in `src/resources/presets.ts`
- [ ] Documentation added to `docs/presets.md` with full educational context
- [ ] Test case added to `src/tests/presets.test.ts`
- [ ] All tests pass (`npm test`)
- [ ] Manual validation shows appropriate results (10-50 stocks)
- [ ] Build succeeds (`npm run build`)
- [ ] Preset teaches a coherent investment philosophy
- [ ] Column choice is justified and efficient

**Only mark as complete when ALL checkboxes are checked.**
