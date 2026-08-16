import fetch, { type RequestInit } from "node-fetch";
import { setTimeout as delay } from "node:timers/promises";
import type { RateLimiter } from "../utils/rateLimit.js";

export interface FetchResponse {
  ok: boolean;
  status: number;
  statusText: string;
  body?: unknown;
  json(): Promise<unknown>;
}

export type FetchLike = (url: string, init: RequestInit) => Promise<FetchResponse>;

export interface TransportOptions {
  fetchImpl?: FetchLike;
  timeoutMs?: number;
  maxRetries?: number;
  retryDelayMs?: number;
  rateLimiter?: RateLimiter;
}

export type UpstreamErrorKind = "timeout" | "http" | "network" | "parse" | "response";

export class UpstreamError extends Error {
  constructor(
    message: string,
    public readonly kind: UpstreamErrorKind,
    public readonly status?: number,
    public readonly retryable = false,
    public readonly statusText?: string,
    public readonly cause?: unknown,
  ) {
    super(message, cause === undefined ? undefined : { cause });
    this.name = "UpstreamError";
  }
}

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_RETRY_DELAY_MS = 100;

function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 425 || status === 429 || status >= 500;
}

function isResponse(value: FetchResponse): boolean {
  return typeof value === "object"
    && value !== null
    && typeof value.ok === "boolean"
    && Number.isInteger(value.status)
    && typeof value.statusText === "string"
    && typeof value.json === "function";
}

function asError(value: unknown): Error {
  return value instanceof Error ? value : new Error(String(value));
}

async function sleep(delayMs: number): Promise<void> {
  if (delayMs > 0) await delay(delayMs);
}

function disposeResponse(response: FetchResponse): void {
  const body = response.body;
  if (typeof body !== "object" || body === null) return;

  const candidate = body as {
    destroy?: () => void;
    cancel?: () => Promise<void> | void;
  };
  if (typeof candidate.destroy === "function") {
    candidate.destroy();
    return;
  }
  if (typeof candidate.cancel === "function") {
    void Promise.resolve(candidate.cancel()).catch(() => {});
  }
}

/**
 * Execute one JSON request with a bounded retry budget for transient failures.
 * Parse and response-shape failures are deliberately not retried.
 */
export async function requestJson(
  url: string,
  init: RequestInit,
  options: TransportOptions = {},
): Promise<unknown> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
  const retryDelayMs = options.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    let timedOut = false;
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);

    try {
      const response = await fetchImpl(url, { ...init, signal: controller.signal });
      if (!isResponse(response)) {
        throw new UpstreamError("Upstream transport returned a malformed response", "response");
      }
      if (!response.ok) {
        disposeResponse(response);
        throw new UpstreamError(
          `Upstream request failed with HTTP ${response.status}${response.statusText ? `: ${response.statusText}` : ""}`,
          "http",
          response.status,
          isRetryableStatus(response.status),
          response.statusText,
        );
      }

      try {
        return await response.json();
      } catch (error) {
        if (!(error instanceof SyntaxError)) throw error;
        throw new UpstreamError(
          `Upstream returned invalid JSON: ${asError(error).message}`,
          "parse",
          undefined,
          false,
          undefined,
          error,
        );
      }
    } catch (error) {
      const normalized = error instanceof UpstreamError
        ? error
        : timedOut || asError(error).name === "AbortError"
          ? new UpstreamError("Upstream request timed out", "timeout", undefined, true, undefined, error)
          : new UpstreamError(
            `Upstream request failed: ${asError(error).message}`,
            "network",
            undefined,
            true,
            undefined,
            error,
          );

      if (!normalized.retryable || attempt >= maxRetries) {
        throw normalized;
      }

      if (options.rateLimiter) {
        await options.rateLimiter.acquire();
      }
      await sleep(retryDelayMs * 2 ** attempt);
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new UpstreamError("Upstream request retry loop exhausted", "network");
}
