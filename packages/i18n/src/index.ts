import commonFr from "../locales/fr/common.json";
import authFr from "../locales/fr/auth.json";
import nutritionFr from "../locales/fr/nutrition.json";
import caregiverFr from "../locales/fr/caregiver.json";
import adminFr from "../locales/fr/admin.json";
import notificationsFr from "../locales/fr/notifications.json";
import errorsFr from "../locales/fr/errors.json";
import medicalFr from "../locales/fr/medical.json";
import mobileFr from "../locales/fr/mobile.json";

import commonEn from "../locales/en/common.json";
import authEn from "../locales/en/auth.json";
import nutritionEn from "../locales/en/nutrition.json";
import caregiverEn from "../locales/en/caregiver.json";
import adminEn from "../locales/en/admin.json";
import notificationsEn from "../locales/en/notifications.json";
import errorsEn from "../locales/en/errors.json";
import medicalEn from "../locales/en/medical.json";
import mobileEn from "../locales/en/mobile.json";

import type { SupportedLocale, I18nNamespace, FrResources } from "./types";

export * from "./types";

export const SUPPORTED_LOCALES: readonly SupportedLocale[] = ["fr", "en"] as const;

export const DEFAULT_LOCALE: SupportedLocale = "fr";

export const LOCALE_STORAGE_KEY = "tsotsa.locale";

export const I18N_NAMESPACES: readonly I18nNamespace[] = [
  "common",
  "auth",
  "nutrition",
  "caregiver",
  "admin",
  "notifications",
  "errors",
  "medical",
  "mobile",
] as const;

export const resources: Record<SupportedLocale, FrResources> = {
  fr: {
    common: commonFr,
    auth: authFr,
    nutrition: nutritionFr,
    caregiver: caregiverFr,
    admin: adminFr,
    notifications: notificationsFr,
    errors: errorsFr,
    medical: medicalFr,
    mobile: mobileFr,
  },
  en: {
    common: commonEn as typeof commonFr,
    auth: authEn as typeof authFr,
    nutrition: nutritionEn as typeof nutritionFr,
    caregiver: caregiverEn as typeof caregiverFr,
    admin: adminEn as typeof adminFr,
    notifications: notificationsEn as typeof notificationsFr,
    errors: errorsEn as typeof errorsFr,
    medical: medicalEn as typeof medicalFr,
    mobile: mobileEn as typeof mobileFr,
  },
};

export const I18N_RESOURCES = resources;

export function isSupportedLocale(value: unknown): value is SupportedLocale {
  return typeof value === "string" && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

export function normalizeLocale(rawLocale: string | null | undefined): SupportedLocale | null {
  if (!rawLocale || typeof rawLocale !== "string") {
    return null;
  }
  const normalized = rawLocale.trim().toLowerCase().split(/[-_]/)[0];
  return isSupportedLocale(normalized) ? normalized : null;
}

function getIntlLocaleTag(locale: SupportedLocale): string {
  return locale === "en" ? "en-US" : "fr-FR";
}

function parseDateInput(date: Date | string | number): Date {
  if (date instanceof Date) {
    return date;
  }
  if (typeof date === "number") {
    return new Date(date);
  }
  const trimmed = date.trim();
  const isIsoDateTimeWithoutZone =
    /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(trimmed);
  if (isIsoDateTimeWithoutZone) {
    return new Date(`${trimmed.replace(" ", "T")}Z`);
  }
  return new Date(trimmed);
}

export function formatNumber(
  value: number,
  locale: SupportedLocale = DEFAULT_LOCALE,
  options?: Intl.NumberFormatOptions
): string {
  const tag = getIntlLocaleTag(locale);
  return new Intl.NumberFormat(tag, options).format(value);
}

export function formatDate(
  date: Date | string | number,
  locale: SupportedLocale = DEFAULT_LOCALE,
  options?: Intl.DateTimeFormatOptions
): string {
  const tag = getIntlLocaleTag(locale);
  const parsed = parseDateInput(date);
  const defaultOptions: Intl.DateTimeFormatOptions =
    locale === "en"
      ? { month: "numeric", day: "numeric", year: "numeric" }
      : { day: "2-digit", month: "2-digit", year: "numeric" };
  return new Intl.DateTimeFormat(tag, options ?? defaultOptions).format(parsed);
}

export function formatDateTime(
  date: Date | string | number,
  locale: SupportedLocale = DEFAULT_LOCALE,
  options?: Intl.DateTimeFormatOptions
): string {
  const tag = getIntlLocaleTag(locale);
  const parsed = parseDateInput(date);
  const defaultOptions: Intl.DateTimeFormatOptions = {
    dateStyle: "short",
    timeStyle: "short",
  };
  return new Intl.DateTimeFormat(tag, options ?? defaultOptions).format(parsed);
}

