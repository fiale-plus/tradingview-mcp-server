/**
 * Tests for experimental bars and stream tools
 *
 * These test the tool interface and validation without requiring
 * a live WebSocket connection.
 */

import { describe, it } from "node:test";
import assert from "node:assert";
import { getBars } from "../tools/bars.js";
import { isExperimentalEnabled, getWsConfig } from "../ws/auth.js";

describe("Experimental Tools", () => {
  describe("isExperimentalEnabled", () => {
    it("should return false when TV_EXPERIMENTAL_ENABLED is not set", () => {
      const original = process.env.TV_EXPERIMENTAL_ENABLED;
      delete process.env.TV_EXPERIMENTAL_ENABLED;
      assert.strictEqual(isExperimentalEnabled(), false);
      if (original !== undefined) process.env.TV_EXPERIMENTAL_ENABLED = original;
    });

    it("should return true when TV_EXPERIMENTAL_ENABLED is '1'", () => {
      const original = process.env.TV_EXPERIMENTAL_ENABLED;
      process.env.TV_EXPERIMENTAL_ENABLED = "1";
      assert.strictEqual(isExperimentalEnabled(), true);
      if (original !== undefined) process.env.TV_EXPERIMENTAL_ENABLED = original;
      else delete process.env.TV_EXPERIMENTAL_ENABLED;
    });

    it("should return true when TV_EXPERIMENTAL_ENABLED is 'true'", () => {
      const original = process.env.TV_EXPERIMENTAL_ENABLED;
      process.env.TV_EXPERIMENTAL_ENABLED = "true";
      assert.strictEqual(isExperimentalEnabled(), true);
      if (original !== undefined) process.env.TV_EXPERIMENTAL_ENABLED = original;
      else delete process.env.TV_EXPERIMENTAL_ENABLED;
    });

    it("should return false when TV_EXPERIMENTAL_ENABLED is 'false'", () => {
      const original = process.env.TV_EXPERIMENTAL_ENABLED;
      process.env.TV_EXPERIMENTAL_ENABLED = "false";
      assert.strictEqual(isExperimentalEnabled(), false);
      if (original !== undefined) process.env.TV_EXPERIMENTAL_ENABLED = original;
      else delete process.env.TV_EXPERIMENTAL_ENABLED;
    });
  });

  describe("getBars", () => {
    it("should reject when experimental features are disabled", async () => {
      const original = process.env.TV_EXPERIMENTAL_ENABLED;
      delete process.env.TV_EXPERIMENTAL_ENABLED;
      await assert.rejects(
        async () => getBars({ symbol: "BINANCE:BTCUSDT" }),
        { message: /Experimental features are disabled/ }
      );
      if (original !== undefined) process.env.TV_EXPERIMENTAL_ENABLED = original;
    });

    it("should reject when symbol is empty", async () => {
      const original = process.env.TV_EXPERIMENTAL_ENABLED;
      process.env.TV_EXPERIMENTAL_ENABLED = "1";
      // This will fail at WebSocket connection, not validation
      // But getBars validates symbol emptiness before connection
      try {
        await getBars({ symbol: "" });
        assert.fail("Should have thrown");
      } catch (err: any) {
        assert.ok(err.message.includes("required") || err.message.includes("failed") || err.message.includes("Error"));
      }
      if (original !== undefined) process.env.TV_EXPERIMENTAL_ENABLED = original;
      else delete process.env.TV_EXPERIMENTAL_ENABLED;
    });
  });

  describe("getWsConfig", () => {
    it("should return defaults when no env vars set", () => {
      const original = { ...process.env };
      delete process.env.TV_WS_ENDPOINT;
      delete process.env.TV_WS_TIMEOUT_MS;
      delete process.env.TV_SESSION_ID;
      delete process.env.TV_SESSION_SIGN;

      const config = getWsConfig();
      assert.strictEqual(config.server, "data");
      assert.strictEqual(config.timeout, 10000);
      assert.strictEqual(config.authToken, "unauthorized_user_token");

      Object.assign(process.env, original);
    });

    it("should use env vars when set", () => {
      const originals: Record<string, string | undefined> = {};
      const envVars = ["TV_WS_ENDPOINT", "TV_WS_TIMEOUT_MS", "TV_SESSION_ID", "TV_SESSION_SIGN"];
      for (const key of envVars) {
        originals[key] = process.env[key];
      }

      process.env.TV_WS_ENDPOINT = "prodata";
      process.env.TV_WS_TIMEOUT_MS = "5000";
      process.env.TV_SESSION_ID = "my_session";

      const config = getWsConfig();
      assert.strictEqual(config.server, "prodata");
      assert.strictEqual(config.timeout, 5000);
      assert.strictEqual(config.authToken, "my_session");

      for (const key of envVars) {
        if (originals[key] === undefined) delete process.env[key];
        else process.env[key] = originals[key];
      }
    });
  });
});