import {
  clearProfessionalSessionOnLaunch,
  clearStoredTokens,
  getStoredRole,
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

  it("saves and retrieves tokens and role correctly", async () => {
    await saveStoredTokens(
      {
        accessToken: "test-access-token-123",
        refreshToken: "test-refresh-token-456",
      },
      "caregiver"
    );

    const tokens = await getStoredTokens();
    expect(tokens).toEqual({
      accessToken: "test-access-token-123",
      refreshToken: "test-refresh-token-456",
    });

    const role = await getStoredRole();
    expect(role).toBe("caregiver");
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

  it("clears professional session on launch when role is professional", async () => {
    await saveStoredTokens(
      { accessToken: "pro-access", refreshToken: "pro-refresh" },
      "caregiver"
    );

    const cleared = await clearProfessionalSessionOnLaunch();
    expect(cleared).toBe(true);

    const tokens = await getStoredTokens();
    expect(tokens).toBeNull();
  });

  it("keeps parent session on launch", async () => {
    await saveStoredTokens(
      { accessToken: "parent-access", refreshToken: "parent-refresh" },
      "parent"
    );

    const cleared = await clearProfessionalSessionOnLaunch();
    expect(cleared).toBe(false);

    const tokens = await getStoredTokens();
    expect(tokens).not.toBeNull();
  });

  it("returns false if no role is stored on launch", async () => {
    const cleared = await clearProfessionalSessionOnLaunch();
    expect(cleared).toBe(false);
  });
});
