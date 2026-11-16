/**
 * i18next setup for TSOTSA Kids Mobile.
 * Implements strict language priority: profile > SecureStore > phone locale > 'fr'.
 */

import * as Localization from "expo-localization";
import * as SecureStore from "expo-secure-store";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import {
  DEFAULT_LOCALE,
  I18N_NAMESPACES,
  LOCALE_STORAGE_KEY,
  SUPPORTED_LOCALES,
  normalizeLocale,
  resources,
  type FrResources,
  type SupportedLocale,
} from "@tsotsa/i18n";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "mobile";
    resources: FrResources;
  }
}

export const PROFILE_STORAGE_KEY = "tsotsa_user_profile";

export type ResolveMobileLocaleOptions =
  | {
      profileLocale?: string | null;
      storedLocale?: string | null;
      deviceLocales?: readonly (string | { languageCode?: string | null })[] | null;
      phoneLocales?: readonly (string | { languageCode?: string | null })[] | null;
    }
  | SupportedLocale;

export function readDeviceLocale(
  candidateLocales?: readonly (string | { languageCode?: string | null })[] | null
): SupportedLocale | null {
  if (candidateLocales !== undefined) {
    if (Array.isArray(candidateLocales)) {
      for (const loc of candidateLocales) {
        const code = typeof loc === "string" ? loc : loc?.languageCode;
        const normalized = normalizeLocale(code);
        if (normalized) {
          return normalized;
        }
      }
      return null;
    }
    return normalizeLocale(candidateLocales as string | null);
  }

  try {
    const locales = Localization.getLocales ? Localization.getLocales() : [];
    if (Array.isArray(locales) && locales.length > 0) {
      for (const loc of locales) {
        const normalized = normalizeLocale(loc?.languageCode);
        if (normalized) {
          return normalized;
        }
      }
    }
    const single = (Localization as { locale?: string }).locale;
    return normalizeLocale(single);
  } catch {
    return null;
  }
}

export async function readStoredLocale(): Promise<SupportedLocale | null> {
  try {
    const raw = await SecureStore.getItemAsync(LOCALE_STORAGE_KEY);
    return normalizeLocale(raw);
  } catch {
    return null;
  }
}

export async function writeStoredLocale(locale: SupportedLocale): Promise<void> {
  try {
    await SecureStore.setItemAsync(LOCALE_STORAGE_KEY, locale);
  } catch {
    // Graceful error handling
  }
}

export async function readProfileLocale(): Promise<SupportedLocale | null> {
  try {
    const raw = await SecureStore.getItemAsync(PROFILE_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as { preferred_locale?: string | null };
    return normalizeLocale(parsed?.preferred_locale);
  } catch {
    return null;
  }
}

export async function writeProfileLocale(locale: SupportedLocale): Promise<void> {
  try {
    const raw = await SecureStore.getItemAsync(PROFILE_STORAGE_KEY);
    const existing = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    existing.preferred_locale = locale;
    await SecureStore.setItemAsync(PROFILE_STORAGE_KEY, JSON.stringify(existing));
  } catch {
    // Graceful error handling
  }
}

export function resolvePreferredLocaleSync(options?: ResolveMobileLocaleOptions): SupportedLocale {
  if (typeof options === "string") {
    return normalizeLocale(options) ?? DEFAULT_LOCALE;
  }

  const opts = options && typeof options === "object" ? options : undefined;

  if (opts && "profileLocale" in opts) {
    const fromProfile = normalizeLocale(opts.profileLocale);
    if (fromProfile) {
      return fromProfile;
    }
  }

  if (opts && "storedLocale" in opts) {
    const fromStorage = normalizeLocale(opts.storedLocale);
    if (fromStorage) {
      return fromStorage;
    }
  }

  const deviceCandidate = opts?.deviceLocales ?? opts?.phoneLocales;
  if (deviceCandidate !== undefined) {
    const fromDevice = readDeviceLocale(deviceCandidate);
    if (fromDevice) {
      return fromDevice;
    }
  } else {
    const fromDevice = readDeviceLocale();
    if (fromDevice) {
      return fromDevice;
    }
  }

  return DEFAULT_LOCALE;
}

export async function resolvePreferredLocale(
  options?: ResolveMobileLocaleOptions
): Promise<SupportedLocale> {
  if (typeof options === "string") {
    return normalizeLocale(options) ?? DEFAULT_LOCALE;
  }

  const opts = options && typeof options === "object" ? options : undefined;

  // 1. User profile preferred_locale
  const fromProfile =
    opts && "profileLocale" in opts
      ? normalizeLocale(opts.profileLocale)
      : await readProfileLocale();
  if (fromProfile) {
    return fromProfile;
  }

  // 2. Choice stored in SecureStore
  const fromStorage =
    opts && "storedLocale" in opts
      ? normalizeLocale(opts.storedLocale)
      : await readStoredLocale();
  if (fromStorage) {
    return fromStorage;
  }

  // 3. Phone language via expo-localization
  const deviceCandidate = opts?.deviceLocales ?? opts?.phoneLocales;
  const fromDevice =
    deviceCandidate !== undefined
      ? readDeviceLocale(deviceCandidate)
      : readDeviceLocale();
  if (fromDevice) {
    return fromDevice;
  }

  // 4. Default fallback: fr
  return DEFAULT_LOCALE;
}

export async function initMobileI18n(
  options?: ResolveMobileLocaleOptions
): Promise<typeof i18n> {
  const initialLocale = await resolvePreferredLocale(options);

  if (!i18n.isInitialized) {
    await i18n.use(initReactI18next).init({
      resources: {
        fr: resources.fr,
        en: resources.en,
      },
      lng: initialLocale,
      fallbackLng: DEFAULT_LOCALE,
      supportedLngs: SUPPORTED_LOCALES,
      ns: Array.from(I18N_NAMESPACES),
      defaultNS: "mobile",
      fallbackNS: ["common", "notifications", "auth", "nutrition", "caregiver", "admin", "errors", "medical"],
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
    });
  } else if (i18n.language !== initialLocale) {
    await i18n.changeLanguage(initialLocale);
  }

  return i18n;
}

export const getStoredLocale = readStoredLocale;
export const storeLocaleChoice = writeStoredLocale;

export async function changeMobileLanguage(locale: SupportedLocale): Promise<SupportedLocale> {
  await i18n.changeLanguage(locale);
  await writeStoredLocale(locale);
  await writeProfileLocale(locale);
  return locale;
}

// Ensure synchronous fallback initialization if imported before initMobileI18n
if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      fr: resources.fr,
      en: resources.en,
    },
    lng: DEFAULT_LOCALE,
    fallbackLng: DEFAULT_LOCALE,
    supportedLngs: SUPPORTED_LOCALES,
    ns: Array.from(I18N_NAMESPACES),
    defaultNS: "mobile",
    fallbackNS: ["common", "notifications", "auth", "nutrition", "caregiver", "admin", "errors", "medical"],
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });
}

export { i18n };
export default i18n;
