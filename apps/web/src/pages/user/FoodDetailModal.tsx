import React from "react";
import type { EquivalentLocalFood } from "../../features/nutrition/types";

interface FoodDetailModalProps {
  food: EquivalentLocalFood | null;
  onClose: () => void;
}

export const FoodDetailModal: React.FC<FoodDetailModalProps> = ({ food, onClose }) => {
  if (!food) return null;

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
              {food.category ?? "Aliment local"} · Rang #{food.rank}
            </span>
          </div>
          <button
            type="button"
            data-testid="modal-close-x-btn"
            onClick={onClose}
            className="rounded-lg p-1.5 text-text-muted hover:bg-surface-2 hover:text-text-primary"
            aria-label="Fermer la boîte de dialogue"
          >
            ✕
          </button>
        </div>

        <p className="mt-4 text-sm text-text-secondary leading-relaxed">
          {food.description}
        </p>

        <div className="mt-4 rounded-lg bg-surface-2 p-4">
          <h3 className="text-sm font-bold text-text-primary mb-2">
            Valeurs nutritionnelles pour 100 g
          </h3>
          <div className="grid grid-cols-2 gap-2 text-sm text-text-primary">
            <div>
              <span className="text-text-muted">Énergie :</span> {food.energyKcal} kcal
            </div>
            <div>
              <span className="text-text-muted">Protéines :</span> {food.proteins}
            </div>
            <div>
              <span className="text-text-muted">Lipides :</span> {food.lipids}
            </div>
            <div>
              <span className="text-text-muted">Fer :</span> {food.iron}
            </div>
            {food.calciumMg !== undefined && (
              <div>
                <span className="text-text-muted">Calcium :</span> {food.calciumMg} mg
              </div>
            )}
            {food.zincMg !== undefined && (
              <div>
                <span className="text-text-muted">Zinc :</span> {food.zincMg} mg
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-text-muted">
          <span>
            Disponibilité Région Ouest :{" "}
            <strong className={food.availableInWestRegion ? "text-primary" : "text-text-muted"}>
              {food.availableInWestRegion ? "Oui (disponible)" : "Non"}
            </strong>
          </span>
          <span>Nutriments communs : {food.commonNutrientsCount}</span>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            data-testid="modal-close-btn"
            onClick={onClose}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-hover"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
