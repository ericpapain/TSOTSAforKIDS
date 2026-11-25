import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { formatNumber, normalizeLocale, DEFAULT_LOCALE } from "@tsotsa/i18n";
import { FaChild, FaAppleAlt, FaCheck } from "react-icons/fa";
import "../../i18n/setup";

export interface ConfirmIntakeModalProps {
  isOpen: boolean;
  personName?: string;
  itemName: string;
  defaultUnit?: string;
  onClose: () => void;
  onViewCaregiverSide?: () => void;
  onReportIncident?: () => void;
  onConfirmIntake?: (details: {
    foodName: string;
    quantity: number;
    unit: string;
    consumption: "all" | "half" | "refused";
  }) => void;
}

type ConsumptionLevelKey = "all" | "half" | "refused";
type TimeOptionKey = "0800" | "1230" | "1800" | "now";

const TIME_KEYS: TimeOptionKey[] = ["0800", "1230", "1800", "now"];

export const ConfirmIntakeModal: React.FC<ConfirmIntakeModalProps> = ({
  isOpen,
  personName = "l'enfant",
  itemName,
  defaultUnit = "sachet",
  onClose,
  onViewCaregiverSide,
  onReportIncident,
  onConfirmIntake,
}) => {
  const { t, i18n } = useTranslation("nutrition");
  const locale = normalizeLocale(i18n.resolvedLanguage ?? i18n.language) ?? DEFAULT_LOCALE;
  const [quantity, setQuantity] = useState<number>(1);
  const [whenKey, setWhenKey] = useState<TimeOptionKey>("1230");
  const [consumption, setConsumption] = useState<ConsumptionLevelKey>("all");
  const [isConfirmed, setIsConfirmed] = useState<boolean>(false);

  if (!isOpen) return null;

  const formattedCount = formatNumber(quantity, locale);
  const unitLabel =
    defaultUnit === "portion"
      ? t("confirmIntakeModal.units.portion", {
          count: quantity,
          grams: formatNumber(quantity * 100, locale),
        })
      : defaultUnit.includes("100 ml")
        ? t("confirmIntakeModal.units.meal100ml", { count: quantity })
        : t("confirmIntakeModal.units.sachet", { count: quantity, formattedCount });

  const handleResetAndClose = () => {
    setIsConfirmed(false);
    setQuantity(1);
    setConsumption("all");
    onClose();
  };

  const consumptionSummary =
    consumption === "all"
      ? t("confirmIntakeModal.summaryAll", { person: personName })
      : consumption === "half"
        ? t("confirmIntakeModal.summaryHalf", { person: personName })
        : t("confirmIntakeModal.summaryRefused", { person: personName });

  const whenLabel = t(`confirmIntakeModal.timeOptions.${whenKey}`);
  const shortTime = whenLabel.includes("·") ? whenLabel.split("·")[1].trim() : whenLabel;

  const consumptionLevels: { key: ConsumptionLevelKey; testId: string; label: string }[] = [
    { key: "all", testId: "Tout", label: t("confirmIntakeModal.consumption.all") },
    { key: "half", testId: "La moitié", label: t("confirmIntakeModal.consumption.half") },
    { key: "refused", testId: "Refusé", label: t("confirmIntakeModal.consumption.refused") },
  ];

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
            <div className="h-[60px] bg-[#0F7B5F] px-5 flex items-center justify-between text-white">
              <h2 className="text-[20px] font-bold">{t("confirmIntakeModal.title")}</h2>
              <button
                type="button"
                data-testid="give-modal-close-btn"
                onClick={handleResetAndClose}
                className="text-white/90 hover:text-white text-[18px] font-bold px-2 py-1"
                aria-label={t("confirmIntakeModal.closeAria")}
              >
                {"✕"}
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="h-[58px] rounded-[9px] border border-[#D5DEDA] bg-white px-4 flex items-center gap-3.5">
                <FaChild size={26} className="text-[#0F7B5F] shrink-0" />
                <span className="text-[18px] font-bold text-[#17302A]">
                  {t("confirmIntakeModal.forPerson", { person: personName })}
                </span>
              </div>

              <div className="h-[58px] rounded-[9px] border border-[#D5DEDA] bg-white px-4 flex items-center gap-3.5">
                <FaAppleAlt size={24} className="text-[#0F7B5F] shrink-0" />
                <span className="text-[18px] font-bold text-[#17302A]">{itemName}</span>
              </div>

              <div>
                <label className="block text-[15px] font-bold text-[#5B6B66] mb-1.5">
                  {t("confirmIntakeModal.quantityLabel")}
                </label>
                <div className="h-[54px] rounded-[9px] border border-[#D5DEDA] bg-white px-2.5 flex items-center justify-between">
                  <button
                    type="button"
                    data-testid="qty-minus-btn"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-[42px] h-[42px] rounded-[10px] bg-[#E7F4EE] text-[#0F7B5F] text-[22px] font-bold flex items-center justify-center hover:bg-[#d4ebe0] cursor-pointer"
                  >
                    {"−"}
                  </button>
                  <span data-testid="qty-display" className="text-[20px] font-bold text-[#17302A]">
                    {unitLabel}
                  </span>
                  <button
                    type="button"
                    data-testid="qty-plus-btn"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-[42px] h-[42px] rounded-[10px] bg-[#E7F4EE] text-[#0F7B5F] text-[22px] font-bold flex items-center justify-center hover:bg-[#d4ebe0] cursor-pointer"
                  >
                    {"+"}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="intake-when-select"
                  className="block text-[15px] font-bold text-[#5B6B66] mb-1.5"
                >
                  {t("confirmIntakeModal.whenLabel")}
                </label>
                <select
                  id="intake-when-select"
                  value={whenKey}
                  onChange={(e) => setWhenKey(e.target.value as TimeOptionKey)}
                  className="h-[48px] w-full rounded-[9px] border border-[#D5DEDA] bg-white px-3.5 text-[17px] text-[#17302A] font-medium"
                >
                  {TIME_KEYS.map((opt) => (
                    <option key={opt} value={opt}>
                      {t(`confirmIntakeModal.timeOptions.${opt}`)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="block text-[15px] font-bold text-[#5B6B66] mb-1.5">
                  {t("confirmIntakeModal.ateLabel", { person: personName })}
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {consumptionLevels.map((item) => {
                    const active = consumption === item.key;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        data-testid={`consumption-${item.testId}`}
                        onClick={() => setConsumption(item.key)}
                        className={`h-[46px] rounded-[7px] border text-[16px] transition-colors cursor-pointer ${
                          active
                            ? "bg-[#0F7B5F] border-[#0F7B5F] text-white font-bold"
                            : "bg-white border-[#D5DEDA] text-[#17302A] font-normal hover:bg-[#F7F9F8]"
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                data-testid="confirm-intake-submit-btn"
                onClick={() => {
                  setIsConfirmed(true);
                  onConfirmIntake?.({
                    foodName: itemName,
                    quantity,
                    unit: defaultUnit,
                    consumption,
                  });
                }}
                className="w-full h-[56px] rounded-[11px] bg-[#0F7B5F] hover:bg-[#0c634c] text-white text-[20px] font-bold transition-colors cursor-pointer mt-2"
              >
                {t("confirmIntakeModal.submitBtn")}
              </button>

              {onReportIncident && (
                <button
                  type="button"
                  data-testid="report-meal-incident-btn"
                  onClick={onReportIncident}
                  className="w-full py-2.5 px-3 rounded-[9px] bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-[13px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer mt-1"
                >
                  {/* eslint-disable-next-line i18next/no-literal-string */}
                  <span aria-hidden="true">⚠️</span>
                  <span>{t("confirmIntakeModal.reportIncident", "Signaler un problème de santé pendant ce repas")}</span>
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="p-6 text-center space-y-4" data-testid="intake-recorded-view">
            <div className="mx-auto w-[110px] h-[110px] rounded-full bg-[#0F7B5F] flex items-center justify-center text-white shadow-md">
              <FaCheck size={54} />
            </div>

            <h2 className="text-[26px] font-bold text-[#17302A]">
              {t("confirmIntakeModal.recordedTitle")}
            </h2>

            <p className="text-[17px] text-[#5B6B66]">
              {`${itemName} · ${unitLabel} · ${shortTime}`}
              <br />
              {consumptionSummary}
            </p>

            <div className="rounded-[9px] bg-[#E7F4EE] p-3.5 text-[15px] font-bold text-[#0F7B5F]">
              {t("confirmIntakeModal.caregiverNotified", { person: personName })}
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                data-testid="return-to-person-btn"
                onClick={handleResetAndClose}
                className="w-full h-[52px] rounded-[11px] bg-[#0F7B5F] hover:bg-[#0c634c] text-white text-[18px] font-bold transition-colors cursor-pointer"
              >
                {t("confirmIntakeModal.returnToPerson", { person: personName })}
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
                  {t("confirmIntakeModal.viewCaregiverSide")}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
