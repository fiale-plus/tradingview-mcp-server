# TradingView MCP Server - Project Skills

Project-specific skills for developing and using the TradingView MCP Server. These skills codify best practices, ensure quality, and guide systematic workflows specific to this codebase.

## What Are Skills?

Skills are process documentation that Claude Code follows to ensure consistency, quality, and best practices when working on this project. Think of them as checklists + context + constraints for common workflows.

**Skills are mandatory** - If a skill exists for your task, you must use it.

## Available Skills

### 1. Adding New Preset (`adding-new-preset.md`)

**Use when:** Adding a new preset screening strategy (e.g., "small_cap_value", "dividend_aristocrats", "turnaround_stocks") to the MCP server.

**What it ensures:**
- Presets codify real investment philosophies (not random filters)
- Filter balance (returns 10-50 results, not 0 or 1000+)
- Proper documentation with educational context
- Complete test coverage
- Appropriate column selection (default vs extended)

**Prevents:**
- ❌ Presets that return zero results (too strict)
- ❌ Presets without tests (silent breakage)
- ❌ Random filter combinations (no coherent strategy)
- ❌ Missing educational context (users don't learn)

**Key workflow:**
1. Research investment philosophy → 2. Implement in `presets.ts` → 3. Document in `docs/presets.md` → 4. Add test to `presets.test.ts` → 5. Validate results → 6. Verify build

---

### 2. Testing MCP Tools (`testing-mcp-tools.md`)

**Use when:** Adding new MCP tools, modifying existing tools, or changing the TradingView API client.

**What it ensures:**
- Comprehensive test coverage (happy path, errors, edge cases)
- Parameter validation and helpful error messages
- Caching and rate limiting work correctly
- Tools handle TradingView API changes gracefully
- Documentation matches implementation

**Prevents:**
- ❌ Tools breaking silently when TradingView changes API
- ❌ Invalid parameters causing crashes
- ❌ Cache bugs returning stale data
- ❌ Rate limit failures causing API bans

**Key workflow:**
1. Understand tool purpose → 2. Write test file → 3. Test basic functionality → 4. Test validation & errors → 5. Manual testing via Claude → 6. Update docs → 7. Run full test suite

---

### 3. Analyzing Screener Results (`analyzing-screener-results.md`)

**Use when:** User asks for help understanding screening results or "what should I do next?"

**What it ensures:**
- Analysis is educational, not prescriptive
- Users understand why stocks appeared in results
- Systematic research steps are provided
- Limitations and risks are acknowledged
- No buy/sell recommendations (investment advice)

**Prevents:**
- ❌ Treating results as buy recommendations
- ❌ Users skipping due diligence
- ❌ Misunderstanding metrics (e.g., high P/E = good?)
- ❌ Overconfidence from screening alone

**Key workflow:**
1. Understand context & strategy → 2. Explain why stocks matched → 3. Educate on metrics → 4. Guide next research steps → 5. Emphasize screening is step 1 → 6. Reference educational resources

---

## How to Use Skills

### Discovery

Before starting any task, check if a skill applies:

```bash
# List all skills
ls .claude/skills/

# Read a skill
cat .claude/skills/adding-new-preset.md
```

If a skill matches your task (even 1% chance), you MUST use it.

### Execution

1. **Read the skill** - Use the Skill tool or read the markdown file
2. **Create TodoWrite todos** - Each checklist item becomes a todo
3. **Follow the checklist** - Work through todos systematically
4. **Verify completion** - Check all verification criteria before marking done

### Example: Adding a New Preset

```
User: "Add a 'small_cap_growth' preset for fast-growing small companies"

Claude: I'm using the adding-new-preset skill to ensure this preset follows best practices.

*Creates TodoWrite todos for:*
1. Research small-cap growth investment philosophy
2. Define filter criteria (market cap < $2B, revenue growth > 20%, etc.)
3. Add preset to src/resources/presets.ts
4. Document in docs/presets.md with educational context
5. Add test to src/tests/presets.test.ts
6. Validate results (should return 10-50 stocks)
7. Run build and tests

*Follows checklist systematically, marking each todo complete as work progresses*
```

## Skill Development Principles

These skills follow core design principles:

1. **Checklists prevent shortcuts**
   - TodoWrite todos for each checklist item
   - Can't skip steps "to save time"
   - Verification before completion

2. **Context prevents confusion**
   - "Why this skill exists" explains the problem it solves
   - Common mistakes section shows what to avoid
   - Examples demonstrate expected patterns

3. **Constraints prevent errors**
   - "Important Constraints" section defines boundaries
   - "Never/Always" rules for critical decisions
   - Verification criteria ensure quality

4. **Education over automation**
   - Skills teach WHY, not just WHAT
   - Reference investment literature and philosophies
   - Focus on learning and understanding

## When to Create New Skills

Create a new skill when you notice:

1. **Repetitive workflows** that could be formalized
2. **Quality issues** from skipping steps or shortcuts
3. **Educational opportunities** where guidance would help
4. **Complex processes** with many dependencies

**Don't create skills for:**
- One-off tasks (e.g., "fix typo in README")
- Trivial operations (e.g., "run npm install")
- Purely mechanical tasks with no decision points

## Skill File Format

```markdown
---
name: skill-name
description: One-line description of when to use this skill
---

# Skill Title

Use this skill when [specific triggering conditions]

## Why This Skill Exists

[Explanation of what goes wrong without this skill]

## Checklist

Create TodoWrite todos for each item:

### 1. Section Name

☐ **Checklist item**
   - Sub-point with context
   - Example or explanation
   - Why this matters

### 2. Another Section

☐ **Another checklist item**
   - Details

## Important Constraints

1. **Constraint name** - Explanation
2. **Another constraint** - Why it matters

## Common Mistakes to Avoid

❌ **Mistake** → Consequence
❌ **Another mistake** → Why it's bad

## Verification Before Completion

Before marking this skill complete, confirm:

- [ ] Verification criterion 1
- [ ] Verification criterion 2

**Only mark as complete when ALL checkboxes are checked.**
```

## Project-Specific Context

### Investment Research Focus

This MCP server is designed for **research-driven investment discovery**, not day trading. Skills should:
- Emphasize education and learning investment approaches
- Guide systematic research (not quick trades)
- Reference proven investment philosophies (Graham, Lynch, Buffett)
- Acknowledge screening as step 1 of multi-week research process

### Quality Over Speed

Skills prioritize quality and education:
- Presets must teach coherent investment strategies
- Tests must cover edge cases and errors
- Analysis must guide research, not provide recommendations
- Documentation must explain WHY, not just WHAT

### Respect for Users

This tool helps curious investors explore strategies:
- Never provide investment advice or recommendations
- Always emphasize due diligence and research
- Acknowledge risks and limitations
- Reference educational resources

## Contributing Skills

If you develop a new skill that could benefit others:

1. Follow the skill file format above
2. Test the skill with real workflows
3. Get feedback from other developers
4. Consider contributing via PR to the upstream repository

See the [superpowers:sharing-skills](https://github.com/anthropics/claude-code-superpowers) skill for guidance on contributing skills upstream.

## See Also

- **[Development Guide](../../docs/development.md)** - Local setup, testing, extending the server
- **[Preset Strategies](../../docs/presets.md)** - All preset strategies with educational context
- **[Field Reference](../../docs/fields.md)** - Complete field documentation
- **[Commands README](../commands/README.md)** - Custom slash commands documentation

---

**Systematic workflows, not shortcuts.**
