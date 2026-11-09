import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import {
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  I18N_NAMESPACES,
  resources,
  normalizeLocale,
  type SupportedLocale,
  type FrResources,
} from "@tsotsa/i18n";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "common";
    resources: FrResources;
  }
}

export interface ResolveLocaleOptions {
  profileLocale?: string | null;
  storedLocale?: string | null;
  navigatorLanguage?: string | readonly string[] | null;
}

const PROFILE_STORAGE_KEY = "tsotsa.profile";

export function readStoredLocale(storageKey: string = LOCALE_STORAGE_KEY): SupportedLocale | null {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return null;
    }
    const raw = window.localStorage.getItem(storageKey);
    return normalizeLocale(raw);
  } catch {
    return null;
  }
}

export function writeStoredLocale(
  locale: SupportedLocale,
  storageKey: string = LOCALE_STORAGE_KEY
): void {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(storageKey, locale);
    }
  } catch {
    // Ignore storage write errors (private mode / quota exceeded)
  }
}

export function readProfileLocale(): SupportedLocale | null {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return null;
    }
    const rawProfile = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!rawProfile) {
      return null;
    }
    const parsed = JSON.parse(rawProfile) as { preferred_locale?: string | null };
    return normalizeLocale(parsed?.preferred_locale);
  } catch {
    return null;
  }
}

export function readNavigatorLocale(
  navInput?: string | readonly string[] | null
): SupportedLocale | null {
  if (navInput !== undefined) {
    if (Array.isArray(navInput)) {
      for (const candidate of navInput) {
        const match = normalizeLocale(candidate);
        if (match) {
          return match;
        }
      }
      return null;
    }
    return normalizeLocale(navInput as string | null);
  }

  try {
    if (typeof navigator === "undefined") {
      return null;
    }
    if (Array.isArray(navigator.languages) && navigator.languages.length > 0) {
      for (const lang of navigator.languages) {
        const match = normalizeLocale(lang);
        if (match) {
          return match;
        }
      }
    }
    return normalizeLocale(navigator.language);
  } catch {
    return null;
  }
}

export function resolvePreferredLocale(options?: ResolveLocaleOptions): SupportedLocale {
  // 1. User profile preferred_locale
  const fromProfile =
    options && "profileLocale" in options
      ? normalizeLocale(options.profileLocale)
      : readProfileLocale();
  if (fromProfile) {
    return fromProfile;
  }

  // 2. Browser localStorage ("tsotsa.locale")
  const fromStorage =
    options && "storedLocale" in options
      ? normalizeLocale(options.storedLocale)
      : readStoredLocale();
  if (fromStorage) {
    return fromStorage;
  }

  // 3. Browser language if fr or en
  const fromNavigator =
    options && "navigatorLanguage" in options
      ? readNavigatorLocale(options.navigatorLanguage)
      : readNavigatorLocale();
  if (fromNavigator) {
    return fromNavigator;
  }

  // 4. Default fallback: fr
  return DEFAULT_LOCALE;
}

export function syncHtmlLang(locale: SupportedLocale): void {
  if (typeof document !== "undefined" && document.documentElement) {
    document.documentElement.lang = locale;
  }
}

const languageDetector = new LanguageDetector();
languageDetector.addDetector({
  name: "tsotsaPriority",
  lookup() {
    return resolvePreferredLocale();
  },
  cacheUserLanguage(lng: string) {
    const normalized = normalizeLocale(lng);
    if (normalized) {
      writeStoredLocale(normalized);
    }
  },
});

export async function initI18n(options?: ResolveLocaleOptions): Promise<typeof i18n> {
  const initialLocale = resolvePreferredLocale(options);

  if (!i18n.isInitialized) {
    i18n.on("languageChanged", (lng: string) => {
      const normalized = normalizeLocale(lng) ?? DEFAULT_LOCALE;
      syncHtmlLang(normalized);
    });

    await i18n
      .use(languageDetector)
      .use(initReactI18next)
      .init({
        resources,
        lng: initialLocale,
        fallbackLng: DEFAULT_LOCALE,
        supportedLngs: [...SUPPORTED_LOCALES],
        ns: [...I18N_NAMESPACES],
        defaultNS: "common",
        detection: {
          order: ["tsotsaPriority", "localStorage", "navigator"],
          lookupLocalStorage: LOCALE_STORAGE_KEY,
          caches: [],
        },
        interpolation: {
          escapeValue: false,
        },
      });
  } else {
    await i18n.changeLanguage(initialLocale);
  }

  syncHtmlLang(initialLocale);
  return i18n;
}

export async function changeAppLanguage(
  locale: SupportedLocale,
  options?: { persist?: boolean }
): Promise<SupportedLocale> {
  const target = normalizeLocale(locale) ?? DEFAULT_LOCALE;
  if (options?.persist !== false) {
    writeStoredLocale(target);
  }
  await i18n.changeLanguage(target);
  syncHtmlLang(target);
  return target;
}

void initI18n();

export default i18n;

