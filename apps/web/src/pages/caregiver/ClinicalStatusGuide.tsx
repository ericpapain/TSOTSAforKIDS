import React from "react";
import { useTranslation } from "react-i18next";

export function ClinicalStatusGuide(): React.JSX.Element {
  const { t } = useTranslation("caregiver");

  return (
    <section
      data-testid="clinical-status-guide"
      aria-labelledby="clinical-status-guide-title"
      className="mt-8 rounded-card border border-border bg-white p-5 shadow-sm"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <svg
              className="h-5 w-5 text-care shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h2
              id="clinical-status-guide-title"
              className="text-16 font-bold text-text"
            >
              {t("persons.clinicalGuide.title")}
            </h2>
          </div>
          <p className="mt-1 text-13 italic text-text-muted leading-relaxed">
            {t("persons.clinicalGuide.introItalic")}
          </p>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[700px] border-collapse text-left text-13">
          <caption className="sr-only">
            {t("persons.clinicalGuide.title")}
          </caption>
          <thead>
            <tr className="border-b border-border bg-surface text-text-muted font-bold text-12 uppercase tracking-wide">
              <th scope="col" className="py-2.5 px-3">
                {t("persons.clinicalGuide.colStatus")}
              </th>
              <th scope="col" className="py-2.5 px-3">
                {t("persons.clinicalGuide.colDefinition")}
              </th>
              <th scope="col" className="py-2.5 px-3">
                {t("persons.clinicalGuide.colMuac")}
              </th>
              <th scope="col" className="py-2.5 px-3">
                {t("persons.clinicalGuide.colZScore")}
              </th>
              <th scope="col" className="py-2.5 px-3">
                {t("persons.clinicalGuide.colProtocol")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {/* MAS Row */}
            <tr className="hover:bg-red-50/40 transition-colors">
              <td className="py-3 px-3 align-top whitespace-nowrap">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 text-12 font-bold text-red-800 border border-red-200">
                  <span className="h-2 w-2 rounded-full bg-red-600" aria-hidden="true" />
                  {t("persons.clinicalGuide.statusMasLabel")}
                </span>
              </td>
              <td className="py-3 px-3 align-top font-medium text-text">
                {t("persons.clinicalGuide.statusMasDef")}
              </td>
              <td className="py-3 px-3 align-top font-mono text-12 text-red-700 font-semibold">
                {t("persons.clinicalGuide.statusMasMuac")}
              </td>
              <td className="py-3 px-3 align-top font-mono text-12 text-red-700 font-semibold">
                {t("persons.clinicalGuide.statusMasZScore")}
              </td>
              <td className="py-3 px-3 align-top text-text-muted">
                {t("persons.clinicalGuide.statusMasProtocol")}
              </td>
            </tr>

            {/* MAM Row */}
            <tr className="hover:bg-amber-50/40 transition-colors">
              <td className="py-3 px-3 align-top whitespace-nowrap">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-12 font-bold text-amber-800 border border-amber-200">
                  <span className="h-2 w-2 rounded-full bg-amber-500" aria-hidden="true" />
                  {t("persons.clinicalGuide.statusMamLabel")}
                </span>
              </td>
              <td className="py-3 px-3 align-top font-medium text-text">
                {t("persons.clinicalGuide.statusMamDef")}
              </td>
              <td className="py-3 px-3 align-top font-mono text-12 text-amber-700 font-semibold">
                {t("persons.clinicalGuide.statusMamMuac")}
              </td>
              <td className="py-3 px-3 align-top font-mono text-12 text-amber-700 font-semibold">
                {t("persons.clinicalGuide.statusMamZScore")}
              </td>
              <td className="py-3 px-3 align-top text-text-muted">
                {t("persons.clinicalGuide.statusMamProtocol")}
              </td>
            </tr>

            {/* Normal Row */}
            <tr className="hover:bg-emerald-50/40 transition-colors">
              <td className="py-3 px-3 align-top whitespace-nowrap">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-12 font-bold text-emerald-800 border border-emerald-200">
                  <span className="h-2 w-2 rounded-full bg-emerald-600" aria-hidden="true" />
                  {t("persons.clinicalGuide.statusNormalLabel")}
                </span>
              </td>
              <td className="py-3 px-3 align-top font-medium text-text">
                {t("persons.clinicalGuide.statusNormalDef")}
              </td>
              <td className="py-3 px-3 align-top font-mono text-12 text-emerald-700 font-semibold">
                {t("persons.clinicalGuide.statusNormalMuac")}
              </td>
              <td className="py-3 px-3 align-top font-mono text-12 text-emerald-700 font-semibold">
                {t("persons.clinicalGuide.statusNormalZScore")}
              </td>
              <td className="py-3 px-3 align-top text-text-muted">
                {t("persons.clinicalGuide.statusNormalProtocol")}
              </td>
            </tr>

            {/* Suivi post-MAS Row */}
            <tr className="hover:bg-sky-50/40 transition-colors">
              <td className="py-3 px-3 align-top whitespace-nowrap">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-100 px-2.5 py-1 text-12 font-bold text-sky-800 border border-sky-200">
                  <span className="h-2 w-2 rounded-full bg-sky-600" aria-hidden="true" />
                  {t("persons.clinicalGuide.statusPostMasLabel")}
                </span>
              </td>
              <td className="py-3 px-3 align-top font-medium text-text">
                {t("persons.clinicalGuide.statusPostMasDef")}
              </td>
              <td className="py-3 px-3 align-top font-mono text-12 text-sky-700 font-semibold">
                {t("persons.clinicalGuide.statusPostMasMuac")}
              </td>
              <td className="py-3 px-3 align-top font-mono text-12 text-sky-700 font-semibold">
                {t("persons.clinicalGuide.statusPostMasZScore")}
              </td>
              <td className="py-3 px-3 align-top text-text-muted">
                {t("persons.clinicalGuide.statusPostMasProtocol")}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-4 border-t border-border/60 pt-3 text-12 italic text-text-muted leading-relaxed">
        {t("persons.clinicalGuide.footerNotesItalic")}
      </div>
    </section>
  );
}
