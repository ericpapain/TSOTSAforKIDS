import React from "react";
import { useTranslation } from "react-i18next";
import { normalizeLocale, DEFAULT_LOCALE, type SupportedLocale } from "@tsotsa/i18n";
import { changeAppLanguage } from "../i18n/setup";

export interface LanguageSwitcherProps {
  testID?: string;
}

export function LanguageSwitcher({
  testID = "language-switcher",
}: LanguageSwitcherProps): React.JSX.Element {
  const { t, i18n } = useTranslation("common");
  const activeLocale: SupportedLocale =
    normalizeLocale(i18n.resolvedLanguage ?? i18n.language) ?? DEFAULT_LOCALE;

  const handleSelect = (locale: SupportedLocale) => {
    void changeAppLanguage(locale);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      const nextLocale: SupportedLocale = activeLocale === "fr" ? "en" : "fr";
      void changeAppLanguage(nextLocale);
    }
  };

  return (
    <div
      role="group"
      aria-label={t("language.switcherAria")}
      data-testid={testID}
      onKeyDown={handleKeyDown}
      className="inline-flex items-center rounded-[6px] border border-white/30 bg-black/15 px-1.5 py-0.5 text-13 leading-none"
    >
      <button
        type="button"
        data-testid="lang-btn-fr"
        aria-label={t("language.switchToFr")}
        aria-pressed={activeLocale === "fr"}
        onClick={() => handleSelect("fr")}
        className={`rounded-[4px] px-1.5 py-1 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
          activeLocale === "fr"
            ? "bg-white text-[#17302A] font-bold"
            : "text-white/80 hover:text-white font-normal"
        }`}
      >
        {t("language.fr")}
      </button>
      <span aria-hidden="true" className="px-1 text-white/40 select-none">
        {t("language.separator")}
      </span>
      <button
        type="button"
        data-testid="lang-btn-en"
        aria-label={t("language.switchToEn")}
        aria-pressed={activeLocale === "en"}
        onClick={() => handleSelect("en")}
        className={`rounded-[4px] px-1.5 py-1 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
          activeLocale === "en"
            ? "bg-white text-[#17302A] font-bold"
            : "text-white/80 hover:text-white font-normal"
        }`}
      >
        {t("language.en")}
      </button>
    </div>
  );
}

export default LanguageSwitcher;

