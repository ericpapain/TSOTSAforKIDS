import React from "react";
import { useTranslation } from "react-i18next";

export interface SuperCaregiverBarProps {
  isSuperCaregiver: boolean;
  onToggle: () => void;
}

export const SuperCaregiverBar: React.FC<SuperCaregiverBarProps> = ({
  isSuperCaregiver,
  onToggle,
}) => {
  const { t } = useTranslation("caregiver");

  return (
    <div
      data-testid="super-caregiver-bar"
      className={`p-3.5 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        isSuperCaregiver
          ? "bg-[#EBF3FB] border-[#C2DBF3] text-[#1B4D7E]"
          : "bg-[#F7F9F8] border-[#E5ECE9] text-[#5B6B66]"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <span
          className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
            isSuperCaregiver ? "bg-[#1B4D7E] text-white" : "bg-gray-200 text-gray-700"
          }`}
        >
          {isSuperCaregiver
            ? t("persons.superDoctorBadge", "Super Soignant")
            : t("persons.standardDoctorMode", "Praticien")}
        </span>
        <span className="text-[13px] font-medium">
          {isSuperCaregiver
            ? t(
                "persons.superDoctorNotice",
                "En tant que Super Soignant, vous pouvez réattribuer les dossiers patients entre confrères."
              )
            : t(
                "persons.standardDoctorNotice",
                "Mode praticien : consultation de vos dossiers patients assignés."
              )}
        </span>
      </div>

      <button
        type="button"
        data-testid="toggle-super-caregiver-btn"
        onClick={onToggle}
        className={`px-3 py-1.5 rounded-md text-[12px] font-bold border transition-colors ${
          isSuperCaregiver
            ? "bg-white text-[#1B4D7E] border-[#1B4D7E]/30 hover:bg-[#F0F6FC]"
            : "bg-primary text-white border-primary hover:bg-primary-hover"
        }`}
      >
        {isSuperCaregiver
          ? t("persons.switchToStandard", "Désactiver mode Super Soignant")
          : t("persons.switchToSuper", "Activer mode Super Soignant")}
      </button>
    </div>
  );
};

