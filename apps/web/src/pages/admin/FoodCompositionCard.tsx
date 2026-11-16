import React from "react";
import { useTranslation } from "react-i18next";
import { formatNumber, type SupportedLocale } from "@tsotsa/i18n";
import { Card } from "../../components/Card";

export interface NutrientRow {
  id: string;
  nom: string;
  valeur: number;
  unite: string;
}

interface FoodCompositionCardProps {
  nutriments: NutrientRow[];
  onAddNutrient: () => void;
  onRemoveNutrient: (id: string) => void;
}

export function FoodCompositionCard({
  nutriments,
  onAddNutrient,
  onRemoveNutrient,
}: FoodCompositionCardProps): React.JSX.Element {
  const { t, i18n } = useTranslation("admin");
  const { t: tCommon } = useTranslation("common");
  const locale: SupportedLocale = i18n.language?.startsWith("en") ? "en" : "fr";

  return (
    <Card testID="composition-card" className="p-6 flex flex-col gap-4">
      <h2 className="text-21 font-bold text-text">{t("foodNew.compositionCardTitle")}</h2>
      <div className="overflow-x-auto border border-border rounded-[6px]">
        <table className="w-full text-left border-collapse" data-testid="nutrients-table">
          <thead>
            <tr className="bg-admin text-white text-14 font-bold h-[41px]">
              <th className="px-3 py-2">{t("foodNew.compositionCols.nutrient")}</th>
              <th className="px-3 py-2">{t("foodNew.compositionCols.value")}</th>
              <th className="px-3 py-2">{t("foodNew.compositionCols.unit")}</th>
              <th className="px-3 py-2 w-[40px]"></th>
            </tr>
          </thead>
          <tbody>
            {nutriments.map((n, idx) => (
              <tr
                key={n.id}
                className={`h-[46px] text-16 border-t border-border ${
                  idx % 2 === 0 ? "bg-surface-2" : "bg-white"
                }`}
              >
                <td className="px-3 py-2 font-normal text-text">
                  {t(`foodNew.nutrientNames.${n.nom}` as never)}
                </td>
                <td className="px-3 py-2 font-normal text-text">
                  {formatNumber(n.valeur, locale)}
                </td>
                <td className="px-3 py-2 font-normal text-text">{n.unite}</td>
                <td className="px-3 py-2 text-right">
                  {/* eslint-disable i18next/no-literal-string -- Multiplication symbol */}
                  <button
                    type="button"
                    aria-label={tCommon("actions.delete")}
                    data-testid={`btn-remove-nutrient-${n.id}`}
                    onClick={() => onRemoveNutrient(n.id)}
                    className="text-text-muted hover:text-danger font-bold text-16"
                  >
                    ✕
                  </button>
                  {/* eslint-enable i18next/no-literal-string */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        data-testid="btn-add-nutrient"
        onClick={onAddNutrient}
        className="text-16 font-bold text-admin text-left hover:underline"
      >
        {t("foodNew.addNutrientBtn")}
      </button>

      <p className="text-16 font-bold text-primary mt-2">
        {t("foodNew.controlsSummary")}
      </p>
    </Card>
  );
}


