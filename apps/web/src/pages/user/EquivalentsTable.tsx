import React from "react";
import { useTranslation } from "react-i18next";
import { formatNumber, type SupportedLocale } from "@tsotsa/i18n";
import type { EquivalentLocalFood } from "../../features/nutrition/types";

export interface EquivalentsTableProps {
  displayedFoods: EquivalentLocalFood[];
  activeRegionColumnHeader: string;
  locale: SupportedLocale;
  onSelectFood: (id: string) => void;
  isFoodAvailableInCurrentColumn: (food: EquivalentLocalFood) => boolean;
}

export const EquivalentsTable: React.FC<EquivalentsTableProps> = ({
  displayedFoods,
  activeRegionColumnHeader,
  locale,
  onSelectFood,
  isFoodAvailableInCurrentColumn,
}) => {
  const { t } = useTranslation("nutrition");

  return (
    <div className="overflow-x-auto rounded-md" data-testid="ranked-foods-table">
      <table className="w-full text-left text-[14px] border-collapse">
        <thead>
          <tr className="h-[39px] bg-[#0F7B5F] text-white font-bold">
            <th className="px-3 w-[40px]">{t("table.rank")}</th>
            <th className="px-3">{t("table.localFood")}</th>
            <th className="px-2 w-[70px]">{t("table.common")}</th>
            <th className="px-2 w-[90px]">{t("table.extra")}</th>
            <th className="px-2 w-[85px]">{t("table.proteins")}</th>
            <th className="px-2 w-[85px]">{t("table.lipids")}</th>
            <th className="px-2 w-[75px]">{t("table.iron")}</th>
            <th className="px-3 w-[120px]">{activeRegionColumnHeader}</th>
          </tr>
        </thead>
        <tbody>
          {displayedFoods.map((food, idx) => (
            <tr
              key={food.id}
              data-testid={`food-row-${food.id}`}
              onClick={() => onSelectFood(food.id)}
              className={`h-[50px] cursor-pointer transition-colors hover:bg-[#EDF5F2] ${
                idx % 2 === 0 ? "bg-[#F7F9F8]" : "bg-white"
              }`}
            >
              <td className="px-3 text-[#17302A] text-[16px]">
                {formatNumber(food.rank, locale)}
              </td>
              <td className="px-3 font-bold text-[16px]">
                <span
                  className={
                    food.id === "arachide"
                      ? "text-[#0F7B5F] underline"
                      : "text-[#17302A]"
                  }
                >
                  {food.name}
                </span>
              </td>
              <td className="px-2 text-[#17302A] text-[16px]">{food.commonNutrientsCount}</td>
              <td className="px-2 text-[#17302A] text-[16px]">{food.extraNutrient}</td>
              <td className="px-2 text-[#17302A] text-[16px]">{food.proteins}</td>
              <td className="px-2 text-[#17302A] text-[16px]">{food.lipids}</td>
              <td className="px-2 text-[#17302A] text-[16px]">{food.iron}</td>
              <td className="px-3 text-[#17302A] text-[16px]">
                {isFoodAvailableInCurrentColumn(food) ? "✓" : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
