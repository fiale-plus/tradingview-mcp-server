export interface ResultMetadata {
  retrieved_at: string;
  source: string;
  cache_hit: boolean;
  requested_count: number;
  returned_count: number;
  missing_symbols: string[];
  unavailable_symbols?: string[];
}

export interface ResultMetadataInput {
  source: string;
  requested_count: number;
  returned_count: number;
  missing_symbols?: string[];
  unavailable_symbols?: string[];
  cache_hit?: boolean;
  retrieved_at?: string;
}

function now(): string {
  return new Date().toISOString();
}

export function createResultMetadata(input: ResultMetadataInput): ResultMetadata {
  return {
    retrieved_at: input.retrieved_at ?? now(),
    source: input.source,
    cache_hit: input.cache_hit ?? false,
    requested_count: input.requested_count,
    returned_count: input.returned_count,
    missing_symbols: input.missing_symbols ?? [],
    ...(input.unavailable_symbols ? { unavailable_symbols: input.unavailable_symbols } : {}),
  };
}

export function withResultMetadata<T extends object>(
  result: T,
  metadata: ResultMetadata,
): T & { metadata: ResultMetadata } {
  return { ...result, metadata };
}

function readStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) {
    return undefined;
  }
  return value;
}

function readCachedMetadata(value: unknown): Partial<ResultMetadata> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {};
  }

  const metadata: Partial<ResultMetadata> = {};
  if ("retrieved_at" in value && typeof value.retrieved_at === "string") {
    metadata.retrieved_at = value.retrieved_at;
  }
  if ("source" in value && typeof value.source === "string") {
    metadata.source = value.source;
  }
  if ("requested_count" in value && typeof value.requested_count === "number") {
    metadata.requested_count = value.requested_count;
  }
  if ("returned_count" in value && typeof value.returned_count === "number") {
    metadata.returned_count = value.returned_count;
  }
  if ("missing_symbols" in value) {
    const missingSymbols = readStringArray(value.missing_symbols);
    if (missingSymbols) metadata.missing_symbols = missingSymbols;
  }
  if ("unavailable_symbols" in value) {
    const unavailableSymbols = readStringArray(value.unavailable_symbols);
    if (unavailableSymbols) metadata.unavailable_symbols = unavailableSymbols;
  }
  return metadata;
}

export function withCacheHitMetadata<T extends object>(
  cached: T,
  fallback: ResultMetadataInput,
): T & { metadata: ResultMetadata } {
  const existing = "metadata" in cached ? readCachedMetadata(cached.metadata) : {};
  const metadata: ResultMetadata = {
    retrieved_at: existing.retrieved_at ?? fallback.retrieved_at ?? now(),
    source: existing.source ?? fallback.source,
    cache_hit: true,
    requested_count: existing.requested_count ?? fallback.requested_count,
    returned_count: existing.returned_count ?? fallback.returned_count,
    missing_symbols: existing.missing_symbols ?? fallback.missing_symbols ?? [],
    ...(existing.unavailable_symbols
      ? { unavailable_symbols: existing.unavailable_symbols }
      : fallback.unavailable_symbols
        ? { unavailable_symbols: fallback.unavailable_symbols }
        : {}),
  };

  return { ...cached, metadata };
}
