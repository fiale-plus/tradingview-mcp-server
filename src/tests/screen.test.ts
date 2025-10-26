import { describe, it, mock } from "node:test";
import assert from "node:assert";
import { ScreenTool } from "../tools/screen.js";
import type { TradingViewClient } from "../api/client.js";
import type { Cache } from "../utils/cache.js";
import type { RateLimiter } from "../utils/rateLimit.js";

describe("ScreenTool - Filter Validation", () => {
  // Create mock dependencies
  const mockClient = {
    scanStocks: mock.fn(),
    scanForex: mock.fn(),
    scanCrypto: mock.fn(),
  } as unknown as TradingViewClient;

  const mockCache = {
    get: mock.fn(() => null),
    set: mock.fn(),
    startCleanup: mock.fn(),
  } as unknown as Cache;

  const mockRateLimiter = {
    acquire: mock.fn(async () => {}),
  } as unknown as RateLimiter;

  const screenTool = new ScreenTool(mockClient, mockCache, mockRateLimiter);

  describe("Invalid filter structure", () => {
    it("should reject array filters instead of objects", async () => {
      await assert.rejects(
        async () => {
          await screenTool.screenStocks({
            // @ts-expect-error Testing invalid input
            filters: [["field", "operator", "value"]],
          });
        },
        {
          message: /Invalid filter at index 0: expected object with \{field, operator, value\}/,
        }
      );
    });

    it("should reject null filters", async () => {
      await assert.rejects(
        async () => {
          await screenTool.screenStocks({
            // @ts-expect-error Testing invalid input
            filters: [null],
          });
        },
        {
          message: /Invalid filter at index 0: expected object/,
        }
      );
    });

    it("should reject undefined filters", async () => {
      await assert.rejects(
        async () => {
          await screenTool.screenStocks({
            // @ts-expect-error Testing invalid input
            filters: [undefined],
          });
        },
        {
          message: /Invalid filter at index 0: expected object/,
        }
      );
    });

    it("should reject primitive filters", async () => {
      await assert.rejects(
        async () => {
          await screenTool.screenStocks({
            // @ts-expect-error Testing invalid input
            filters: ["string"],
          });
        },
        {
          message: /Invalid filter at index 0: expected object/,
        }
      );
    });
  });

  describe("Missing required properties", () => {
    it("should reject filters missing field property", async () => {
      await assert.rejects(
        async () => {
          await screenTool.screenStocks({
            filters: [
              {
                // @ts-expect-error Testing invalid input
                operator: "greater",
                value: 10,
              },
            ],
          });
        },
        {
          message: /Invalid filter at index 0: missing required properties.*field: undefined/,
        }
      );
    });

    it("should reject filters missing operator property", async () => {
      await assert.rejects(
        async () => {
          await screenTool.screenStocks({
            filters: [
              {
                field: "market_cap_basic",
                // @ts-expect-error Testing invalid input
                value: 10,
              },
            ],
          });
        },
        {
          message: /Invalid filter at index 0: missing required properties.*operator: undefined/,
        }
      );
    });

    it("should reject filters missing value property", async () => {
      await assert.rejects(
        async () => {
          await screenTool.screenStocks({
            filters: [
              {
                field: "market_cap_basic",
                operator: "greater",
                // @ts-expect-error Testing invalid input
              },
            ],
          });
        },
        {
          message: /Invalid filter at index 0: missing required properties.*value: undefined/,
        }
      );
    });

    it("should allow value to be 0 or false", async () => {
      // Mock successful response
      (mockClient.scanStocks as any).mock.mockImplementation(async () => ({
        totalCount: 0,
        data: [],
      }));

      // Should not throw for value: 0
      await assert.doesNotReject(async () => {
        await screenTool.screenStocks({
          filters: [
            {
              field: "market_cap_basic",
              operator: "greater",
              value: 0,
            },
          ],
        });
      });

      // Should not throw for value: false
      await assert.doesNotReject(async () => {
        await screenTool.screenStocks({
          filters: [
            {
              field: "is_primary",
              operator: "equal",
              value: false,
            },
          ],
        });
      });
    });
  });

  describe("Invalid operators", () => {
    it("should reject unknown operator", async () => {
      await assert.rejects(
        async () => {
          await screenTool.screenStocks({
            filters: [
              {
                field: "market_cap_basic",
                // @ts-expect-error Testing invalid input
                operator: "invalid_operator",
                value: 10,
              },
            ],
          });
        },
        {
          message: /Unknown operator: invalid_operator\. Valid operators:/,
        }
      );
    });

    it("should list all valid operators in error message", async () => {
      try {
        await screenTool.screenStocks({
          filters: [
            {
              field: "market_cap_basic",
              // @ts-expect-error Testing invalid input
              operator: "bad_op",
              value: 10,
            },
          ],
        });
        assert.fail("Should have thrown an error");
      } catch (error: any) {
        assert.ok(error.message.includes("greater"));
        assert.ok(error.message.includes("less"));
        assert.ok(error.message.includes("greater_or_equal"));
        assert.ok(error.message.includes("less_or_equal"));
        assert.ok(error.message.includes("equal"));
        assert.ok(error.message.includes("in_range"));
      }
    });

    it("should accept all valid operators", async () => {
      // Mock successful response
      (mockClient.scanStocks as any).mock.mockImplementation(async () => ({
        totalCount: 0,
        data: [],
      }));

      const validOperators = [
        "greater",
        "less",
        "greater_or_equal",
        "less_or_equal",
        "equal",
        "not_equal",
        "in_range",
        "not_in_range",
        "crosses",
        "crosses_above",
        "crosses_below",
        "match",
      ];

      for (const operator of validOperators) {
        await assert.doesNotReject(
          async () => {
            await screenTool.screenStocks({
              filters: [
                {
                  field: "market_cap_basic",
                  operator,
                  value: operator === "in_range" ? [10, 100] : 10,
                },
              ],
            });
          },
          `Operator "${operator}" should be valid`
        );
      }
    });
  });

  describe("Multiple filter validation", () => {
    it("should report correct index for invalid filter in array", async () => {
      await assert.rejects(
        async () => {
          await screenTool.screenStocks({
            filters: [
              {
                field: "market_cap_basic",
                operator: "greater",
                value: 10,
              },
              {
                field: "return_on_equity",
                operator: "greater",
                value: 15,
              },
              {
                // Invalid filter at index 2
                field: "price_earnings_ttm",
                // @ts-expect-error Testing invalid input
                operator: "invalid",
                value: 25,
              },
            ],
          });
        },
        {
          message: /Unknown operator: invalid/,
        }
      );
    });
  });

  describe("Filter validation in different screen methods", () => {
    it("should validate filters in screenForex", async () => {
      await assert.rejects(
        async () => {
          await screenTool.screenForex({
            filters: [
              {
                field: "volume",
                // @ts-expect-error Testing invalid input
                operator: "bad_operator",
                value: 1000,
              },
            ],
          });
        },
        {
          message: /Unknown operator: bad_operator/,
        }
      );
    });

    it("should validate filters in screenCrypto", async () => {
      await assert.rejects(
        async () => {
          await screenTool.screenCrypto({
            filters: [
              {
                field: "market_cap_basic",
                operator: "greater",
                // @ts-expect-error Testing invalid input - missing value
              },
            ],
          });
        },
        {
          message: /Invalid filter at index 0: missing required properties/,
        }
      );
    });
  });

  describe("Valid filter conversion", () => {
    it("should convert valid filters to TradingView format", async () => {
      // Mock successful response
      (mockClient.scanStocks as any).mock.mockImplementation(async (request: any) => {
        // Verify the filter was converted correctly
        assert.strictEqual(request.filter.length, 1);
        assert.strictEqual(request.filter[0].left, "market_cap_basic");
        assert.strictEqual(request.filter[0].operation, "egreater"); // greater_or_equal maps to egreater
        assert.strictEqual(request.filter[0].right, 1000000000);

        return {
          totalCount: 0,
          data: [],
        };
      });

      await screenTool.screenStocks({
        filters: [
          {
            field: "market_cap_basic",
            operator: "greater_or_equal",
            value: 1000000000,
          },
        ],
      });
    });

    it("should handle in_range operator with array value", async () => {
      (mockClient.scanStocks as any).mock.mockImplementation(async (request: any) => {
        assert.strictEqual(request.filter[0].operation, "in_range");
        assert.deepStrictEqual(request.filter[0].right, [45, 65]);

        return {
          totalCount: 0,
          data: [],
        };
      });

      await screenTool.screenStocks({
        filters: [
          {
            field: "RSI",
            operator: "in_range",
            value: [45, 65],
          },
        ],
      });
    });

    it("should handle string comparison for field-to-field filters", async () => {
      (mockClient.scanStocks as any).mock.mockImplementation(async (request: any) => {
        assert.strictEqual(request.filter[0].left, "SMA50");
        assert.strictEqual(request.filter[0].operation, "egreater");
        assert.strictEqual(request.filter[0].right, "SMA200");

        return {
          totalCount: 0,
          data: [],
        };
      });

      await screenTool.screenStocks({
        filters: [
          {
            field: "SMA50",
            operator: "greater_or_equal",
            value: "SMA200",
          },
        ],
      });
    });
  });
});
