import {
  authenticateWithGoogle,
  loginWithEmail,
  logout,
  registerWithEmail,
  requestPhoneOtp,
  verifyPhoneOtp,
} from "../authService";
import * as storage from "../../../api/storage";

describe("authService", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("requestPhoneOtp handles success", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: "OTP envoyé", expires_in: 300 }),
    } as unknown as Response);

    const res = await requestPhoneOtp("+237 670 00 00 00");
    expect(res.success).toBe(true);
    expect(res.expiresIn).toBe(300);
  });

  it("requestPhoneOtp handles API error", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ detail: "Numéro de téléphone invalide." }),
    } as unknown as Response);

    const res = await requestPhoneOtp("invalid");
    expect(res.success).toBe(false);
    expect(res.error).toBe("Numéro de téléphone invalide.");
  });

  it("verifyPhoneOtp handles success and persists token", async () => {
    const saveSpy = jest.spyOn(storage, "saveStoredTokens").mockResolvedValue();

    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: "test_access_jwt",
        refresh_token: "test_refresh_jwt",
        role: "user",
      }),
    } as unknown as Response);

    const res = await verifyPhoneOtp("+237670000000", "123456");
    expect(res.success).toBe(true);
    expect(res.role).toBe("user");
    expect(saveSpy).toHaveBeenCalledWith(
      { accessToken: "test_access_jwt", refreshToken: "test_refresh_jwt" },
      "user"
    );
  });

  it("loginWithEmail handles success", async () => {
    jest.spyOn(storage, "saveStoredTokens").mockResolvedValue();

    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: "email_jwt_token",
        role: "caregiver",
      }),
    } as unknown as Response);

    const res = await loginWithEmail("soignant@hopital.cm", "Password123!");
    expect(res.success).toBe(true);
    expect(res.role).toBe("caregiver");
  });

  it("loginWithEmail handles network error", async () => {
    globalThis.fetch = jest.fn().mockRejectedValue(new Error("Network request failed"));

    const res = await loginWithEmail("test@demo.com", "Password123!");
    expect(res.success).toBe(false);
    expect(res.error).toContain("Erreur réseau");
  });

  it("registerWithEmail handles success", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: "Compte créé." }),
    } as unknown as Response);

    const res = await registerWithEmail("nouveau@demo.com", "Password123!");
    expect(res.success).toBe(true);
    expect(res.message).toBe("Compte créé.");
  });

  it("authenticateWithGoogle handles success", async () => {
    jest.spyOn(storage, "saveStoredTokens").mockResolvedValue();

    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: "google_jwt_token",
        role: "user",
      }),
    } as unknown as Response);

    const res = await authenticateWithGoogle("google-token");
    expect(res.success).toBe(true);
  });

  it("logout clears stored tokens", async () => {
    const clearSpy = jest.spyOn(storage, "clearStoredTokens").mockResolvedValue();
    await logout();
    expect(clearSpy).toHaveBeenCalled();
  });
});

