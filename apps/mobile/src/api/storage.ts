/**
 * Token persistence using expo-secure-store.
 * Stores JWT access and refresh tokens securely on the native device.
 */

import * as SecureStore from "expo-secure-store";
import type { TokenPair } from "@tsotsa/api-client";

const ACCESS_TOKEN_KEY = "tsotsa_access_token";
const REFRESH_TOKEN_KEY = "tsotsa_refresh_token";

export async function getStoredTokens(): Promise<TokenPair | null> {
  try {
    const accessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    if (!accessToken) {
      return null;
    }
    const refreshToken = (await SecureStore.getItemAsync(REFRESH_TOKEN_KEY)) || undefined;
    return { accessToken, refreshToken };
  } catch {
    return null;
  }
}

export async function saveStoredTokens(tokens: TokenPair): Promise<void> {
  try {
    if (tokens.accessToken) {
      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.accessToken);
    }
    if (tokens.refreshToken) {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken);
    }
  } catch {
    // Gracefully handle storage errors
  }
}

export async function clearStoredTokens(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  } catch {
    // Gracefully handle removal errors
  }
}

