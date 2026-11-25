/**
 * Shared API Client instance for the TSOTSA Kids mobile application.
 * Utilizes @tsotsa/api-client with token persistence via expo-secure-store.
 */

import {
  createTsotsaClient,
  type TokenPair,
  type TsotsaApiClient,
} from "@tsotsa/api-client";

import { clearStoredTokens, getStoredTokens, saveStoredTokens } from "./storage";

export function resolveApiBaseUrl(
  envOverride?: Record<string, string | undefined>
): string {
  try {
    const env =
      envOverride !== undefined
        ? envOverride
        : typeof process !== "undefined"
          ? process.env
          : undefined;
    if (env && typeof env === "object") {
      const customUrl = env["EXPO_PUBLIC_API_URL"];
      if (typeof customUrl === "string" && customUrl.trim().length > 0) {
        return customUrl.trim();
      }
    }
  } catch {
    // Fallback if environment is inaccessible
  }
  return "https://www.tsotsa-for-kids.com/api";
}

const API_BASE_URL = resolveApiBaseUrl();

let apiClientInstance: TsotsaApiClient | null = null;

export function getApiClient(): TsotsaApiClient {
  if (!apiClientInstance) {
    apiClientInstance = createTsotsaClient({
      baseUrl: API_BASE_URL,
      autoRefresh: true,
      onTokenRefreshed: async (tokens: TokenPair) => {
        await saveStoredTokens(tokens);
      },
      onAuthError: async () => {
        await clearStoredTokens();
      },
    });
  }
  return apiClientInstance;
}

export async function initApiClient(): Promise<TsotsaApiClient> {
  const client = getApiClient();
  const stored = await getStoredTokens();
  if (stored) {
    client.setTokens(stored);
  }
  return client;
}

export { API_BASE_URL };

