import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useOptionalAuth, hasPermission } from "../../api/authContext";

export interface SuperCaregiverBarProps {
  isSuperCaregiver?: boolean;
  onToggle?: () => void;
  availableDoctors?: { id: string; name: string }[];
}

export const SuperCaregiverBar: React.FC<SuperCaregiverBarProps> = ({
  isSuperCaregiver: propIsSuper,
  onToggle,
  availableDoctors = [],
}) => {
  const { t } = useTranslation("caregiver");
  const auth = useOptionalAuth();
  const session = auth?.session ?? null;
  const viewAsCaregiver = auth?.viewAsCaregiver;
  const [selectedDoctorId, setSelectedDoctorId] = useState("");

  const isSuper =
    propIsSuper !== undefined
      ? propIsSuper
      : session?.role === "super_caregiver" || hasPermission(session, "caregivers.view_as");

  const handleSelectDoctor = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const docId = e.target.value;
    setSelectedDoctorId(docId);
    if (!docId) {
      viewAsCaregiver?.(null, null);
    } else {
      const doc = availableDoctors.find((d) => d.id === docId);
      viewAsCaregiver?.(docId, doc?.name || docId);
    }
  };

  return (
    <div
      data-testid="super-caregiver-bar"
      className={`p-3.5 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        isSuper
          ? "bg-[#EBF3FB] border-[#C2DBF3] text-[#1B4D7E]"
          : "bg-[#F7F9F8] border-[#E5ECE9] text-[#5B6B66]"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <span
          className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
            isSuper ? "bg-[#1B4D7E] text-white" : "bg-gray-200 text-gray-700"
          }`}
        >
          {isSuper
            ? t("persons.superDoctorBadge", "Super Soignant")
            : t("persons.standardDoctorMode", "Praticien")}
        </span>
        <span className="text-[13px] font-medium">
          {isSuper
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

      <div className="flex items-center gap-2">
        {isSuper && availableDoctors.length > 0 && (
          <div className="flex items-center gap-1.5">
            <label className="text-[11px] font-bold uppercase text-[#1B4D7E]">
              {t("supervision.viewAsDoctor")}
            </label>
            <select
              data-testid="view-as-doctor-select"
              value={selectedDoctorId}
              onChange={handleSelectDoctor}
              className="text-xs border border-[#C2DBF3] rounded px-2 py-1 bg-white text-text-primary"
            >
              <option value="">{t("supervision.viewAsDoctorDefault")}</option>
              {availableDoctors.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {onToggle && (
          <button
            type="button"
            data-testid="toggle-super-caregiver-btn"
            onClick={onToggle}
            className={`px-3 py-1.5 rounded-md text-[12px] font-bold border transition-colors ${
              isSuper
                ? "bg-white text-[#1B4D7E] border-[#1B4D7E]/30 hover:bg-[#F0F6FC]"
                : "bg-primary text-white border-primary hover:bg-primary-hover"
            }`}
          >
            {isSuper
              ? t("persons.switchToStandard", "Désactiver mode Super Soignant")
              : t("persons.switchToSuper", "Activer mode Super Soignant")}
          </button>
        )}
      </div>
    </div>
  );
};
