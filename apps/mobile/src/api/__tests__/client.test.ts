import { API_BASE_URL, getApiClient, initApiClient } from "../client";
import { clearStoredTokens, saveStoredTokens } from "../storage";

describe("API Client wrapper", () => {
  beforeEach(async () => {
    await clearStoredTokens();
  });

  it("exposes default API_BASE_URL", () => {
    expect(API_BASE_URL).toBeDefined();
    expect(typeof API_BASE_URL).toBe("string");
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

