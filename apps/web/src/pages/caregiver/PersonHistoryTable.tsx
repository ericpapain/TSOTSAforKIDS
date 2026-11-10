import React from "react";
import { useTranslation } from "react-i18next";
import { formatNumber, type SupportedLocale } from "@tsotsa/i18n";
import type { EvaluationRecord } from "../../features/caregiver/types";

export interface PersonHistoryTableProps {
  evaluations: EvaluationRecord[];
  locale: SupportedLocale;
  formatShortDayMonth: (date: string, locale: SupportedLocale) => string;
}

export const PersonHistoryTable: React.FC<PersonHistoryTableProps> = ({
  evaluations,
  locale,
  formatShortDayMonth,
}) => {
  const { t } = useTranslation("caregiver");

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-12 text-left" data-testid="evaluations-history-table">
        <thead className="bg-surface-2 text-text-muted border-b border-border">
          <tr>
            <th className="py-2 px-2.5">{t("record.historyColumns.date")}</th>
            <th className="py-2 px-2.5">{t("record.historyColumns.weight")}</th>
            <th className="py-2 px-2.5">{t("record.historyColumns.height")}</th>
            <th className="py-2 px-2.5">{t("record.historyColumns.muac")}</th>
            <th className="py-2 px-2.5">{t("record.historyColumns.zScore")}</th>
            <th className="py-2 px-2.5">{t("record.historyColumns.edema")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {evaluations.map((ev) => {
            const isNew = ev.date === "12/11";
            return (
              <tr
                key={ev.id}
                data-testid={`eval-row-${ev.date.replace("/", "-")}`}
                className={isNew ? "bg-[#FFF1E2] font-semibold" : ""}
              >
                <td className="py-2 px-2.5">{formatShortDayMonth(ev.date, locale)}</td>
                <td className="py-2 px-2.5">
                  {`${formatNumber(ev.weightKg, locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg`}
                </td>
                <td className="py-2 px-2.5">
                  {`${formatNumber(ev.lengthCm, locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} cm`}
                </td>
                <td className="py-2 px-2.5">{`${formatNumber(ev.pbMm, locale)} mm`}</td>
                <td className="py-2 px-2.5 font-bold text-care">
                  {formatNumber(ev.zScore, locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="py-2 px-2.5">
                  {ev.edema === "Non" ? t("record.edemaNone") : ev.edema}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

