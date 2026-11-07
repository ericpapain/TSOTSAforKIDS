import {
  clearStoredTokens,
  getStoredTokens,
  saveStoredTokens,
} from "../storage";

describe("SecureStore storage helper", () => {
  beforeEach(async () => {
    await clearStoredTokens();
  });

  it("returns null when no token is saved", async () => {
    const tokens = await getStoredTokens();
    expect(tokens).toBeNull();
  });

  it("saves and retrieves tokens correctly", async () => {
    await saveStoredTokens({
      accessToken: "test-access-token-123",
      refreshToken: "test-refresh-token-456",
    });

    const tokens = await getStoredTokens();
    expect(tokens).toEqual({
      accessToken: "test-access-token-123",
      refreshToken: "test-refresh-token-456",
    });
  });

  it("clears stored tokens", async () => {
    await saveStoredTokens({
      accessToken: "to-delete-access",
      refreshToken: "to-delete-refresh",
    });

    await clearStoredTokens();
    const tokens = await getStoredTokens();
    expect(tokens).toBeNull();
  });
});

