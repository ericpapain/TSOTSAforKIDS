import React from "react";
import { useTranslation } from "react-i18next";
import { formatNumber, normalizeLocale, DEFAULT_LOCALE } from "@tsotsa/i18n";
import "../../i18n/setup";
import type { EquivalentLocalFood } from "../../features/nutrition/types";

interface FoodDetailModalProps {
  food: EquivalentLocalFood | null;
  personName?: string;
  onClose: () => void;
  onGiveFood?: (food: EquivalentLocalFood) => void;
}

export const FoodDetailModal: React.FC<FoodDetailModalProps> = ({
  food,
  personName = "l'enfant",
  onClose,
  onGiveFood,
}) => {
  const { t, i18n } = useTranslation("nutrition");
  if (!food) return null;

  const locale = normalizeLocale(i18n.resolvedLanguage ?? i18n.language) ?? DEFAULT_LOCALE;
  const categoryLabel = food.category ?? t("foodModal.defaultCategory");

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="food-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h2 id="food-modal-title" className="text-xl font-bold text-text-primary">
              {food.name}
            </h2>
            <span className="text-xs font-medium text-text-muted">
              {t("foodModal.rankLabel", { category: categoryLabel, rank: formatNumber(food.rank, locale) })}
            </span>
          </div>
          <button
            type="button"
            data-testid="modal-close-x-btn"
            onClick={onClose}
            className="rounded-lg p-1.5 text-text-muted hover:bg-surface-2 hover:text-text-primary"
            aria-label={t("foodModal.closeAria")}
          >
            {"✕"}
          </button>
        </div>

        <p className="mt-4 text-sm text-text-secondary leading-relaxed">
          {food.description}
        </p>

        <div className="mt-4 rounded-lg bg-surface-2 p-4">
          <h3 className="text-sm font-bold text-text-primary mb-2">
            {t("foodModal.nutritionPer100g")}
          </h3>
          <div className="grid grid-cols-2 gap-2 text-sm text-text-primary">
            <div>
              <span className="text-text-muted">{t("foodModal.energy")}</span>{" "}
              {food.energyKcal !== undefined ? `${formatNumber(food.energyKcal, locale)} kcal` : ""}
            </div>
            <div>
              <span className="text-text-muted">{t("foodModal.proteins")}</span> {food.proteins}
            </div>
            <div>
              <span className="text-text-muted">{t("foodModal.lipids")}</span> {food.lipids}
            </div>
            <div>
              <span className="text-text-muted">{t("foodModal.iron")}</span> {food.iron}
            </div>
            {food.calciumMg !== undefined && (
              <div>
                <span className="text-text-muted">{t("foodModal.calcium")}</span>{" "}
                {`${formatNumber(food.calciumMg, locale)} mg`}
              </div>
            )}
            {food.zincMg !== undefined && (
              <div>
                <span className="text-text-muted">{t("foodModal.zinc")}</span>{" "}
                {`${formatNumber(food.zincMg, locale)} mg`}
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-text-muted">
          <span>
            {`${t("foodModal.westAvailability")} `}
            <strong className={food.availableInWestRegion ? "text-primary" : "text-text-muted"}>
              {food.availableInWestRegion ? t("foodModal.availableYes") : t("foodModal.availableNo")}
            </strong>
          </span>
          <span>{t("foodModal.commonNutrients", { count: food.commonNutrientsCount as unknown as number })}</span>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            data-testid="modal-close-btn"
            onClick={onClose}
            className="rounded-lg border border-[#D5DEDA] bg-white px-4 py-2 text-sm font-bold text-[#17302A] hover:bg-[#F7F9F8]"
          >
            {t("foodModal.closeBtn")}
          </button>
          {onGiveFood && (
            <button
              type="button"
              data-testid="modal-give-food-btn"
              onClick={() => {
                const target = food;
                onClose();
                onGiveFood(target);
              }}
              className="rounded-lg bg-[#0F7B5F] px-4 py-2 text-sm font-bold text-white hover:bg-[#0c634c] cursor-pointer"
            >
              {t("foodModal.giveFoodBtn", { food: food.name, person: personName })}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
