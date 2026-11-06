import { describe, expect, it, vi } from "vitest";
import { createTsotsaClient, type TokenPair } from "../src/client.js";

describe("TsotsaApiClient - Initialisation et configuration", () => {
  it("normalise la baseUrl par défaut et supprime le slash final", () => {
    const defaultClient = createTsotsaClient();
    expect(defaultClient.baseUrl).toBe("http://localhost:8000");

    const customClient = createTsotsaClient({ baseUrl: "https://api.tsotsa-for-kids.com/" });
    expect(customClient.baseUrl).toBe("https://api.tsotsa-for-kids.com");
  });

  it("gère l'état initial des jetons et leurs mutations", () => {
    const client = createTsotsaClient({
      tokens: { accessToken: "initial-access", refreshToken: "initial-refresh" },
    });

    expect(client.getAccessToken()).toBe("initial-access");
    expect(client.getRefreshToken()).toBe("initial-refresh");
    expect(client.getTokens()).toEqual({
      accessToken: "initial-access",
      refreshToken: "initial-refresh",
    });

    client.setAccessToken("updated-access");
    expect(client.getAccessToken()).toBe("updated-access");

    client.setRefreshToken("updated-refresh");
    expect(client.getRefreshToken()).toBe("updated-refresh");

    client.clearTokens();
    expect(client.getTokens()).toBeNull();
    expect(client.getAccessToken()).toBeNull();
    expect(client.getRefreshToken()).toBeNull();
  });
});

describe("TsotsaApiClient - Injection du jeton Authorization", () => {
  it("injecte automatiquement l'en-tête Authorization quand un jeton est présent", async () => {
    let capturedHeaders: Headers | undefined;
    const testFetch: typeof globalThis.fetch = async (_input, init) => {
      capturedHeaders = new Headers(init?.headers);
      return new Response(JSON.stringify({ status: "ok" }), { status: 200 });
    };

    const client = createTsotsaClient({
      baseUrl: "https://api.tsotsa.test",
      tokens: { accessToken: "secret-token-xyz" },
      fetch: testFetch,
    });

    await client.client.GET("/health");

    expect(capturedHeaders?.get("Authorization")).toBe("Bearer secret-token-xyz");
  });

  it("n'ajoute aucun en-tête Authorization si aucun jeton n'est configuré", async () => {
    let capturedHeaders: Headers | undefined;
    const testFetch: typeof globalThis.fetch = async (_input, init) => {
      capturedHeaders = new Headers(init?.headers);
      return new Response(JSON.stringify({ status: "ok" }), { status: 200 });
    };

    const client = createTsotsaClient({
      baseUrl: "https://api.tsotsa.test",
      fetch: testFetch,
    });

    await client.client.GET("/health");

    expect(capturedHeaders?.has("Authorization")).toBe(false);
  });
});

describe("TsotsaApiClient - Rafraîchissement automatique sur HTTP 401", () => {
  it("intercepte 401, rafraîchit le jeton et rejoue la requête originale avec succès", async () => {
    let callCount = 0;
    const refreshedTokens: TokenPair[] = [];

    const testFetch: typeof globalThis.fetch = async (input, init) => {
      const url = String(input);
      callCount += 1;

      if (url.includes("/v1/auth/refresh")) {
        const body = JSON.parse(String(init?.body)) as { refresh_token: string };
        expect(body.refresh_token).toBe("old-refresh-token");
        return new Response(
          JSON.stringify({
            access_token: "new-access-token",
            refresh_token: "new-refresh-token",
            token_type: "bearer",
            expires_in: 900,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      const headers = new Headers(init?.headers);
      const auth = headers.get("Authorization");

      if (auth === "Bearer old-access-token") {
        return new Response(JSON.stringify({ error: "expired" }), { status: 401 });
      }

      if (auth === "Bearer new-access-token") {
        return new Response(JSON.stringify({ data: "success-after-refresh" }), { status: 200 });
      }

      return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
    };

    const client = createTsotsaClient({
      baseUrl: "https://api.tsotsa.test",
      tokens: { accessToken: "old-access-token", refreshToken: "old-refresh-token" },
      fetch: testFetch,
      onTokenRefreshed: (tokens) => {
        refreshedTokens.push(tokens);
      },
    });

    const res = await client.client.GET("/health");

    expect(res.response.status).toBe(200);
    expect(res.data).toEqual({ data: "success-after-refresh" });
    expect(client.getAccessToken()).toBe("new-access-token");
    expect(client.getRefreshToken()).toBe("new-refresh-token");
    expect(refreshedTokens).toEqual([
      { accessToken: "new-access-token", refreshToken: "new-refresh-token" },
    ]);
    expect(callCount).toBe(3); // 1: initial 401, 2: refresh 200, 3: retry 200
  });

  it("purge les jetons et appelle onAuthError si le rafraîchissement échoue", async () => {
    const authErrors: Error[] = [];
    const testFetch: typeof globalThis.fetch = async (input) => {
      const url = String(input);
      if (url.includes("/v1/auth/refresh")) {
        return new Response(JSON.stringify({ error: "revoked" }), { status: 401 });
      }
      return new Response(JSON.stringify({ error: "token_expired" }), { status: 401 });
    };

    const client = createTsotsaClient({
      baseUrl: "https://api.tsotsa.test",
      tokens: { accessToken: "bad-access", refreshToken: "bad-refresh" },
      fetch: testFetch,
      onAuthError: (err) => {
        authErrors.push(err);
      },
    });

    const res = await client.client.GET("/health");

    expect(res.response.status).toBe(401);
    expect(client.getTokens()).toBeNull();
    expect(authErrors.length).toBe(1);
    expect(authErrors[0].message).toContain("Échec du rafraîchissement");
  });

  it("déduplique les appels concurrents de rafraîchissement lors de 401 simultanés", async () => {
    let refreshCalls = 0;

    const testFetch: typeof globalThis.fetch = async (input, init) => {
      const url = String(input);

      if (url.includes("/v1/auth/refresh")) {
        refreshCalls += 1;
        // Simule un petit délai réseau
        await new Promise((r) => setTimeout(r, 15));
        return new Response(
          JSON.stringify({
            access_token: "single-refreshed-token",
            refresh_token: "single-refreshed-refresh",
            token_type: "bearer",
            expires_in: 900,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      const headers = new Headers(init?.headers);
      if (headers.get("Authorization") === "Bearer single-refreshed-token") {
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
    };

    const client = createTsotsaClient({
      baseUrl: "https://api.tsotsa.test",
      tokens: { accessToken: "expired-tok", refreshToken: "valid-ref" },
      fetch: testFetch,
    });

    const [res1, res2, res3] = await Promise.all([
      client.client.GET("/health"),
      client.client.GET("/health"),
      client.client.GET("/health"),
    ]);

    expect(res1.response.status).toBe(200);
    expect(res2.response.status).toBe(200);
    expect(res3.response.status).toBe(200);
    expect(refreshCalls).toBe(1);
  });

  it("ne tente pas de rafraîchissement si autoRefresh est désactivé", async () => {
    const fetchSpy = vi.fn(async () => new Response("unauthorized", { status: 401 }));

    const client = createTsotsaClient({
      baseUrl: "https://api.tsotsa.test",
      tokens: { accessToken: "exp", refreshToken: "ref" },
      autoRefresh: false,
      fetch: fetchSpy,
    });

    const res = await client.client.GET("/health");

    expect(res.response.status).toBe(401);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});

