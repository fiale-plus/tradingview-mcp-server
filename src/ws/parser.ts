export interface Bar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number | null;
}

/** Chart s1 rows are [unix seconds, open, high, low, close, optional volume]. */
export function parseBarData(series: unknown, previous: Bar[] = []): Bar[] {
  const bars = new Map(previous.map((bar) => [bar.time, bar]));
  if (typeof series !== "object" || series === null || !("s" in series) || !Array.isArray(series.s)) {
    throw new Error("Invalid TradingView bar series");
  }
  for (const row of series.s) {
    const v: unknown = typeof row === "object" && row !== null && "v" in row ? row.v : row;
    if (!Array.isArray(v) || v.length < 5 ||
        !v.slice(0, 5).every((n) => typeof n === "number" && Number.isFinite(n)) ||
        (v.length > 5 && v[5] !== null && (typeof v[5] !== "number" || !Number.isFinite(v[5]))) ||
        !Number.isInteger(v[0])) {
      throw new Error("Invalid TradingView OHLCV row");
    }
    const [time, open, high, low, close] = v as number[];
    const volume = v.length > 5 ? v[5] as number | null : null;
    bars.set(time, { time, open, high, low, close, volume });
  }
  return [...bars.values()].sort((a, b) => a.time - b.time);
}
