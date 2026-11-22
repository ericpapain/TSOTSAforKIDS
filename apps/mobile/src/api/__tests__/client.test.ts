import {
  API_BASE_URL,
  getApiClient,
  initApiClient,
  resolveApiBaseUrl,
} from "../client";
import { clearStoredTokens, saveStoredTokens } from "../storage";

describe("API Client wrapper", () => {
  beforeEach(async () => {
    await clearStoredTokens();
  });

  it("exposes default API_BASE_URL", () => {
    expect(API_BASE_URL).toBeDefined();
    expect(typeof API_BASE_URL).toBe("string");
    expect(API_BASE_URL).toBe("https://www.tsotsa-for-kids.com/api");
  });

  describe("resolveApiBaseUrl", () => {
    it("returns configured URL when EXPO_PUBLIC_API_URL is provided", () => {
      const customUrl = "https://custom.tsotsa-for-kids.com/api";
      const resolved = resolveApiBaseUrl({ EXPO_PUBLIC_API_URL: customUrl });
      expect(resolved).toBe(customUrl);
    });

    it("trims whitespace from configured URL", () => {
      const resolved = resolveApiBaseUrl({
        EXPO_PUBLIC_API_URL: "  https://custom.tsotsa-for-kids.com/api  ",
      });
      expect(resolved).toBe("https://custom.tsotsa-for-kids.com/api");
    });

    it("falls back to default URL when EXPO_PUBLIC_API_URL is empty or blank", () => {
      expect(resolveApiBaseUrl({ EXPO_PUBLIC_API_URL: "" })).toBe(
        "https://www.tsotsa-for-kids.com/api"
      );
      expect(resolveApiBaseUrl({ EXPO_PUBLIC_API_URL: "   " })).toBe(
        "https://www.tsotsa-for-kids.com/api"
      );
    });

    it("falls back to default URL when environment has no EXPO_PUBLIC_API_URL", () => {
      expect(resolveApiBaseUrl({})).toBe("https://www.tsotsa-for-kids.com/api");
    });

    it("falls back safely when environment is invalid or null", () => {
      expect(
        resolveApiBaseUrl(null as unknown as Record<string, string | undefined>)
      ).toBe("https://www.tsotsa-for-kids.com/api");
    });
  });

  it("provides singleton client instance", () => {
    const client1 = getApiClient();
    const client2 = getApiClient();
    expect(client1).toBe(client2);
  });

  it("initializes client and loads stored tokens", async () => {
    await saveStoredTokens({
      accessToken: "persisted-token-123",
      refreshToken: "persisted-refresh-456",
    });

    const client = await initApiClient();
    const tokens = client.getTokens();
    expect(tokens?.accessToken).toBe("persisted-token-123");
    expect(tokens?.refreshToken).toBe("persisted-refresh-456");
  });
});

