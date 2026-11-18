import { createTsotsaClient, type TsotsaApiClient } from "@tsotsa/api-client";

export const API_BASE_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined) ||
  (typeof window !== "undefined" ? window.location.origin : "http://localhost:8000");

let apiClientInstance: TsotsaApiClient | null = null;

export function getWebApiClient(): TsotsaApiClient {
  if (!apiClientInstance) {
    apiClientInstance = createTsotsaClient({
      baseUrl: API_BASE_URL,
      autoRefresh: true,
    });
  }
  return apiClientInstance;
}

