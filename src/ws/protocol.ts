export interface Message { m: string; p: unknown[] }

export function encodePacket(message: Message | string): string {
  const payload = typeof message === "string" ? message : JSON.stringify(message);
  return `~m~${payload.length}~m~${payload}`;
}

/** Accept character- or UTF-8-byte-counted frames, with boundary-based fallback. */
export function decodePacket(raw: string): Array<Message | string> {
  const messages: Array<Message | string> = [];
  let offset = 0;
  while (offset < raw.length) {
    const header = /^~m~(\d+)~m~/.exec(raw.slice(offset));
    if (!header) throw new Error("Invalid TradingView frame header");
    const length = Number(header[1]);
    offset += header[0].length;
    if (!Number.isSafeInteger(length) || length < 1) {
      throw new Error("Invalid TradingView frame length");
    }
    const isBoundary = (end: number) => end === raw.length ||
      (end < raw.length && /^~m~\d+~m~/.test(raw.slice(end)));
    let end = offset + length;
    if (!isBoundary(end)) {
      let bytes = 0;
      let byteEnd = offset;
      for (const char of raw.slice(offset)) {
        bytes += Buffer.byteLength(char, "utf8");
        byteEnd += char.length;
        if (bytes >= length) break;
      }
      if (bytes === length && isBoundary(byteEnd)) {
        end = byteEnd;
      } else {
        const nextHeader = /~m~\d+~m~/.exec(raw.slice(offset));
        end = nextHeader ? offset + nextHeader.index : raw.length;
      }
    }
    const payload = raw.slice(offset, end);
    offset = end;
    if (/^~h~\d+$/.test(payload)) {
      messages.push(payload);
      continue;
    }
    let value: unknown;
    try { value = JSON.parse(payload); }
    catch { throw new Error("Invalid TradingView message JSON"); }
    // The initial connection greeting has no method and needs no response.
    if (typeof value !== "object" || value === null) throw new Error("Invalid TradingView message");
    if (!("m" in value)) continue;
    if (typeof value.m !== "string" || !("p" in value) || !Array.isArray(value.p)) {
      throw new Error("Invalid TradingView message");
    }
    messages.push({ m: value.m, p: value.p });
  }
  return messages;
}
