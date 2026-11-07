/* eslint-env jest */
declare const global: { fetch: unknown };

import {
  listProducts,
  getProduct,
  getProductEquivalents,
  getFoodDetail,
  createCustomProduct,
  getProductPrice,
  getUserPreferredRegion,
  buildEquivalentsQuery,
} from "../productsService";

jest.mock("../../../api/storage", () => ({
  getStoredTokens: jest.fn().mockResolvedValue({
    accessToken: "test-access-token",
    refreshToken: "test-refresh-token",
  }),
}));

describe("productsService", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  describe("buildEquivalentsQuery", () => {
    it("returns empty string when no options provided", () => {
      expect(buildEquivalentsQuery()).toBe("");
    });

    it("serializes nutrients, region, and strict flags", () => {
      const q = buildEquivalentsQuery({
        nutrients: ["Protéines", "Fer"],
        region: "Ouest",
        strict: true,
        thresholdPct: 15,
      });
      expect(q).toContain("nutrients=Prot%C3%A9ines%2CFer");
      expect(q).toContain("region=Ouest");
      expect(q).toContain("strict=true");
      expect(q).toContain("threshold_pct=15");
    });
  });

  describe("listProducts", () => {
    it("fetches list of products successfully", async () => {
      const mockList = [
        { id: "p1", name: "Plumpy'Nut", type: "reference", base: "100g", status: "validated" },
      ];
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockList,
      });

      const res = await listProducts();
      expect(res).toHaveLength(1);
      expect(res[0].name).toBe("Plumpy'Nut");
    });

    it("returns empty array on error", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ detail: "Server error" }),
      });

      const res = await listProducts();
      expect(res).toEqual([]);
    });
  });

  describe("getProduct", () => {
    it("fetches single product detail", async () => {
      const mockProduct = {
        id: "p1",
        name: "Plumpy'Nut",
        type: "reference",
        base: "100g",
        status: "validated",
        nutrients: [{ nutrient_code: "energy", nutrient_name: "Énergie", value: 540, value_min: 520, unit: "kcal", unit_code: "kcal" }],
        essential_nutrients: ["energy"],
      };
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockProduct,
      });

      const res = await getProduct("p1");
      expect(res?.name).toBe("Plumpy'Nut");
      expect(res?.nutrients).toHaveLength(1);
    });
  });

  describe("getProductEquivalents", () => {
    it("fetches equivalents with ranking", async () => {
      const mockEquiv = {
        product_id: "p1",
        product_name: "Plumpy'Nut",
        essential_nutrients: ["prot"],
        threshold_pct: 10,
        strict_region: false,
        equivalents: [
          {
            food_id: "f1",
            food_name: "Graines de courge",
            m: 3,
            e: 0,
            distance: 0.1,
            is_in_target_region: true,
            common_nutrients: ["prot"],
            extra_nutrients: [],
            teneurs: {},
            regions: ["Ouest"],
          },
        ],
      };
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockEquiv,
      });

      const res = await getProductEquivalents("p1", { region: "Ouest" });
      expect(res?.equivalents).toHaveLength(1);
      expect(res?.equivalents[0].food_name).toBe("Graines de courge");
    });
  });

  describe("getFoodDetail", () => {
    it("fetches food detail with nutrients and sources", async () => {
      const mockFood = {
        id: "f1",
        name: "Arachide",
        kind: "local",
        state: "raw",
        status: "validated",
        version: 1,
        is_current: true,
        created_at: "2026-01-01T00:00:00Z",
        local_names: [],
        regions: [],
        nutrients: [],
      };
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockFood,
      });

      const res = await getFoodDetail("f1");
      expect(res?.name).toBe("Arachide");
    });
  });

  describe("createCustomProduct", () => {
    it("posts custom product and returns result", async () => {
      const payload = {
        name: "Ma Farine",
        base: "100g",
        nutrients: [{ nutrient: "Protéines", value: 15, unit: "g" }],
      };
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: "cp-123", ...payload, type: "custom", status: "private" }),
      });

      const res = await createCustomProduct(payload);
      expect(res.data?.id).toBe("cp-123");
    });
  });

  describe("getProductPrice", () => {
    it("returns formatted price when available", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ amount: 450, currency: "FCFA" }),
      });

      const res = await getProductPrice("p1", "Ouest");
      expect(res?.display).toBe("450 FCFA");
    });

    it("returns null if no price recorded", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      const res = await getProductPrice("p1", "Ouest");
      expect(res).toBeNull();
    });
  });

  describe("getUserPreferredRegion", () => {
    it("returns user region or default Ouest", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ region_name: "Centre" }),
      });

      const res = await getUserPreferredRegion();
      expect(res).toBe("Centre");
    });
  });
});

