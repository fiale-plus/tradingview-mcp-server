export interface RuntimeConfig {
  cacheTtlSeconds: number;
  rateLimitRpm: number;
}

const DEFAULT_CACHE_TTL_SECONDS = 300;
const DEFAULT_RATE_LIMIT_RPM = 10;

function parseBoundedInteger(
  name: string,
  rawValue: string | undefined,
  defaultValue: number,
  minimum: number,
  maximum: number,
): number {
  if (rawValue === undefined) return defaultValue;
  if (!/^\d+$/.test(rawValue)) {
    throw new Error(`${name} must be an integer between ${minimum} and ${maximum}; received '${rawValue}'`);
  }

  const value = Number(rawValue);
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
    throw new Error(`${name} must be an integer between ${minimum} and ${maximum}; received '${rawValue}'`);
  }
  return value;
}

export function loadRuntimeConfig(
  environment: Record<string, string | undefined> = process.env,
): RuntimeConfig {
  return {
    cacheTtlSeconds: parseBoundedInteger(
      "CACHE_TTL_SECONDS",
      environment.CACHE_TTL_SECONDS,
      DEFAULT_CACHE_TTL_SECONDS,
      0,
      3600,
    ),
    rateLimitRpm: parseBoundedInteger(
      "RATE_LIMIT_RPM",
      environment.RATE_LIMIT_RPM,
      DEFAULT_RATE_LIMIT_RPM,
      1,
      60,
    ),
  };
}
