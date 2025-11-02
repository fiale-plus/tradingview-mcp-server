---
name: analyzing-screener-results
description: Use when analyzing stock screening results to help users understand what they're seeing and guide next research steps. Focuses on education and systematic research, not buy recommendations.
---

# Analyzing Screener Results

Use this skill when:
- User runs a screener and asks "what do these results mean?"
- User asks for help interpreting screening results
- User wants to understand why certain stocks appeared in results
- User asks "what should I do next?" after screening

## Why This Skill Exists

Screening results are starting points for research, not buy signals. Without guidance:
- Users may treat results as buy recommendations (dangerous!)
- Users may not understand why stocks appeared in results
- Users may skip essential due diligence steps
- Users may misinterpret metrics (e.g., high P/E = good?)

This skill ensures analysis is educational, systematic, and research-focused.

## Core Principles

**NEVER:**
- ❌ Say "these are good buys" or "you should invest in these"
- ❌ Recommend specific stocks from screening results
- ❌ Predict future stock performance
- ❌ Suggest position sizing or portfolio allocation
- ❌ Provide investment advice or recommendations

**ALWAYS:**
- ✅ Explain why stocks matched the screening criteria
- ✅ Highlight what metrics to research next
- ✅ Suggest systematic due diligence steps
- ✅ Reference investment philosophies and educational resources
- ✅ Emphasize screening is step 1 of many in research

## Checklist

Create TodoWrite todos for each item:

### 1. Understand the Context

☐ **Identify the screening strategy used**
   - Which preset or custom filters?
   - What investment philosophy does it represent? (quality, value, growth, dividend, momentum)
   - What market conditions favor this strategy?

☐ **Review the screening criteria**
   - What filters were applied?
   - What thresholds were used?
   - What sorting was applied?

☐ **Understand user's intent**
   - Are they learning about a strategy?
   - Are they building a watchlist?
   - Are they researching specific sectors or themes?
   - What's their investment timeline? (months, years, decades)

### 2. Explain the Results

☐ **Summarize what the screen found**
   - How many results?
   - What sectors/industries are represented?
   - What's the market cap range?
   - Are results concentrated or diversified?

☐ **Explain why these stocks matched**
   - Walk through key filters and what they mean
   - Example: "These stocks appeared because they have ROE > 15% (strong profitability), low debt (D/E < 0.6), and are in uptrends (SMA50 > SMA200)"
   - Connect filters to investment thesis

☐ **Highlight notable patterns**
   - Sector concentration (e.g., "8 of 10 results are tech companies")
   - Valuation ranges (e.g., "P/E ratios range from 12 to 35")
   - Size bias (e.g., "mostly large-caps over $10B")
   - Geographic focus (e.g., "all US-listed companies")

### 3. Educate on Metrics

☐ **Explain key metrics in results**
   - ROE: "Return on Equity measures how efficiently a company uses shareholder capital"
   - P/E: "Price-to-Earnings ratio shows how much you pay per dollar of earnings"
   - D/E: "Debt-to-Equity ratio indicates financial leverage and risk"
   - Margins: "Higher margins mean better pricing power and efficiency"

☐ **Provide context for values**
   - What's good/bad for this metric in this industry?
   - How do these values compare to market averages?
   - Why might this metric matter for this strategy?

☐ **Highlight metric limitations**
   - "P/E doesn't work for unprofitable companies"
   - "ROE can be artificially inflated by high debt"
   - "Past performance doesn't guarantee future results"

### 4. Guide Next Research Steps

☐ **Systematic due diligence framework**
   1. **Deep dive on fundamentals**
      - Read 10-K annual reports for top 3-5 candidates
      - Study business model and competitive advantages
      - Review earnings transcripts for management quality
      - Analyze cash flow trends (not just earnings)

   2. **Understand the business**
      - What does the company actually do?
      - How do they make money?
      - Who are their competitors?
      - What are their competitive advantages (moat)?

   3. **Assess risks**
      - Industry headwinds or tailwinds?
      - Regulatory risks?
      - Competitive threats?
      - Management quality and capital allocation?

   4. **Valuation analysis**
      - Is the current price reasonable relative to intrinsic value?
      - What's the margin of safety?
      - How does valuation compare to peers and history?

   5. **Build conviction**
      - Why would you hold this through a 30% drawdown?
      - What's your 3-5 year thesis?
      - What would change your mind (sell criteria)?

☐ **Suggest comparison research**
   - "Compare the top 3 stocks side-by-side on key metrics"
   - "Research why Stock A has higher margins than Stock B"
   - "Understand what drives the ROE difference"

☐ **Recommend additional screens**
   - "Try the value_stocks preset to see a different approach"
   - "Screen for competitors in the same sector"
   - "Look at dividend_stocks for income comparison"

### 5. Emphasize Caution and Education

☐ **Reinforce screening limitations**
   - "Screening finds candidates, not buy signals"
   - "Past metrics don't predict future performance"
   - "High ROE doesn't mean a stock will go up"
   - "You're seeing a snapshot - fundamentals change"

☐ **Encourage learning**
   - Reference investment books (Intelligent Investor, One Up on Wall Street, etc.)
   - Suggest learning about this investment approach
   - Link to docs/presets.md for strategy context
   - Recommend studying successful investors who use this strategy

☐ **Remind about research timeline**
   - "This is a multi-week research process, not a quick trade"
   - "Plan to spend 5-10 hours on top candidates before investing"
   - "Build a watchlist and track for 1-3 months to understand volatility"

## Analysis Response Template

```markdown
## Screening Results Summary

**Strategy:** [Quality/Value/Growth/Dividend/Momentum] investing
**Results:** Found X stocks matching criteria
**Key characteristics:** [Sector concentration, size range, valuation range]

## Why These Stocks Matched

These companies appeared because they meet [strategy name]'s criteria:
- **[Filter 1]**: [Explanation of what it means and why it matters]
- **[Filter 2]**: [Explanation]
- **[Filter 3]**: [Explanation]

This means you're looking at companies that are [profitable/undervalued/growing/stable/trending] based on [specific metrics].

## What to Notice

- **[Pattern 1]**: [Explanation of what you see]
- **[Pattern 2]**: [Explanation]
- **[Metric highlight]**: [What stands out and why]

## Next Research Steps

**Immediate (1-2 days):**
1. Read the company descriptions for top 5 results
2. Understand what each business actually does
3. Check recent news for major developments

**Short-term (1-2 weeks):**
1. Read 10-K annual reports for top 3 candidates
2. Study competitive position and business model
3. Analyze 3-year trends in key metrics (revenue, margins, cash flow)

**Before investing:**
1. Build 3-5 year investment thesis for each candidate
2. Determine fair value range and margin of safety
3. Define sell criteria (when would you exit?)
4. Consider position sizing based on conviction and risk tolerance

## Educational Resources

To learn more about [strategy name] investing:
- **Books**: [Relevant investment books]
- **Concepts**: [Key concepts to study]
- **Our docs**: See `docs/presets.md` for detailed strategy explanation

**Remember:** Screening is step 1 of research, not a buy signal. Take time to understand these businesses before investing.
```

## Common Analysis Patterns

### High Result Count (>50 stocks)

"You found X stocks, which is a lot! This suggests:
- The screening criteria are relatively broad
- You have many candidates to research (overwhelming!)
- Consider adding filters to narrow focus

**Suggestion:** Add 2-3 more filters to get to 15-30 stocks, then research systematically."

### Low Result Count (0-3 stocks)

"The screen found very few results. This could mean:
- Filters are too restrictive (rare combinations)
- Market conditions don't favor this strategy right now
- Criteria combination eliminates most candidates

**Suggestion:** Loosen one filter (e.g., ROE >15% → >12%) or try a different preset."

### Sector Concentration

"Notice that 8 of 10 results are [sector] companies. This suggests:
- The screening criteria favor [sector] business models
- [Sector] currently has strong fundamentals for this strategy
- Be aware of concentration risk if you invest in multiple

**Suggestion:** Research why [sector] dominates results. Is it cyclical? Sustainable?"

### Valuation Extremes

"These stocks have [high/low] valuations (P/E range: X-Y):
- [High P/E]: Market expects strong future growth - are expectations realistic?
- [Low P/E]: Market sees risks or low growth - are they fixable?

**Suggestion:** Compare to industry averages and 5-year historical ranges."

## Important Constraints

1. **Never provide investment advice**
   - No "buy this" or "sell that"
   - No price targets or predictions
   - No portfolio allocation suggestions

2. **Always emphasize research process**
   - Screening is step 1, not the final step
   - Due diligence takes time (weeks, not minutes)
   - Understanding the business is essential

3. **Focus on education**
   - Explain metrics and why they matter
   - Reference investment literature
   - Teach systematic research methodology

4. **Acknowledge limitations**
   - Past metrics don't predict future
   - Screening can't capture qualitative factors
   - Markets are unpredictable

## Common Mistakes to Avoid

❌ **Treating results as recommendations** → User thinks these are "good stocks"
❌ **Not explaining metrics** → User doesn't learn what ROE/P/E/D/E mean
❌ **Skipping next steps** → User doesn't know how to research further
❌ **Ignoring limitations** → User overconfident in screening alone
❌ **No educational context** → Missed opportunity to teach investment philosophy

## Verification Before Completion

Before marking analysis complete, confirm:

- [ ] Explained why stocks matched screening criteria
- [ ] Highlighted patterns and notable characteristics
- [ ] Educated on key metrics and their meanings
- [ ] Provided systematic next research steps (not just "read 10-K")
- [ ] Emphasized screening is step 1, not a buy signal
- [ ] Referenced educational resources (books, docs, concepts)
- [ ] Avoided any buy/sell recommendations or predictions
- [ ] Acknowledged limitations and risks

**Only mark as complete when ALL checkboxes are checked.**
