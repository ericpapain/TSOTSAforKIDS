import React from "react";
import { useTranslation } from "react-i18next";
import { normalizeLocale, DEFAULT_LOCALE, type SupportedLocale } from "@tsotsa/i18n";
import { changeAppLanguage } from "../i18n/setup";

export interface LanguageSwitcherProps {
  testID?: string;
}

function FrenchFlag(): React.JSX.Element {
  return (
    <svg
      width="16"
      height="12"
      viewBox="0 0 16 12"
      className="shrink-0 rounded-[2px] shadow-xs overflow-hidden"
      aria-hidden="true"
    >
      <rect width="5.33" height="12" fill="#002395" />
      <rect x="5.33" width="5.34" height="12" fill="#FFFFFF" />
      <rect x="10.67" width="5.33" height="12" fill="#ED2939" />
    </svg>
  );
}

function BritishFlag(): React.JSX.Element {
  return (
    <svg
      width="16"
      height="12"
      viewBox="0 0 60 40"
      className="shrink-0 rounded-[2px] shadow-xs overflow-hidden"
      aria-hidden="true"
    >
      <rect width="60" height="40" fill="#012169" />
      <path d="M0,0 L60,40 M60,0 L0,40" stroke="#FFFFFF" strokeWidth="8" />
      <path d="M0,0 L60,40 M60,0 L0,40" stroke="#C8102E" strokeWidth="4" />
      <path d="M30,0 v40 M0,20 h60" stroke="#FFFFFF" strokeWidth="12" />
      <path d="M30,0 v40 M0,20 h60" stroke="#C8102E" strokeWidth="6" />
    </svg>
  );
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
      className="inline-flex items-center rounded-[6px] border border-white/30 bg-black/20 p-[2px] text-12 leading-none shrink-0 select-none shadow-inner"
    >
      <button
        type="button"
        data-testid="lang-btn-fr"
        aria-label={t("language.switchToFr")}
        aria-pressed={activeLocale === "fr"}
        onClick={() => handleSelect("fr")}
        className={`w-[54px] h-[26px] inline-flex items-center justify-center gap-1.5 rounded-[4px] text-12 font-bold transition-colors cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white shrink-0 ${
          activeLocale === "fr"
            ? "bg-white text-[#17302A] shadow-xs cursor-default"
            : "text-white/85 hover:text-white hover:bg-white/10"
        }`}
      >
        <FrenchFlag />
        <span>{t("language.fr")}</span>
      </button>
      <span aria-hidden="true" className="px-0.5 text-white/40 select-none text-11">
        {t("language.separator")}
      </span>
      <button
        type="button"
        data-testid="lang-btn-en"
        aria-label={t("language.switchToEn")}
        aria-pressed={activeLocale === "en"}
        onClick={() => handleSelect("en")}
        className={`w-[54px] h-[26px] inline-flex items-center justify-center gap-1.5 rounded-[4px] text-12 font-bold transition-colors cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white shrink-0 ${
          activeLocale === "en"
            ? "bg-white text-[#17302A] shadow-xs cursor-default"
            : "text-white/85 hover:text-white hover:bg-white/10"
        }`}
      >
        <BritishFlag />
        <span>{t("language.en")}</span>
      </button>
    </div>
  );
}

export default LanguageSwitcher;
