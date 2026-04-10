/**
 * Auth helpers for TradingView WebSocket
 *
 * Handles session tokens, cookies, and auth configuration
 */

/**
 * Get auth token from environment or fallback to anonymous token
 *
 * TV_SESSION_ID and TV_SESSION_SIGN are TradingView session cookies
 * that can be extracted from a browser session. Without them,
 * the 'unauthorized_user_token' is used for anonymous access
 * (which provides limited data).
 *
 * @returns Auth token string
 */
export function getAuthToken(): string {
  const sessionId = process.env.TV_SESSION_ID;
  const sessionSign = process.env.TV_SESSION_SIGN;

  if (sessionId) {
    // When session is provided, we need to fetch the auth token
    // from TradingView. For now, use the session directly.
    // The ws client will send set_auth_token with this session.
    // In practice, the auth_token is derived from the session.
    return sessionId;
  }

  return "unauthorized_user_token";
}

/**
 * Check if experimental features are enabled
 * @returns true if TV_EXPERIMENTAL_ENABLED is set to a truthy value
 */
export function isExperimentalEnabled(): boolean {
  const val = process.env.TV_EXPERIMENTAL_ENABLED;
  return val === "1" || val === "true" || val === "yes";
}

/**
 * Get WebSocket configuration from environment
 */
export function getWsConfig(): {
  server: string;
  timeout: number;
  authToken: string;
  sessionSign?: string;
} {
  const server = process.env.TV_WS_ENDPOINT || "data";
  const timeout = parseInt(process.env.TV_WS_TIMEOUT_MS || "10000", 10);
  const authToken = getAuthToken();
  const sessionSign = process.env.TV_SESSION_SIGN;

  return {
    server,
    timeout,
    authToken,
    ...(sessionSign && { sessionSign }),
  };
}