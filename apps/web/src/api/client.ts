import { createTsotsaClient, type TsotsaApiClient } from "@tsotsa/api-client";

export function resolveWebApiBaseUrl(customUrl?: string): string {
  if (customUrl && customUrl.trim().length > 0) {
    return customUrl.trim();
  }
  const envUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
  if (envUrl && envUrl.length > 0) {
    return envUrl;
  }
  if (typeof window !== "undefined") {
    const { origin, hostname } = window.location;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://localhost:8000";
    }
    return `${origin}/api`;
  }
  return "http://localhost:8000";
}

export const API_BASE_URL: string = resolveWebApiBaseUrl();

let apiClientInstance: TsotsaApiClient | null = null;

export function getWebApiClient(): TsotsaApiClient {
  if (!apiClientInstance) {
    apiClientInstance = createTsotsaClient({
      baseUrl: API_BASE_URL,
      autoRefresh: true,
    });
    if (typeof window !== "undefined") {
      try {
        const raw = window.sessionStorage.getItem("tsotsa_auth_tokens");
        if (raw) {
          const tokens = JSON.parse(raw) as { accessToken?: string; refreshToken?: string };
          if (tokens?.accessToken) {
            apiClientInstance.setTokens({
              accessToken: tokens.accessToken,
              refreshToken: tokens.refreshToken,
            });
          }
        }
      } catch {
        // Storage errors ignored
      }
    }
  }
  return apiClientInstance;
}

export function resetWebApiClient(): void {
  apiClientInstance = null;
}

