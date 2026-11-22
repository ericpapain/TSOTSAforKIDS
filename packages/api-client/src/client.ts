import createClient, { type Client } from "openapi-fetch";
import type { paths } from "./generated/schema.d.ts";

export interface TokenPair {
  accessToken: string;
  refreshToken?: string;
}

export interface TsotsaClientOptions {
  baseUrl?: string;
  tokens?: TokenPair;
  fetch?: typeof globalThis.fetch;
  autoRefresh?: boolean;
  refreshEndpoint?: string;
  onTokenRefreshed?: (tokens: TokenPair) => void | Promise<void>;
  onAuthError?: (error: Error) => void | Promise<void>;
}

export type ClientOptions = TsotsaClientOptions;

export interface TsotsaApiClient {
  readonly client: Client<paths>;
  readonly baseUrl: string;
  getTokens: () => TokenPair | null;
  setTokens: (tokens: TokenPair | null) => void;
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  setAccessToken: (token: string | null) => void;
  setRefreshToken: (token: string | null) => void;
  clearTokens: () => void;
  refreshTokens: () => Promise<TokenPair | null>;
}

const DEFAULT_BASE_URL = "http://localhost:8000";
const DEFAULT_REFRESH_PATH = "/v1/auth/refresh";

function normalizeBaseUrl(url?: string): string {
  if (!url) return DEFAULT_BASE_URL;
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

function normalizeHeaders(headersInit?: HeadersInit): Headers {
  return new Headers(headersInit);
}

class TokenManager {
  private tokens: TokenPair | null = null;
  private inFlightRefresh: Promise<TokenPair | null> | null = null;
  private readonly baseUrl: string;
  private readonly refreshEndpoint: string;
  private readonly baseFetch: typeof globalThis.fetch;
  private readonly onRefreshed?: (tokens: TokenPair) => void | Promise<void>;
  private readonly onAuthError?: (error: Error) => void | Promise<void>;

  constructor(options: TsotsaClientOptions, baseFetch: typeof globalThis.fetch) {
    this.baseUrl = normalizeBaseUrl(options.baseUrl);
    this.refreshEndpoint = options.refreshEndpoint || DEFAULT_REFRESH_PATH;
    this.baseFetch = baseFetch;
    this.onRefreshed = options.onTokenRefreshed;
    this.onAuthError = options.onAuthError;
    if (options.tokens) {
      this.tokens = { ...options.tokens };
    }
  }

  getTokens(): TokenPair | null {
    return this.tokens ? { ...this.tokens } : null;
  }

  setTokens(tokens: TokenPair | null): void {
    this.tokens = tokens ? { ...tokens } : null;
  }

  getAccessToken(): string | null {
    return this.tokens?.accessToken ?? null;
  }

  getRefreshToken(): string | null {
    return this.tokens?.refreshToken ?? null;
  }

  setAccessToken(token: string | null): void {
    if (!token) {
      if (this.tokens) this.tokens.accessToken = "";
      return;
    }
    this.tokens = { ...this.tokens, accessToken: token };
  }

  setRefreshToken(token: string | null): void {
    if (!this.tokens) {
      if (token) this.tokens = { accessToken: "", refreshToken: token };
      return;
    }
    if (!token) {
      delete this.tokens.refreshToken;
      return;
    }
    this.tokens.refreshToken = token;
  }

  clearTokens(): void {
    this.tokens = null;
  }

  async refreshTokens(): Promise<TokenPair | null> {
    if (this.inFlightRefresh) {
      return this.inFlightRefresh;
    }

    const currentRefresh = this.tokens?.refreshToken;
    if (!currentRefresh) {
      return null;
    }

    this.inFlightRefresh = this.performRefresh(currentRefresh);
    try {
      return await this.inFlightRefresh;
    } finally {
      this.inFlightRefresh = null;
    }
  }

  private async performRefresh(token: string): Promise<TokenPair | null> {
    const refreshUrl = `${this.baseUrl}${this.refreshEndpoint}`;
    try {
      const res = await this.baseFetch(refreshUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: token }),
      });

      if (!res.ok) {
        this.clearTokens();
        const err = new Error(`Échec du rafraîchissement (statut ${res.status})`);
        await this.onAuthError?.(err);
        return null;
      }

      const body = (await res.json()) as {
        access_token: string;
        refresh_token?: string;
      };

      const newTokens: TokenPair = {
        accessToken: body.access_token,
        refreshToken: body.refresh_token || token,
      };

      this.tokens = newTokens;
      await this.onRefreshed?.(newTokens);
      return newTokens;
    } catch (cause) {
      this.clearTokens();
      const err = cause instanceof Error ? cause : new Error("Erreur réseau de rafraîchissement");
      await this.onAuthError?.(err);
      return null;
    }
  }
}

function createAuthenticatedFetch(
  manager: TokenManager,
  baseFetch: typeof globalThis.fetch,
  autoRefresh: boolean,
  refreshEndpoint: string,
): typeof globalThis.fetch {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const headers = normalizeHeaders(init?.headers);
    const token = manager.getAccessToken();
    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    if (init?.body && !headers.has("Content-Type") && !headers.has("content-type")) {
      headers.set("Content-Type", "application/json");
    }

    const initialRequestInit: RequestInit = { ...init, headers };
    const response = await baseFetch(input, initialRequestInit);

    const isRefreshReq = typeof input === "string" && input.includes(refreshEndpoint);
    if (response.status !== 401 || !autoRefresh || isRefreshReq) {
      return response;
    }

    const refreshedTokens = await manager.refreshTokens();
    if (!refreshedTokens) {
      return response;
    }

    const retryHeaders = normalizeHeaders(init?.headers);
    retryHeaders.set("Authorization", `Bearer ${refreshedTokens.accessToken}`);
    return baseFetch(input, { ...init, headers: retryHeaders });
  };
}

export function createTsotsaClient(options: TsotsaClientOptions = {}): TsotsaApiClient {
  const baseUrl = normalizeBaseUrl(options.baseUrl);
  const baseFetch = options.fetch ?? globalThis.fetch.bind(globalThis);
  const autoRefresh = options.autoRefresh ?? true;
  const refreshEndpoint = options.refreshEndpoint || DEFAULT_REFRESH_PATH;

  const manager = new TokenManager(options, baseFetch);
  const customFetch = createAuthenticatedFetch(
    manager,
    baseFetch,
    autoRefresh,
    refreshEndpoint,
  );

  const client = createClient<paths>({
    baseUrl,
    fetch: customFetch,
  });

  return {
    client,
    baseUrl,
    getTokens: () => manager.getTokens(),
    setTokens: (t) => manager.setTokens(t),
    getAccessToken: () => manager.getAccessToken(),
    getRefreshToken: () => manager.getRefreshToken(),
    setAccessToken: (t) => manager.setAccessToken(t),
    setRefreshToken: (t) => manager.setRefreshToken(t),
    clearTokens: () => manager.clearTokens(),
    refreshTokens: () => manager.refreshTokens(),
  };
}
