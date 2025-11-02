---
name: testing-mcp-tools
description: Use when adding new MCP tools, modifying existing tools, or changing the TradingView API client. Ensures tools work correctly, handle errors gracefully, and maintain backward compatibility.
---

# Testing MCP Tools

Use this skill when:
- Adding a new MCP tool (e.g., `screen_bonds`, `get_earnings_calendar`)
- Modifying existing MCP tools (`screen_stocks`, `lookup_symbols`, etc.)
- Changing the TradingView API client that tools depend on
- Fixing bugs in tool parameter validation or response handling

## Why This Skill Exists

MCP tools are the interface between Claude and the TradingView API. Without rigorous testing:
- Tools may silently break when TradingView changes their API
- Invalid parameters may crash the server instead of returning helpful errors
- Response format changes may break downstream clients
- Rate limiting may fail, causing API bans
- Cache may return stale data or fail to invalidate properly

This skill ensures tools are production-ready and resilient.

## Checklist

Create TodoWrite todos for each item:

### 1. Understand the Tool

☐ **Define tool purpose**
   - What investment research task does this tool enable?
   - Who will use it? (investors screening stocks, analyzing markets, etc.)
   - How does it fit into the broader MCP server workflow?

☐ **Review tool parameters**
   - Required vs optional parameters
   - Parameter types (string, number, array, enum)
   - Parameter validation rules (min/max values, allowed values)
   - Default values and their rationale

☐ **Review tool response**
   - Response schema (what fields are returned)
   - Data types and formats
   - Error response structure
   - Edge cases (empty results, invalid symbols, rate limits)

### 2. Write Tool Tests

☐ **Create test file** (or add to existing)
   - Location: `src/tests/{toolname}.test.ts`
   - Import test framework: `import { describe, it } from "node:test"`
   - Import tool class and dependencies

☐ **Test basic functionality**
   ```typescript
   it("should return results with valid parameters", async () => {
     const tool = new ScreenTool();
     const result = await tool.execute({
       filters: [{ field: "market_cap_basic", operator: "greater", value: 1000000000 }],
       limit: 10
     });

     // Assertions
     assert(Array.isArray(result.data), "Result should be an array");
     assert(result.data.length > 0, "Should return at least one result");
     assert(result.data[0].name, "Each result should have a name");
   });
   ```

☐ **Test parameter validation**
   ```typescript
   it("should reject invalid filters", async () => {
     const tool = new ScreenTool();
     await assert.rejects(
       () => tool.execute({ filters: "invalid" }),
       /filters must be an array/
     );
   });

   it("should enforce limit bounds", async () => {
     const tool = new ScreenTool();
     await assert.rejects(
       () => tool.execute({ filters: [], limit: 500 }),
       /limit must be between 1 and 200/
     );
   });
   ```

☐ **Test error handling**
   ```typescript
   it("should handle API errors gracefully", async () => {
     // Mock API failure
     const tool = new ScreenTool();
     const result = await tool.execute({
       filters: [{ field: "invalid_field", operator: "greater", value: 0 }]
     });

     assert(result.error, "Should return error object");
     assert(result.error.includes("TradingView"), "Error should mention source");
   });
   ```

☐ **Test edge cases**
   - Empty results (filters too strict)
   - Invalid symbols (for lookup tools)
   - Network timeouts
   - Rate limit exceeded
   - Malformed TradingView responses

☐ **Test caching behavior** (if applicable)
   ```typescript
   it("should cache results for 5 minutes", async () => {
     const tool = new ScreenTool();

     // First call - hits API
     const result1 = await tool.execute({ filters: [...] });

     // Second call - hits cache (should be instant)
     const start = Date.now();
     const result2 = await tool.execute({ filters: [...] });
     const duration = Date.now() - start;

     assert(duration < 10, "Cached call should be < 10ms");
     assert.deepEqual(result1, result2, "Cached result should match");
   });
   ```

☐ **Test rate limiting** (if applicable)
   ```typescript
   it("should respect rate limits", async () => {
     const tool = new ScreenTool();

     // Make 11 calls (default limit is 10/min)
     const promises = Array(11).fill(null).map(() =>
       tool.execute({ filters: [...] })
     );

     const results = await Promise.allSettled(promises);
     const rejected = results.filter(r => r.status === "rejected");

     assert(rejected.length > 0, "Should reject calls exceeding rate limit");
   });
   ```

### 3. Manual Testing

☐ **Test via Claude Code**
   - Use the tool in a real conversation
   - Verify results are formatted correctly
   - Check error messages are helpful
   - Confirm response times are acceptable

☐ **Test via MCP Inspector** (if available)
   - Call tool directly with various parameters
   - Inspect raw request/response
   - Verify schema matches MCP specification

☐ **Test edge cases manually**
   - What happens with 0 results?
   - What happens with invalid symbols?
   - What happens during market hours vs off-hours?
   - What happens with non-US markets?

### 4. Integration Testing

☐ **Test with real TradingView API**
   - Confirm tool works with live TradingView data
   - Verify field names haven't changed
   - Check response format is as expected
   - Test with multiple markets (america, europe, asia)

☐ **Test with presets** (for screen tools)
   - Run each preset through the tool
   - Verify results align with preset intent
   - Check payload sizes are reasonable
   - Ensure column selections work correctly

☐ **Test with commands** (if applicable)
   - Run `/run-screener` command with new tool
   - Run `/market-regime` command if tool affects it
   - Verify CSV export works correctly
   - Check table formatting in terminal

### 5. Documentation

☐ **Update tool JSDoc comments**
   ```typescript
   /**
    * Screen stocks based on fundamental and technical criteria
    *
    * @param filters - Array of filter conditions (field, operator, value)
    * @param markets - Markets to scan (default: ["america"])
    * @param limit - Number of results (1-200, default: 20)
    * @returns Array of stocks matching criteria
    *
    * @example
    * ```typescript
    * await screenStocks({
    *   filters: [
    *     { field: "return_on_equity", operator: "greater", value: 15 }
    *   ],
    *   limit: 10
    * });
    * ```
    */
   ```

☐ **Update README.md tool documentation**
   - Add tool to "Available Tools" section
   - Document parameters with types and constraints
   - Provide usage examples
   - List common use cases

☐ **Update fields.md** (if new fields added)
   - Add field to appropriate category
   - Document field description and purpose
   - Provide value range and data type
   - Include example usage

### 6. Run All Tests

☐ **Run test suite**
   ```bash
   npm test
   ```
   - All tests must pass (including existing tests)
   - No regressions in other tools
   - Coverage should not decrease

☐ **Run type checking**
   ```bash
   npm run build
   ```
   - No TypeScript errors
   - No type inference warnings
   - Clean build output

☐ **Test in development mode**
   ```bash
   npm run dev
   ```
   - Server starts without errors
   - MCP handshake succeeds
   - Tools are registered correctly
   - Test a few tool calls via Claude

## Test File Structure Pattern

```typescript
import { describe, it } from "node:test";
import assert from "node:assert";
import { ScreenTool } from "../tools/screen.js";

describe("ScreenTool", () => {
  describe("Basic Functionality", () => {
    it("should return results with valid parameters", async () => {
      // Test implementation
    });

    it("should handle empty results gracefully", async () => {
      // Test implementation
    });
  });

  describe("Parameter Validation", () => {
    it("should reject invalid filters", async () => {
      // Test implementation
    });

    it("should enforce limit bounds", async () => {
      // Test implementation
    });
  });

  describe("Error Handling", () => {
    it("should handle API errors gracefully", async () => {
      // Test implementation
    });

    it("should return helpful error messages", async () => {
      // Test implementation
    });
  });

  describe("Caching", () => {
    it("should cache results for 5 minutes", async () => {
      // Test implementation
    });
  });
});
```

## Important Constraints

1. **All tests must be async-friendly**
   - Use `async/await` for API calls
   - Use `assert.rejects` for error testing
   - Avoid timeouts in tests (makes CI unreliable)

2. **Tests must not depend on external state**
   - Mock TradingView API when possible
   - Don't rely on specific stock symbols (may delist)
   - Don't assume specific market conditions

3. **Tests must be fast**
   - Use cache to avoid repeated API calls
   - Mock slow operations
   - Keep test suite under 30 seconds total

4. **Error messages must be helpful**
   - Include parameter name that failed
   - Suggest valid values
   - Reference documentation

## Common Mistakes to Avoid

❌ **Testing only happy path** → Tool breaks on invalid input
❌ **Hardcoding stock symbols** → Tests fail when symbols delist
❌ **Not testing caching** → Cache bugs go unnoticed
❌ **Not testing rate limits** → API bans in production
❌ **Ignoring TypeScript errors** → Runtime errors in production
❌ **Not updating documentation** → Users don't know tool exists

## Verification Before Completion

Before marking this skill complete, confirm:

- [ ] Test file exists in `src/tests/{toolname}.test.ts`
- [ ] Tests cover: basic functionality, validation, errors, edge cases
- [ ] All tests pass (`npm test`)
- [ ] TypeScript compiles cleanly (`npm run build`)
- [ ] Tool documented in README.md with examples
- [ ] Tool tested manually via Claude Code
- [ ] No regressions in existing tools
- [ ] Error messages are clear and actionable

**Only mark as complete when ALL checkboxes are checked.**
