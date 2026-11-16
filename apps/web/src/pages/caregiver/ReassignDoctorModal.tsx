import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { FaTimes, FaUserMd, FaExchangeAlt } from "react-icons/fa";
import type { CaregiverDoctor, FollowedPerson } from "../../features/caregiver/types";

export interface ReassignDoctorModalProps {
  person: FollowedPerson | null;
  isOpen: boolean;
  doctors: CaregiverDoctor[];
  onClose: () => void;
  onConfirm: (personId: string, toDoctorId: string, reason: string) => void;
}

export const ReassignDoctorModal: React.FC<ReassignDoctorModalProps> = ({
  person,
  isOpen,
  doctors,
  onClose,
  onConfirm,
}) => {
  const { t } = useTranslation(["caregiver", "common"]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !person) return null;

  const currentDoctor =
    doctors.find((d) => d.id === person.assignedDoctorId) ||
    doctors.find((d) => d.name === person.assignedDoctorName);

  const availableTargets = doctors.filter((d) => d.id !== currentDoctor?.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = selectedDoctorId || availableTargets[0]?.id;
    if (!targetId) {
      setError(t("common:actions.requiredField", "Veuillez choisir un médecin."));
      return;
    }

    onConfirm(person.id, targetId, reason.trim());
    onClose();
    setReason("");
    setError(null);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-testid="reassign-doctor-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div className="w-full max-w-[500px] rounded-xl bg-white shadow-2xl overflow-hidden border border-[#D5DEDA]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#F7F9F8] border-b border-[#E5ECE9]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-care/10 text-care flex items-center justify-center">
              <FaExchangeAlt size={14} />
            </div>
            <h3 className="text-[17px] font-bold text-[#17302A]">
              {t("caregiver:persons.reassignModal.title", "Réattribution du patient")}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#5B6B66] hover:text-[#17302A] p-1.5"
            aria-label={t("common:header.close", "Fermer")}
          >
            <FaTimes size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-[12px] rounded-md">
              {error}
            </div>
          )}

          {/* Patient Details Card */}
          <div className="p-3.5 rounded-lg bg-[#F7F9F8] border border-[#E5ECE9] flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase text-[#5B6B66]">
                {t("caregiver:persons.reassignModal.patientLabel", "Patient concerné")}
              </span>
              <div className="text-[15px] font-bold text-[#17302A]">
                {person.name} ({person.code})
              </div>
              <div className="text-[12px] text-[#5B6B66]">{person.facility}</div>
            </div>
            <span
              className={`text-[12px] font-bold px-2.5 py-0.5 rounded-full ${
                person.status === "MAS"
                  ? "bg-red-100 text-red-700"
                  : person.status === "MAM"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-emerald-100 text-emerald-800"
              }`}
            >
              {person.status}
            </span>
          </div>

          {/* Current Doctor */}
          <div>
            <label className="block text-[12px] font-bold text-[#5B6B66] mb-1">
              {t("caregiver:persons.reassignModal.currentDoctor", "Médecin actuel")}
            </label>
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-surface-2 border border-border text-[13px] text-[#17302A]">
              <FaUserMd className="text-care" />
              <span className="font-bold">
                {currentDoctor ? currentDoctor.name : person.assignedDoctorName || "Non assigné"}
              </span>
            </div>
          </div>

          {/* New Doctor Dropdown */}
          <div>
            <label className="block text-[12px] font-bold text-[#17302A] mb-1">
              {t("caregiver:persons.reassignModal.targetDoctor", "Nouveau médecin référent")} *
            </label>
            <select
              data-testid="target-doctor-select"
              value={selectedDoctorId || (availableTargets[0]?.id ?? "")}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="w-full px-3 py-2 border border-[#D5DEDA] rounded-lg text-[13px] font-medium bg-white focus:outline-none focus:ring-2 focus:ring-care"
            >
              {availableTargets.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {/* eslint-disable-next-line i18next/no-literal-string */}
                  {`${doc.name} · ${doc.specialty}`}
                </option>
              ))}
            </select>
          </div>

          {/* Reason Input */}
          <div>
            <label className="block text-[12px] font-bold text-[#17302A] mb-1">
              {t("caregiver:persons.reassignModal.reasonLabel", "Motif clinique de la réattribution")}
            </label>
            <input
              type="text"
              data-testid="reassign-reason-input"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t(
                "caregiver:persons.reassignModal.reasonPlaceholder",
                "Ex : Réorientation vers la pédiatrie nutritionnelle"
              )}
              className="w-full px-3.5 py-2 border border-[#D5DEDA] rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-care"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-[#E5ECE9] flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[13px] font-bold text-[#5B6B66] hover:text-[#17302A]"
            >
              {t("common:actions.cancel", "Annuler")}
            </button>
            <button
              type="submit"
              data-testid="confirm-reassign-btn"
              className="px-5 py-2 bg-care hover:bg-[#153D66] text-white text-[13px] font-bold rounded-lg transition-colors"
            >
              {t("caregiver:persons.reassignModal.confirmBtn", "Confirmer le transfert")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
