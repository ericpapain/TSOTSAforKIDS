import type commonFr from "../locales/fr/common.json";
import type authFr from "../locales/fr/auth.json";
import type nutritionFr from "../locales/fr/nutrition.json";
import type caregiverFr from "../locales/fr/caregiver.json";
import type adminFr from "../locales/fr/admin.json";
import type notificationsFr from "../locales/fr/notifications.json";
import type errorsFr from "../locales/fr/errors.json";
import type medicalFr from "../locales/fr/medical.json";
import type mobileFr from "../locales/fr/mobile.json";

export type SupportedLocale = "fr" | "en";

export type I18nNamespace =
  | "common"
  | "auth"
  | "nutrition"
  | "caregiver"
  | "admin"
  | "notifications"
  | "errors"
  | "medical"
  | "mobile";

export type FrResources = {
  common: typeof commonFr;
  auth: typeof authFr;
  nutrition: typeof nutritionFr;
  caregiver: typeof caregiverFr;
  admin: typeof adminFr;
  notifications: typeof notificationsFr;
  errors: typeof errorsFr;
  medical: typeof medicalFr;
  mobile: typeof mobileFr;
};

type StripPluralSuffix<K extends string> = K extends `${infer Base}_one`
  ? Base | K
  : K extends `${infer Base}_other`
    ? Base | K
    : K extends `${infer Base}_zero`
      ? Base | K
      : K;

export type NestedKeyOf<T> = keyof T extends never
  ? never
  : {
      [K in keyof T & string]: T[K] extends Record<string, unknown>
        ? `${K}.${NestedKeyOf<T[K]>}`
        : StripPluralSuffix<K>;
    }[keyof T & string];

export type NamespaceKeys<NS extends I18nNamespace = "common"> = NestedKeyOf<FrResources[NS]>;

export type CommonTranslationKey = NamespaceKeys<"common">;

export type NamespacedTranslationKey = {
  [NS in I18nNamespace]: NamespaceKeys<NS> extends never
    ? never
    : `${NS}:${NamespaceKeys<NS>}` | `${NS}.${NamespaceKeys<NS>}`;
}[I18nNamespace];

export type TranslationKey = CommonTranslationKey | NamespacedTranslationKey;
