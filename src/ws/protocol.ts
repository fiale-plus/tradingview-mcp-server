/**
 * TradingView WebSocket protocol encoding/decoding
 *
 * TradingView uses a custom framing protocol over WebSocket:
 *   ~m~<length>~m~<payload>
 *
 * Ping messages are plain numbers: ~h~<number>
 * Messages are JSON objects with 'm' (method) and 'p' (params)
 */

/**
 * Generate a random session ID with a given prefix
 * @param prefix - 'qs_' for quote sessions, 'cs_' for chart sessions
 * @returns Random session ID like 'qs_abc123def456'
 */
export function genSessionId(prefix: "qs_" | "cs_" | "rs_"): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let id = prefix;
  for (let i = 0; i < 12; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

/**
 * Encode a message into TradingView WebSocket protocol format
 * @param message - Object with 'm' (method) and 'p' (params), or a plain string
 * @returns Encoded packet string like ~m~42~m~{"m":"set_auth_token","p":["..."]}
 */
export function encodePacket(message: { m: string; p: any[] } | string): string {
  const payload = typeof message === "string" ? message : JSON.stringify(message);
  return `~m~${payload.length}~m~${payload}`;
}

/**
 * Decode raw WebSocket data into an array of parsed messages
 * Handles both:
 * - Data messages: ~m~<len>~m~<json>
 * - Ping messages: ~h~<number>
 *
 * @param rawData - Raw string from WebSocket
 * @returns Array of parsed message objects or ping numbers
 */
export function decodePacket(rawData: string): Array<{ m: string; p: any[] } | number> {
  const results: Array<{ m: string; p: any[] } | number> = [];

  // Strip ping messages (~h~<number>)
  const cleaned = rawData.replace(/~h~\d+/g, "");

  // Split by the frame delimiter pattern
  const parts = cleaned.split(/~m~\d+~m~/);

  for (const part of parts) {
    // Extract ping numbers first
    const pingMatch = rawData.match(/~h~(\d+)/);
    if (pingMatch && !cleaned.includes(part)) {
      // Already handled ping above via cleaning
    }

    const trimmed = part.trim();
    if (!trimmed) continue;

    try {
      const parsed = JSON.parse(trimmed);
      if (typeof parsed === "object" && parsed.m && Array.isArray(parsed.p)) {
        results.push(parsed);
      }
    } catch {
      // Not valid JSON, skip
    }
  }

  // Also check for ping messages in the raw data
  const pingRegex = /~h~(\d+)/g;
  let pingMatch;
  while ((pingMatch = pingRegex.exec(rawData)) !== null) {
    results.push(parseInt(pingMatch[1], 10));
  }

  return results;
}

/**
 * Create a ping response for a received ping number
 * @param pingNum - The ping number received
 * @returns Encoded pong message
 */
export function createPong(pingNum: number): string {
  return `~m~3~m~~h~${pingNum}~`;
}

/**
 * Create a set_auth_token message
 * @param token - Auth token (usually 'unauthorized_user_token' for anonymous)
 * @returns Formatted message object
 */
export function createSetAuthToken(token: string): { m: string; p: string[] } {
  return { m: "set_auth_token", p: [token] };
}

/**
 * Create a chart_create_session message
 * @param sessionId - Chart session ID
 * @returns Formatted message object
 */
export function createChartSession(sessionId: string): { m: string; p: string[] } {
  return { m: "chart_create_session", p: [sessionId, ""] };
}

/**
 * Create a quote_create_session message
 * @param sessionId - Quote session ID
 * @returns Formatted message object
 */
export function createQuoteSession(sessionId: string): { m: string; p: string[] } {
  return { m: "quote_create_session", p: [sessionId] };
}

/**
 * Create a quote_set_fields message
 * @param sessionId - Quote session ID
 * @param fields - Fields to request
 * @returns Formatted message object
 */
export function createQuoteSetFields(
  sessionId: string,
  fields: string[]
): { m: string; p: (string | string[])[] } {
  return { m: "quote_set_fields", p: [sessionId, ...fields] };
}

/**
 * Create a resolve_symbol message
 * @param chartSessionId - Chart session ID
 * @param symbolKey - Symbol key (e.g., 'symbol_1')
 * @param symbolObj - Symbol configuration object
 * @returns Formatted message object
 */
export function createResolveSymbol(
  chartSessionId: string,
  symbolKey: string,
  symbolObj: {
    symbol: string;
    adjustment?: string;
    session?: string;
    "currency-id"?: string;
  }
): { m: string; p: string[] } {
  const config = {
    symbol: symbolObj.symbol,
    adjustment: symbolObj.adjustment || "splits",
    ...(symbolObj.session && { session: symbolObj.session }),
    ...(symbolObj["currency-id"] && { "currency-id": symbolObj["currency-id"] }),
  };
  return {
    m: "resolve_symbol",
    p: [chartSessionId, symbolKey, `=${JSON.stringify(config)}`],
  };
}

/**
 * Create a create_series message
 * @param chartSessionId - Chart session ID
 * @param seriesId - Series ID (e.g., 's1')
 * @param seriesCommandId - Series command ID
 * @param symbolKey - Symbol key used in resolve_symbol
 * @param timeframe - Timeframe string
 * @param count - Number of bars to request
 * @returns Formatted message object
 */
export function createSeries(
  chartSessionId: string,
  seriesId: string,
  seriesCommandId: string,
  symbolKey: string,
  timeframe: string,
  count: number
): { m: string; p: (string | number)[] } {
  return {
    m: "create_series",
    p: [chartSessionId, seriesId, seriesCommandId, symbolKey, timeframe, count],
  };
}

/**
 * Create a modify_series message
 * @param chartSessionId - Chart session ID
 * @param seriesId - Series ID
 * @param seriesCommandId - Series command ID
 * @param symbolKey - Symbol key
 * @param timeframe - New timeframe
 * @param count - Number of bars to request
 * @returns Formatted message object
 */
export function modifySeries(
  chartSessionId: string,
  seriesId: string,
  seriesCommandId: string,
  symbolKey: string,
  timeframe: string,
  count: number
): { m: string; p: (string | number)[] } {
  return {
    m: "modify_series",
    p: [chartSessionId, seriesId, seriesCommandId, symbolKey, timeframe, count],
  };
}

/**
 * Create a request_more_data message
 * @param chartSessionId - Chart session ID
 * @param seriesId - Series ID
 * @param count - Number of additional bars
 * @returns Formatted message object
 */
export function createRequestMoreData(
  chartSessionId: string,
  seriesId: string,
  count: number
): { m: string; p: (string | string | number)[] } {
  return {
    m: "request_more_data",
    p: [chartSessionId, seriesId, count],
  };
}

/**
 * Create a quote_add_symbols message
 * @param sessionId - Quote session ID
 * @param symbols - Symbols to add
 * @returns Formatted message object
 */
export function createQuoteAddSymbols(
  sessionId: string,
  symbols: string[]
): { m: string; p: (string | any)[] } {
  return {
    m: "quote_add_symbols",
    p: [sessionId, ...symbols],
  };
}

/**
 * Create a quote_fast_symbols message
 * @param sessionId - Quote session ID
 * @param symbols - Symbols to fast-track
 * @returns Formatted message object
 */
export function createQuoteFastSymbols(
  sessionId: string,
  symbols: string[]
): { m: string; p: string[] } {
  return {
    m: "quote_fast_symbols",
    p: [sessionId, ...symbols],
  };
}

/**
 * Create a quote_remove_symbols message
 * @param sessionId - Quote session ID
 * @param symbols - Symbols to remove
 * @returns Formatted message object
 */
export function createQuoteRemoveSymbols(
  sessionId: string,
  symbols: string[]
): { m: string; p: string[] } {
  return {
    m: "quote_remove_symbols",
    p: [sessionId, ...symbols],
  };
}

/**
 * Create a switch_timezone message
 * @param chartSessionId - Chart session ID
 * @param timezone - Timezone string (e.g., 'exchange', 'Etc/UTC')
 * @returns Formatted message object
 */
export function createSwitchTimezone(
  chartSessionId: string,
  timezone: string
): { m: string; p: string[] } {
  return {
    m: "switch_timezone",
    p: [chartSessionId, timezone],
  };
}

/**
 * Create a chart_delete_session message
 * @param sessionId - Chart session ID
 * @returns Formatted message object
 */
export function createDeleteChartSession(
  sessionId: string
): { m: string; p: string[] } {
  return {
    m: "chart_delete_session",
    p: [sessionId],
  };
}

/**
 * Create a quote_delete_session message
 * @param sessionId - Quote session ID
 * @returns Formatted message object
 */
export function createDeleteQuoteSession(
  sessionId: string
): { m: string; p: string[] } {
  return {
    m: "quote_delete_session",
    p: [sessionId],
  };
}