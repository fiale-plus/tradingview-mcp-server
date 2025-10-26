# Development Guide

Complete guide for developing, testing, and extending the TradingView MCP Server locally.

## Table of Contents

- [Local Setup](#local-setup)
- [Using Local MCP Server with Claude](#using-local-mcp-server-with-claude)
  - [Option 1: Project-Level MCP](#option-1-project-level-mcp-recommended-for-development)
  - [Option 2: Claude Desktop Global Config](#option-2-claude-desktop-global-config)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [Adding New Features](#adding-new-features)
  - [Adding New Fields](#adding-new-fields)
  - [Creating New Presets](#creating-new-presets)
  - [Adding New Tools](#adding-new-tools)
- [Environment Variables](#environment-variables)
- [Debugging](#debugging)

---

## Local Setup

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Git

### Clone and Install

```bash
# Clone the repository
git clone https://github.com/fiale-plus/tradingview-mcp-server.git
cd tradingview-mcp-server

# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Watch tests (development mode)
npm run test:watch
```

### Build Outputs

After `npm run build`, compiled files are in `/dist`:

```
dist/
├── index.js           # Main entry point
├── api/               # TradingView API client
├── tools/             # MCP tools (screen, fields)
├── resources/         # Preset configurations
└── utils/             # Cache, rate limiting
```

---

## Using Local MCP Server with Claude

To test your local development build with Claude Desktop or Claude Code, you have two options.

### Option 1: Project-Level MCP (Recommended for Development)

Project-level MCP servers are isolated to specific directories and won't affect your global Claude configuration.

#### Setup

1. **Create `.mcp.json` in your project root:**

```json
{
  "mcpServers": {
    "tradingview-local": {
      "command": "node",
      "args": ["/absolute/path/to/tradingview-mcp-server/dist/index.js"],
      "env": {
        "CACHE_TTL_SECONDS": "300",
        "RATE_LIMIT_RPM": "10"
      }
    }
  }
}
```

**Important:** Replace `/absolute/path/to/tradingview-mcp-server` with your actual repository path.

2. **Enable in `.claude/settings.local.json`:**

```json
{
  "enableAllProjectMcpServers": true
}
```

3. **Restart Claude Code** to load the MCP server

#### Advantages

- ✅ Isolated from global config
- ✅ Project-specific settings
- ✅ Easy to switch between versions
- ✅ No impact on other projects

---

### Option 2: Claude Desktop Global Config

Global configuration makes the MCP server available in all Claude Desktop sessions.

#### Setup

1. **Locate your Claude Desktop config file:**

   - **Mac:** `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
   - **Linux:** `~/.config/Claude/claude_desktop_config.json`

2. **Add the local MCP server:**

```json
{
  "mcpServers": {
    "tradingview-local": {
      "command": "node",
      "args": ["/absolute/path/to/tradingview-mcp-server/dist/index.js"],
      "env": {
        "CACHE_TTL_SECONDS": "300",
        "RATE_LIMIT_RPM": "10"
      }
    }
  }
}
```

3. **Restart Claude Desktop**

#### Advantages

- ✅ Available in all Claude Desktop sessions
- ✅ Easier for testing across multiple projects

#### Disadvantages

- ⚠️ Affects global Claude configuration
- ⚠️ May conflict with published npm version

---

## Development Workflow

### Standard Development Cycle

1. **Make changes** to source files in `src/`

   ```bash
   # Edit files in src/
   vim src/tools/fields.ts
   ```

2. **Build** the project

   ```bash
   npm run build
   ```

3. **Restart Claude** (Desktop or Code) to load new build

   - The MCP server runs as a separate process
   - Changes require a restart to take effect
   - No hot-reload available

4. **Test** via Claude's MCP integration

   ```
   List all available fields for stock screening
   ```

5. **Iterate** - repeat steps 1-4 as needed

### Quick Build + Restart

```bash
# Build and signal to restart
npm run build && echo "✓ Build complete - restart Claude to load changes"
```

---

## Testing

### Run Tests

```bash
# Run all tests once
npm test

# Watch mode (re-runs on file changes)
npm run test:watch

# Run specific test file
npm test -- fields.test.ts

# Run with coverage
npm test -- --coverage
```

### Test Structure

```
src/
├── tools/
│   ├── fields.ts
│   └── fields.test.ts       # Field tests
├── api/
│   ├── client.ts
│   └── client.test.ts       # API client tests
└── utils/
    ├── cache.ts
    └── cache.test.ts        # Cache tests
```

### Writing Tests

Example test for a new field:

```typescript
import { FieldsTool } from './fields';

describe('FieldsTool', () => {
  it('should include new comprehensive fields', () => {
    const tool = new FieldsTool();
    const fields = tool.listFields({ asset_type: 'stock' });

    expect(fields.some(f => f.name === 'enterprise_value_current')).toBe(true);
    expect(fields.some(f => f.name === 'gross_margin_ttm')).toBe(true);
  });
});
```

---

## Project Structure

```
tradingview-mcp-server/
├── src/                          # Source code
│   ├── index.ts                  # Main entry point & MCP server setup
│   ├── api/                      # TradingView API integration
│   │   ├── client.ts             # API client
│   │   └── types.ts              # Type definitions
│   ├── tools/                    # MCP tools
│   │   ├── screen.ts             # Stock screening tool
│   │   └── fields.ts             # Field listing tool
│   ├── resources/                # MCP resources
│   │   └── presets.ts            # Preset configurations
│   └── utils/                    # Utilities
│       ├── cache.ts              # Response caching
│       └── rateLimit.ts          # Rate limiting
├── docs/                         # Documentation
│   ├── presets.md                # Preset strategies guide
│   ├── fields.md                 # Field reference
│   └── local/                    # Development docs
│       ├── MCP_SERVER_DESIGN.md  # Architecture
│       └── SCREENER_FILTERS_GUIDE.md
├── dist/                         # Compiled output (gitignored)
├── package.json
├── tsconfig.json
└── README.md
```

---

## Adding New Features

### Adding New Fields

Fields are defined in `src/tools/fields.ts`.

**Step 1: Find the TradingView field name**

1. Open TradingView screener in browser
2. Open DevTools → Network tab
3. Add your field to the screener
4. Find the `/scan` request
5. Check the `columns` array for the field name

**Step 2: Add to fields.ts**

```typescript
// src/tools/fields.ts

const STOCK_FIELDS: FieldMetadata[] = [
  // ... existing fields

  {
    name: "quick_ratio",                    // TradingView field name
    label: "Quick Ratio",                   // Display name
    category: "fundamental",                // fundamental | technical | performance
    type: "number",                         // number | percent | currency | string | boolean
    description: "Current assets minus inventory divided by current liabilities"
  },
];
```

**Step 3: Add to EXTENDED_COLUMNS (if applicable)**

If the field should be included in comprehensive presets:

```typescript
// src/tools/screen.ts

export const EXTENDED_COLUMNS = [
  ...DEFAULT_COLUMNS,
  // ... existing fields
  "quick_ratio",  // Add your field
];
```

**Step 4: Test**

```bash
npm run build
# Restart Claude
# Test: "List all available fields"
# Test: "Screen stocks with quick ratio > 1.5"
```

---

### Creating New Presets

Presets are defined in `src/resources/presets.ts`.

**Example: Creating a "Tech Growth" preset**

```typescript
// src/resources/presets.ts

export const PRESETS: Record<string, Preset> = {
  // ... existing presets

  tech_growth: {
    name: "Tech Growth Stocks",
    description: "High-growth technology stocks with strong margins and R&D investment",
    filters: [
      // Size and liquidity
      { field: "market_cap_basic", operator: "greater", value: 5000000000 },
      { field: "average_volume_90d_calc", operator: "greater", value: 500000 },

      // Growth
      { field: "total_revenue_yoy_growth_ttm", operator: "greater", value: 15 },
      { field: "return_on_equity", operator: "greater", value: 18 },

      // Margins (tech typically has high gross margins)
      { field: "gross_margin_ttm", operator: "greater", value: 60 },
      { field: "operating_margin_ttm", operator: "greater", value: 15 },

      // R&D intensity (innovation)
      { field: "research_and_dev_ratio_ttm", operator: "greater", value: 10 },

      // Sector filter
      { field: "sector", operator: "match", value: "Electronic Technology|Technology Services" },
    ],
    markets: ["america"],
    sort_by: "total_revenue_yoy_growth_ttm",
    sort_order: "desc",
    columns: EXTENDED_COLUMNS,  // Use extended columns for deep analysis
  },
};
```

**Best Practices:**

- ✅ Use descriptive names and descriptions
- ✅ Balance filter count (3-16 filters optimal)
- ✅ Choose appropriate sort field
- ✅ Consider if extended columns are needed
- ✅ Test on real data to validate results
- ✅ Document typical result count

---

### Adding New Tools

Tools are MCP endpoints that Claude can call.

**Step 1: Create tool implementation**

```typescript
// src/tools/compare.ts

export class CompareTool {
  constructor(private client: TradingViewClient) {}

  async compareStocks(symbols: string[], fields: string[]): Promise<any> {
    // Implementation
    const results = await Promise.all(
      symbols.map(symbol => this.client.getStockData(symbol, fields))
    );

    return {
      comparison: results,
      symbols,
      fields
    };
  }
}
```

**Step 2: Register in index.ts**

```typescript
// src/index.ts

// Import
import { CompareTool } from "./tools/compare.js";

// Initialize
const compareTool = new CompareTool(client);

// Register tool
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // ... existing tools
      {
        name: "compare_stocks",
        description: "Compare multiple stocks across specified fields",
        inputSchema: {
          type: "object",
          properties: {
            symbols: {
              type: "array",
              items: { type: "string" },
              description: "Stock symbols to compare (e.g., ['AAPL', 'MSFT'])"
            },
            fields: {
              type: "array",
              items: { type: "string" },
              description: "Fields to compare"
            }
          },
          required: ["symbols"]
        }
      }
    ]
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    // ... existing cases

    case "compare_stocks": {
      const result = await compareTool.compareStocks(
        args.symbols,
        args.fields || ["close", "market_cap_basic", "return_on_equity"]
      );
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    }
  }
});
```

**Step 3: Test**

```bash
npm run build
# Restart Claude
# Test: "Compare AAPL and MSFT on ROE and margins"
```

---

## Environment Variables

Configure server behavior via environment variables:

| Variable | Description | Default | Valid Range |
|----------|-------------|---------|-------------|
| `CACHE_TTL_SECONDS` | Cache time-to-live | `300` (5 min) | `0` (disabled) to `3600` |
| `RATE_LIMIT_RPM` | API requests per minute | `10` | `1` to `60` |

### Setting Environment Variables

**In .mcp.json:**

```json
{
  "mcpServers": {
    "tradingview-local": {
      "command": "node",
      "args": ["/path/to/dist/index.js"],
      "env": {
        "CACHE_TTL_SECONDS": "600",     // 10 minute cache
        "RATE_LIMIT_RPM": "20"           // 20 requests/min
      }
    }
  }
}
```

**In shell (for testing):**

```bash
export CACHE_TTL_SECONDS=0          # Disable cache
export RATE_LIMIT_RPM=5             # Very conservative rate limit
npm run build && node dist/index.js
```

---

## Debugging

### Enable Debug Logging

The MCP server writes to stderr (visible in Claude's logs):

```typescript
// Add debug output
console.error("Debug: Filters received:", filters);
console.error("Debug: API response:", response);
```

### View Claude Code Logs

```bash
# Mac/Linux
tail -f ~/.claude/logs/mcp-server-tradingview-local.log

# Or check Claude's output panel
```

### Common Issues

**Issue: Changes not appearing**

Solution: You must restart Claude after rebuilding. The MCP server doesn't hot-reload.

```bash
npm run build
# Restart Claude Desktop or Claude Code
```

---

**Issue: "Unknown operator" error**

Solution: Check that filter operators match the allowed list in `OPERATOR_MAP` (src/tools/screen.ts).

Valid operators: `greater`, `less`, `greater_or_equal`, `less_or_equal`, `equal`, `not_equal`, `in_range`, `match`

---

**Issue: Field not found**

Solution: Verify field name exactly matches TradingView's API field name (case-sensitive).

```bash
# Check field exists
npm run build
# Ask Claude: "List all fields with 'margin' in the name"
```

---

**Issue: Cache not clearing**

Solution: Restart the MCP server or set `CACHE_TTL_SECONDS=0` to disable caching during development.

```json
{
  "env": {
    "CACHE_TTL_SECONDS": "0"
  }
}
```

---

## See Also

- [Preset Strategies](presets.md) - Creating effective presets
- [Field Reference](fields.md) - All available fields
- [Main README](../README.md) - Getting started

---

## Contributing

When contributing:

1. **Follow TypeScript best practices**
2. **Add tests** for new features
3. **Update documentation** (this file, fields.md, presets.md)
4. **Test with Claude** before submitting PR
5. **Use conventional commits** (feat:, fix:, docs:, etc.)

Example workflow:

```bash
# Create feature branch
git checkout -b feat/add-quick-ratio-field

# Make changes
vim src/tools/fields.ts

# Build and test
npm run build
npm test

# Commit
git add .
git commit -m "feat: Add quick ratio field for liquidity analysis"

# Push and create PR
git push origin feat/add-quick-ratio-field
```

---

Built with ❤️ using the [Model Context Protocol](https://modelcontextprotocol.io)
