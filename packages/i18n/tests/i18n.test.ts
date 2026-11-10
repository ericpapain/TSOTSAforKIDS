import { describe, it, expect } from "vitest";
import {
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  I18N_NAMESPACES,
  resources,
  isSupportedLocale,
  normalizeLocale,
  formatNumber,
  formatDate,
  formatDateTime,
  type TranslationKey,
} from "../src/index";

describe("@tsotsa/i18n core & Intl formatters", () => {
  it("exports supported locales ['fr', 'en'] and default locale 'fr'", () => {
    expect(SUPPORTED_LOCALES).toEqual(["fr", "en"]);
    expect(DEFAULT_LOCALE).toBe("fr");
    expect(I18N_NAMESPACES).toEqual([
      "common",
      "auth",
      "nutrition",
      "caregiver",
      "admin",
      "notifications",
      "errors",
      "medical",
      "mobile",
    ]);
  });

  it("exports resources for both fr and en across all namespaces", () => {
    for (const ns of I18N_NAMESPACES) {
      expect(resources.fr[ns]).toBeDefined();
      expect(resources.en[ns]).toBeDefined();
    }
    expect(resources.fr.common.header.space.caregiver).toBe("Espace soignant");
    expect(resources.en.common.header.space.caregiver).toBe("Caregiver portal");
  });

  it("enforces compile-time key typing from fr reference catalogs", () => {
    const validKey1: TranslationKey = "header.space.user";
    const validKey2: TranslationKey = "language.switcherAria";
    const validPluralBase: TranslationKey = "header.notificationsUnread";
    expect(validKey1).toBe("header.space.user");
    expect(validKey2).toBe("language.switcherAria");
    expect(validPluralBase).toBe("header.notificationsUnread");
  });

  it("validates and normalizes locale codes", () => {
    expect(isSupportedLocale("fr")).toBe(true);
    expect(isSupportedLocale("en")).toBe(true);
    expect(isSupportedLocale("de")).toBe(false);

    expect(normalizeLocale("fr-FR")).toBe("fr");
    expect(normalizeLocale("en_US")).toBe("en");
    expect(normalizeLocale("EN-GB")).toBe("en");
    expect(normalizeLocale("es-ES")).toBeNull();
    expect(normalizeLocale(null)).toBeNull();
  });

  it("formats numbers in fr ('1 234,5') and en ('1,234.5')", () => {
    const frFormatted = formatNumber(1234.5, "fr").replace(/[\u202f\u00a0]/g, " ");
    const enFormatted = formatNumber(1234.5, "en");

    expect(frFormatted).toBe("1 234,5");
    expect(enFormatted).toBe("1,234.5");
  });

  it("formats dates in fr ('07/11/2026') and en ('11/7/2026')", () => {
    const sampleUtc = new Date(Date.UTC(2026, 10, 7, 12, 0, 0));

    expect(formatDate(sampleUtc, "fr", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" })).toBe(
      "07/11/2026"
    );
    expect(formatDate(sampleUtc, "en", { month: "numeric", day: "numeric", year: "numeric", timeZone: "UTC" })).toBe(
      "11/7/2026"
    );
  });

  it("formats date-times from UTC ISO strings", () => {
    const frDt = formatDateTime("2026-11-07T14:30:00", "fr", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    });
    const enDt = formatDateTime("2026-11-07T14:30:00Z", "en", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: false,
      timeZone: "UTC",
    });

    expect(frDt).toContain("07/11/2026");
    expect(frDt).toContain("14:30");
    expect(enDt).toContain("11/7/2026");
    expect(enDt).toContain("14:30");
  });
});

