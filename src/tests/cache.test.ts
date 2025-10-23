import { describe, it } from "node:test";
import assert from "node:assert";
import { Cache } from "../utils/cache.js";

describe("Cache", () => {
  it("should store and retrieve values", () => {
    const cache = new Cache(60);
    cache.set("test", { value: 123 });
    const result = cache.get("test");
    assert.deepStrictEqual(result, { value: 123 });
  });

  it("should return null for non-existent keys", () => {
    const cache = new Cache(60);
    const result = cache.get("nonexistent");
    assert.strictEqual(result, null);
  });

  it("should expire entries after TTL", async () => {
    const cache = new Cache(1); // 1 second TTL
    cache.set("test", "value");

    // Should exist immediately
    assert.strictEqual(cache.get("test"), "value");

    // Wait for expiration
    await new Promise((resolve) => setTimeout(resolve, 1100));

    // Should be expired
    assert.strictEqual(cache.get("test"), null);
  });

  it("should not cache when TTL is 0", () => {
    const cache = new Cache(0);
    cache.set("test", "value");
    const result = cache.get("test");
    assert.strictEqual(result, null);
  });

  it("should clear all entries", () => {
    const cache = new Cache(60);
    cache.set("key1", "value1");
    cache.set("key2", "value2");

    cache.clear();

    assert.strictEqual(cache.get("key1"), null);
    assert.strictEqual(cache.get("key2"), null);
  });
});
