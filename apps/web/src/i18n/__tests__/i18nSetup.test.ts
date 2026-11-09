import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  LOCALE_STORAGE_KEY,
  formatNumber,
  formatDate,
  formatDateTime,
} from "@tsotsa/i18n";
import i18n, {
  resolvePreferredLocale,
  initI18n,
  changeAppLanguage,
  readStoredLocale,
  writeStoredLocale,
} from "../setup";

describe("Web i18n setup, priority order & Intl formatters", () => {
  beforeEach(async () => {
    window.localStorage.clear();
    await changeAppLanguage("fr", { persist: false });
    window.localStorage.clear();
  });

  it("resolves locale following priority: profile > localStorage > navigator > fr", () => {
    // 1. Profile preferred_locale wins over localStorage and navigator
    expect(
      resolvePreferredLocale({
        profileLocale: "en",
        storedLocale: "fr",
        navigatorLanguage: "fr-FR",
      })
    ).toBe("en");

    // 2. localStorage ("tsotsa.locale") wins over navigator when profile is absent
    expect(
      resolvePreferredLocale({
        profileLocale: null,
        storedLocale: "en",
        navigatorLanguage: "fr-FR",
      })
    ).toBe("en");

    // 3. Browser navigator language wins when profile and localStorage are absent (if fr or en)
    expect(
      resolvePreferredLocale({
        profileLocale: null,
        storedLocale: null,
        navigatorLanguage: "en-US",
      })
    ).toBe("en");
    expect(
      resolvePreferredLocale({
        profileLocale: null,
        storedLocale: null,
        navigatorLanguage: "fr-CM",
      })
    ).toBe("fr");

    // 4. Fallback to "fr" when navigator language is neither fr nor en
    expect(
      resolvePreferredLocale({
        profileLocale: null,
        storedLocale: null,
        navigatorLanguage: "es-ES",
      })
    ).toBe("fr");
    expect(
      resolvePreferredLocale({
        profileLocale: null,
        storedLocale: null,
        navigatorLanguage: null,
      })
    ).toBe("fr");
  });

  it("reads profile preferred_locale and tsotsa.locale from browser localStorage", () => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, "fr");
    window.localStorage.setItem(
      "tsotsa.profile",
      JSON.stringify({ preferred_locale: "en" })
    );
    expect(resolvePreferredLocale()).toBe("en");

    window.localStorage.removeItem("tsotsa.profile");
    expect(resolvePreferredLocale()).toBe("fr");
  });

  it("handles localStorage access errors safely in try/catch", () => {
    const getItemSpy = vi
      .spyOn(Storage.prototype, "getItem")
      .mockImplementation(() => {
        throw new Error("Storage blocked");
      });
    const setItemSpy = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("Storage blocked");
      });

    expect(readStoredLocale()).toBeNull();
    expect(() => writeStoredLocale("en")).not.toThrow();

    getItemSpy.mockRestore();
    setItemSpy.mockRestore();
  });

  it("updates <html lang='...'> and localStorage on language change", async () => {
    await initI18n({ profileLocale: null, storedLocale: "fr", navigatorLanguage: "fr" });
    expect(document.documentElement.lang).toBe("fr");
    expect(i18n.language).toBe("fr");

    await changeAppLanguage("en");
    expect(document.documentElement.lang).toBe("en");
    expect(window.localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("en");
    expect(i18n.t("header.space.caregiver")).toBe("Caregiver portal");

    await changeAppLanguage("fr");
    expect(document.documentElement.lang).toBe("fr");
    expect(window.localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("fr");
    expect(i18n.t("header.space.caregiver")).toBe("Espace soignant");
  });

  it("formats numbers, dates, and date-times in fr and en via Intl", () => {
    const numFr = formatNumber(1234.5, "fr").replace(/[\u202f\u00a0]/g, " ");
    const numEn = formatNumber(1234.5, "en");
    expect(numFr).toBe("1 234,5");
    expect(numEn).toBe("1,234.5");

    const sampleDate = new Date(Date.UTC(2026, 10, 7, 12, 0, 0));
    expect(
      formatDate(sampleDate, "fr", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "UTC",
      })
    ).toBe("07/11/2026");
    expect(
      formatDate(sampleDate, "en", {
        month: "numeric",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      })
    ).toBe("11/7/2026");

    const dtFr = formatDateTime("2026-11-07T09:15:00Z", "fr", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    });
    expect(dtFr).toContain("07/11/2026");
    expect(dtFr).toContain("09:15");
  });
});

