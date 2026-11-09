/* eslint-env jest */
declare const global: { fetch: unknown };

import {
  calculateAgeLabel,
  fetchModules,
  fetchFamilyMembers,
  createFamilyMember,
  getFamilyMember,
  getConsentStatus,
  submitConsent,
} from "../personsService";

// Mock storage
jest.mock("../../../api/storage", () => ({
  getStoredTokens: jest.fn().mockResolvedValue({
    accessToken: "test-access-token",
    refreshToken: "test-refresh-token",
  }),
}));

describe("personsService", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  describe("calculateAgeLabel", () => {
    const getIsoDaysAgo = (days: number) => {
      const d = new Date();
      d.setHours(12, 0, 0, 0);
      d.setDate(d.getDate() - days);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    };

    it("returns correct label for infant under 1 month", () => {
      expect(calculateAgeLabel(getIsoDaysAgo(15))).toBe("15 jours");
    });

    it("returns correct label for infant in months", () => {
      const today = new Date();
      today.setHours(12, 0, 0, 0);
      const birth = new Date(today.getFullYear(), today.getMonth() - 6, today.getDate());
      const iso = `${birth.getFullYear()}-${String(birth.getMonth() + 1).padStart(2, "0")}-${String(birth.getDate()).padStart(2, "0")}`;
      expect(calculateAgeLabel(iso)).toMatch(/6 mois/);
    });

    it("returns correct label for 1 year and months", () => {
      const today = new Date();
      today.setHours(12, 0, 0, 0);
      const birth = new Date(today.getFullYear() - 1, today.getMonth() - 11, today.getDate());
      const iso = `${birth.getFullYear()}-${String(birth.getMonth() + 1).padStart(2, "0")}-${String(birth.getDate()).padStart(2, "0")}`;
      expect(calculateAgeLabel(iso)).toBe("1 an 11 mois");
    });

    it("returns correct label for 2 years or older", () => {
      const today = new Date();
      today.setHours(12, 0, 0, 0);
      const birth = new Date(today.getFullYear() - 3, today.getMonth(), today.getDate());
      const iso = `${birth.getFullYear()}-${String(birth.getMonth() + 1).padStart(2, "0")}-${String(birth.getDate()).padStart(2, "0")}`;
      expect(calculateAgeLabel(iso)).toBe("3 ans");
    });

    it("returns adulte for 18 years or older", () => {
      expect(calculateAgeLabel("1990-01-01")).toBe("adulte");
    });

    it("handles invalid date gracefully", () => {
      expect(calculateAgeLabel("invalid-date")).toBe("");
    });
  });

  describe("fetchModules", () => {
    it("returns items from API when successful", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { id: "nutrition", name: "Nutrition", status: "active" },
          { id: "hta", name: "HTA", status: "soon" },
        ],
      });

      const modules = await fetchModules();
      expect(modules).toHaveLength(2);
      expect(modules[0].id).toBe("nutrition");
    });

    it("returns default fallback list when API fails", async () => {
      global.fetch = jest.fn().mockRejectedValueOnce(new Error("Network error"));
      const modules = await fetchModules();
      expect(modules).toHaveLength(3);
      expect(modules[0].id).toBe("nutrition");
      expect(modules[0].status).toBe("active");
    });
  });

  describe("fetchFamilyMembers", () => {
    it("returns members from API when successful", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { id: "p1", first_name: "Fatima", sex: "F", birth_date: "2024-12-12" },
        ],
      });

      const members = await fetchFamilyMembers();
      expect(members).toHaveLength(1);
      expect(members[0].first_name).toBe("Fatima");
    });

    it("returns fallback members when API returns empty or fails", async () => {
      global.fetch = jest.fn().mockRejectedValueOnce(new Error("API offline"));
      const members = await fetchFamilyMembers();
      expect(members.length).toBeGreaterThan(0);
      expect(members[0].first_name).toBe("Amina");
    });
  });

  describe("createFamilyMember", () => {
    it("posts payload to /v1/family/members and returns created person", async () => {
      const payload = {
        first_name: "Fidel",
        birth_date: "12/12/2024",
        sex: "M" as const,
        weight: "7,0",
      };

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "pers-fidel-uuid",
          first_name: "Fidel",
          birth_date: "2024-12-12",
          sex: "M",
        }),
      });

      const res = await createFamilyMember(payload);
      expect(res.data?.id).toBe("pers-fidel-uuid");
      expect(res.data?.first_name).toBe("Fidel");
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/v1/family/members"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            first_name: "Fidel",
            birth_date: "2024-12-12",
            sex: "M",
            relation: "child",
          }),
        })
      );
    });
  });

  describe("getFamilyMember", () => {
    it("returns member by id", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "pers-123",
          first_name: "Amina",
          sex: "F",
          birth_date: "2024-12-12",
        }),
      });

      const member = await getFamilyMember("pers-123");
      expect(member).toBeDefined();
      expect(member?.id).toBe("pers-123");
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/v1/family/members/pers-123"),
        expect.anything()
      );
    });

    it("returns null on failure", async () => {
      global.fetch = jest.fn().mockRejectedValueOnce(new Error("Not found"));
      const member = await getFamilyMember("pers-999");
      expect(member).toBeNull();
    });
  });

  describe("getConsentStatus and submitConsent", () => {
    it("getConsentStatus calls API", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ has_consent: true, consent_type: "consent_v1.0" }),
      });

      const res = await getConsentStatus("pers-123");
      expect(res?.has_consent).toBe(true);
    });

    it("submitConsent posts to /v1/persons/{id}/consent", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const success = await submitConsent("pers-123");
      expect(success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/v1/persons/pers-123/consent"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ legal_guardian: true }),
        })
      );
    });
  });
});
