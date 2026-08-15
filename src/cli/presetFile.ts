import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { Preset } from "../resources/presets.js";
import { validateScreenFilters } from "../api/validation.js";

const MAX_PRESET_BYTES = 1024 * 1024;
const TOP_LEVEL_KEYS = new Set([
  "schemaVersion", "name", "description", "filters", "symbols", "markets",
  "sort_by", "sort_order", "limit", "columns",
]);
const FILTER_KEYS = new Set(["field", "operator", "value"]);
class PresetFileValidationError extends Error {}

function readBoundedFile(fd: number): Buffer {
  const buffer = Buffer.allocUnsafe(MAX_PRESET_BYTES + 1);
  let offset = 0;
  while (offset < buffer.length) {
    const bytesRead = fs.readSync(fd, buffer, offset, buffer.length - offset, null);
    if (bytesRead === 0) break;
    offset += bytesRead;
  }
  if (offset > MAX_PRESET_BYTES) {
    throw new PresetFileValidationError(`Preset file exceeds ${MAX_PRESET_BYTES} bytes`);
  }
  return buffer.subarray(0, offset);
}

export interface PresetFileProvenance {
  kind: "file";
  basename: string;
  sha256: string;
  loadedAt: string;
}

function assertExactKeys(value: Record<string, unknown>, allowed: Set<string>, context: string) {
  const unknown = Object.keys(value).filter((key) => !allowed.has(key));
  if (unknown.length) throw new Error(`${context} has unknown keys: ${unknown.join(", ")}`);
}


function stringArray(value: unknown, context: string): string[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.length === 0 || value.some((item) => typeof item !== "string" || !item)) {
    throw new Error(`${context} must be a non-empty string array`);
  }
  return value;
}

export function validatePresetDocument(document: unknown): Preset {
  if (!document || typeof document !== "object" || Array.isArray(document)) {
    throw new Error("Preset file must contain a JSON object");
  }
  const value = document as Record<string, unknown>;
  assertExactKeys(value, TOP_LEVEL_KEYS, "Preset file");
  if (value.schemaVersion !== 1) throw new Error("Preset file schemaVersion must be 1");
  if (typeof value.name !== "string" || !value.name.trim()) throw new Error("Preset file name is required");
  if (typeof value.description !== "string" || !value.description.trim()) throw new Error("Preset file description is required");

  const filters = value.filters;
  const symbols = stringArray(value.symbols, "Preset symbols");
  if ((filters === undefined) === (symbols === undefined)) {
    throw new Error("Preset file must define exactly one of filters or symbols");
  }
  if (filters !== undefined) {
    if (!Array.isArray(filters)) throw new Error("Preset filters must be an array");
    for (const [index, filter] of filters.entries()) {
      if (!filter || typeof filter !== "object" || Array.isArray(filter)) throw new Error(`Preset filter[${index}] must be an object`);
      assertExactKeys(filter as Record<string, unknown>, FILTER_KEYS, `Preset filter[${index}]`);
      const record = filter as Record<string, unknown>;
      if (typeof record.field !== "string" || !record.field || typeof record.operator !== "string" || !record.operator) throw new Error(`Preset filter[${index}] field and operator must be non-empty strings`);
    }
    validateScreenFilters(filters);
  }

  if (value.sort_order !== undefined && value.sort_order !== "asc" && value.sort_order !== "desc") {
    throw new Error("Preset sort_order must be asc or desc");
  }
  if (value.limit !== undefined && (!Number.isInteger(value.limit) || (value.limit as number) < 1 || (value.limit as number) > 200)) {
    throw new Error("Preset limit must be an integer from 1 to 200");
  }
  for (const key of ["sort_by"] as const) {
    if (value[key] !== undefined && (typeof value[key] !== "string" || !value[key])) throw new Error(`Preset ${key} must be a non-empty string`);
  }

  return {
    name: value.name,
    description: value.description,
    filters: filters as Preset["filters"],
    symbols,
    markets: stringArray(value.markets, "Preset markets"),
    sort_by: value.sort_by as string | undefined,
    sort_order: value.sort_order as "asc" | "desc" | undefined,
    limit: value.limit as number | undefined,
    columns: stringArray(value.columns, "Preset columns"),
  };
}

export function loadPresetFile(requestedPath: string, cwd = process.cwd()): { preset: Preset; provenance: PresetFileProvenance } {
  const displayName = path.basename(requestedPath);
  let resolved: string;
  let buffer: Buffer;
  try {
    resolved = fs.realpathSync(path.resolve(cwd, requestedPath));
    const fd = fs.openSync(
      resolved,
      fs.constants.O_RDONLY | fs.constants.O_NONBLOCK
    );
    try {
      const stat = fs.fstatSync(fd);
      if (!stat.isFile()) throw new PresetFileValidationError("Preset path must resolve to a regular file");
      if (stat.size > MAX_PRESET_BYTES) throw new PresetFileValidationError(`Preset file exceeds ${MAX_PRESET_BYTES} bytes`);
      buffer = readBoundedFile(fd);
    } finally {
      fs.closeSync(fd);
    }
  } catch (error) {
    if (error instanceof PresetFileValidationError) throw error;
    throw new Error(`Unable to load preset file ${displayName}`);
  }
  const text = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  const document = JSON.parse(text);
  return {
    preset: validatePresetDocument(document),
    provenance: {
      kind: "file",
      basename: path.basename(resolved),
      sha256: crypto.createHash("sha256").update(buffer).digest("hex"),
      loadedAt: new Date().toISOString(),
    },
  };
}
