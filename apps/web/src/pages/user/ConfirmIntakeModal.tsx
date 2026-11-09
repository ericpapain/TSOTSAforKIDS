import React, { useState } from "react";
import { FaChild, FaAppleAlt, FaCheck } from "react-icons/fa";

export interface ConfirmIntakeModalProps {
  isOpen: boolean;
  personName?: string;
  itemName: string;
  defaultUnit?: string;
  onClose: () => void;
  onViewCaregiverSide?: () => void;
}

type ConsumptionLevel = "Tout" | "La moitié" | "Refusé";

const TIME_OPTIONS = [
  "Aujourd'hui · 08:00",
  "Aujourd'hui · 12:30",
  "Aujourd'hui · 18:00",
  "À l'instant",
];

export const ConfirmIntakeModal: React.FC<ConfirmIntakeModalProps> = ({
  isOpen,
  personName = "Hamadou",
  itemName,
  defaultUnit = "sachet",
  onClose,
  onViewCaregiverSide,
}) => {
  const [quantity, setQuantity] = useState<number>(1);
  const [when, setWhen] = useState<string>("Aujourd'hui · 12:30");
  const [consumption, setConsumption] = useState<ConsumptionLevel>("Tout");
  const [isConfirmed, setIsConfirmed] = useState<boolean>(false);

  if (!isOpen) return null;

  const unitLabel =
    defaultUnit === "portion"
      ? `${quantity * 100} g (${quantity} portion${quantity > 1 ? "s" : ""})`
      : `${quantity} ${defaultUnit}${quantity > 1 && !defaultUnit.endsWith("s") ? "s" : ""}`;

  const handleResetAndClose = () => {
    setIsConfirmed(false);
    setQuantity(1);
    setConsumption("Tout");
    onClose();
  };

  const consumptionSummary =
    consumption === "Tout"
      ? `${personName} a tout mangé.`
      : consumption === "La moitié"
      ? `${personName} a mangé la moitié.`
      : `${personName} a refusé la prise.`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-testid="confirm-intake-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      onClick={handleResetAndClose}
    >
      <div
        className="w-full max-w-[420px] rounded-[12px] bg-white shadow-2xl overflow-hidden font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {!isConfirmed ? (
          <>
            {/* Header M20 */}
            <div className="h-[60px] bg-[#0F7B5F] px-5 flex items-center justify-between text-white">
              <h2 className="text-[20px] font-bold">Confirmer la prise</h2>
              <button
                type="button"
                data-testid="give-modal-close-btn"
                onClick={handleResetAndClose}
                className="text-white/90 hover:text-white text-[18px] font-bold px-2 py-1"
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Pour : Hamadou */}
              <div className="h-[58px] rounded-[9px] border border-[#D5DEDA] bg-white px-4 flex items-center gap-3.5">
                <FaChild size={26} className="text-[#0F7B5F] shrink-0" />
                <span className="text-[18px] font-bold text-[#17302A]">
                  Pour : {personName}
                </span>
              </div>

              {/* Produit / Aliment */}
              <div className="h-[58px] rounded-[9px] border border-[#D5DEDA] bg-white px-4 flex items-center gap-3.5">
                <FaAppleAlt size={24} className="text-[#0F7B5F] shrink-0" />
                <span className="text-[18px] font-bold text-[#17302A]">
                  {itemName}
                </span>
              </div>

              {/* Quantité */}
              <div>
                <label className="block text-[15px] font-bold text-[#5B6B66] mb-1.5">
                  Quantité
                </label>
                <div className="h-[54px] rounded-[9px] border border-[#D5DEDA] bg-white px-2.5 flex items-center justify-between">
                  <button
                    type="button"
                    data-testid="qty-minus-btn"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-[42px] h-[42px] rounded-[10px] bg-[#E7F4EE] text-[#0F7B5F] text-[22px] font-bold flex items-center justify-center hover:bg-[#d4ebe0] cursor-pointer"
                  >
                    −
                  </button>
                  <span
                    data-testid="qty-display"
                    className="text-[20px] font-bold text-[#17302A]"
                  >
                    {unitLabel}
                  </span>
                  <button
                    type="button"
                    data-testid="qty-plus-btn"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-[42px] h-[42px] rounded-[10px] bg-[#E7F4EE] text-[#0F7B5F] text-[22px] font-bold flex items-center justify-center hover:bg-[#d4ebe0] cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Quand ? */}
              <div>
                <label
                  htmlFor="intake-when-select"
                  className="block text-[15px] font-bold text-[#5B6B66] mb-1.5"
                >
                  Quand ?
                </label>
                <select
                  id="intake-when-select"
                  value={when}
                  onChange={(e) => setWhen(e.target.value)}
                  className="h-[48px] w-full rounded-[9px] border border-[#D5DEDA] bg-white px-3.5 text-[17px] text-[#17302A] font-medium"
                >
                  {TIME_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Hamadou a mangé : */}
              <div>
                <span className="block text-[15px] font-bold text-[#5B6B66] mb-1.5">
                  {personName} a mangé :
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {(["Tout", "La moitié", "Refusé"] as ConsumptionLevel[]).map(
                    (level) => {
                      const active = consumption === level;
                      return (
                        <button
                          key={level}
                          type="button"
                          data-testid={`consumption-${level}`}
                          onClick={() => setConsumption(level)}
                          className={`h-[46px] rounded-[7px] border text-[16px] transition-colors cursor-pointer ${
                            active
                              ? "bg-[#0F7B5F] border-[#0F7B5F] text-white font-bold"
                              : "bg-white border-[#D5DEDA] text-[#17302A] font-normal hover:bg-[#F7F9F8]"
                          }`}
                        >
                          {level}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Confirmer */}
              <button
                type="button"
                data-testid="confirm-intake-submit-btn"
                onClick={() => setIsConfirmed(true)}
                className="w-full h-[56px] rounded-[11px] bg-[#0F7B5F] hover:bg-[#0c634c] text-white text-[20px] font-bold transition-colors cursor-pointer mt-2"
              >
                Confirmer
              </button>
            </div>
          </>
        ) : (
          /* Écran M21 : Prise enregistrée */
          <div className="p-6 text-center space-y-4" data-testid="intake-recorded-view">
            <div className="mx-auto w-[110px] h-[110px] rounded-full bg-[#0F7B5F] flex items-center justify-center text-white shadow-md">
              <FaCheck size={54} />
            </div>

            <h2 className="text-[26px] font-bold text-[#17302A]">
              Prise enregistrée
            </h2>

            <p className="text-[17px] text-[#5B6B66]">
              {itemName} · {unitLabel} · {when.replace("Aujourd'hui · ", "")}
              <br />
              {consumptionSummary}
            </p>

            <div className="rounded-[9px] bg-[#E7F4EE] p-3.5 text-[15px] font-bold text-[#0F7B5F]">
              Votre soignant est prévenu et la voit dans le suivi de {personName}.
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                data-testid="return-to-person-btn"
                onClick={handleResetAndClose}
                className="w-full h-[52px] rounded-[11px] bg-[#0F7B5F] hover:bg-[#0c634c] text-white text-[18px] font-bold transition-colors cursor-pointer"
              >
                Retour à {personName}
              </button>

              {onViewCaregiverSide && (
                <button
                  type="button"
                  data-testid="view-caregiver-side-btn"
                  onClick={() => {
                    handleResetAndClose();
                    onViewCaregiverSide();
                  }}
                  className="w-full h-[48px] rounded-[11px] bg-[#1F5FA8] hover:bg-[#184b85] text-white text-[17px] font-bold transition-colors cursor-pointer"
                >
                  Voir côté soignant →
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

