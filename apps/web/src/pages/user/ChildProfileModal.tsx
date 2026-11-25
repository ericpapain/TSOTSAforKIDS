import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { FaTimes, FaWeight, FaRulerVertical, FaHeartbeat, FaUserFriends, FaCheckCircle, FaUserMd, FaFileMedical } from "react-icons/fa";
import type { ChildMember } from "../../features/user/types";
import { useUserStore } from "../../features/user/useUserStore";
import { ChildHealthReportModal } from "../health/ChildHealthReportModal";

export interface ChildProfileModalProps {
  child: ChildMember | null;
  isOpen: boolean;
  onClose: () => void;
  onInviteParent: (child: ChildMember) => void;
}

export const ChildProfileModal: React.FC<ChildProfileModalProps> = ({
  child,
  isOpen,
  onClose,
  onInviteParent,
}) => {
  const { t } = useTranslation(["mobile", "common", "medical"]);
  const { activeChildId, setActiveChild } = useUserStore();
  const [isHealthOpen, setIsHealthOpen] = useState(false);

  if (!isOpen || !child) return null;

  const isActive = child.id === activeChildId;

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-testid="child-profile-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div className="w-full max-w-[500px] rounded-xl bg-white shadow-2xl overflow-hidden border border-[#D5DEDA]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#F7F9F8] border-b border-[#E5ECE9]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[18px]">
              {child.firstName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[17px] font-bold text-[#17302A]">{child.firstName}</h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#E5ECE9] text-[#5B6B66]">
                  {child.code}
                </span>
              </div>
              <p className="text-[12px] text-[#5B6B66]">
                {child.sex === "F"
                  ? t("mobile:addPerson.sexFemale", "Fille")
                  : t("mobile:addPerson.sexMale", "Garçon")}{" "}
                · {child.birthDate}
              </p>
            </div>
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

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Status & Measurements Card */}
          <div className="p-4 rounded-xl bg-[#F7F9F8] border border-[#E5ECE9] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-bold text-[#5B6B66] uppercase tracking-wider">
                {t("mobile:profile.healthStatus", "État nutritionnel")}
              </span>
              <span
                className={`text-[12px] font-bold px-2.5 py-0.5 rounded-full ${
                  child.status === "MAS"
                    ? "bg-red-100 text-red-700"
                    : child.status === "MAM"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-emerald-100 text-emerald-800"
                }`}
              >
                {child.status === "MAS"
                  ? t("mobile:profile.statusMas", "MAS (Aigu sévère)")
                  : child.status === "MAM"
                    ? t("mobile:profile.statusMam", "MAM (Aigu modéré)")
                    : t("mobile:profile.statusNormal", "Normal / Stable")}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-1">
              <div className="p-2.5 bg-white rounded-lg border border-[#E5ECE9] text-center">
                <div className="flex items-center justify-center text-[#5B6B66] mb-1">
                  <FaWeight size={13} />
                </div>
                {/* eslint-disable-next-line i18next/no-literal-string */}
                <div className="text-[15px] font-bold text-[#17302A]">{child.weightKg} kg</div>
                <div className="text-[11px] text-[#5B6B66]">{t("mobile:addPerson.weight", "Poids")}</div>
              </div>

              <div className="p-2.5 bg-white rounded-lg border border-[#E5ECE9] text-center">
                <div className="flex items-center justify-center text-[#5B6B66] mb-1">
                  <FaRulerVertical size={13} />
                </div>
                {/* eslint-disable-next-line i18next/no-literal-string */}
                <div className="text-[15px] font-bold text-[#17302A]">{child.heightCm} cm</div>
                <div className="text-[11px] text-[#5B6B66]">{t("mobile:addPerson.height", "Taille")}</div>
              </div>

              <div className="p-2.5 bg-white rounded-lg border border-[#E5ECE9] text-center">
                <div className="flex items-center justify-center text-[#5B6B66] mb-1">
                  <FaHeartbeat size={13} />
                </div>
                {/* eslint-disable-next-line i18next/no-literal-string */}
                <div className="text-[15px] font-bold text-[#17302A]">{child.muacMm} mm</div>
                <div className="text-[11px] text-[#5B6B66]">{t("mobile:addPerson.muac", "PB (mm)")}</div>
              </div>
            </div>
          </div>

          {/* Health Facility & Guardians */}
          <div className="space-y-2 text-[13px]">
            <div className="flex justify-between py-1.5 border-b border-[#E5ECE9]">
              <span className="text-[#5B6B66]">{t("mobile:profile.facility", "Centre rattaché")} :</span>
              <span className="font-bold text-[#17302A]">{child.facilityName}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-[#E5ECE9]">
              <span className="text-[#5B6B66]">{t("mobile:profile.guardian", "Tuteur principal")} :</span>
              <span className="font-bold text-[#17302A]">
                {child.relation === "mother"
                  ? t("mobile:addPerson.relationMother", "Mère")
                  : child.relation === "father"
                    ? t("mobile:addPerson.relationFather", "Père")
                    : t("mobile:addPerson.relationGuardian", "Tuteur légal")}{" "}
                ({t("mobile:profile.you", "Vous")})
              </span>
            </div>

            <div className="flex justify-between items-center py-1.5">
              <span className="text-[#5B6B66]">{t("mobile:profile.secondParent", "Second parent")} :</span>
              {child.secondParentInvite ? (
                <span className="inline-flex items-center gap-1 text-[12px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-bold">
                  <span>{child.secondParentInvite.phoneOrEmail}</span>
                  <span className="text-[10px]">({t("mobile:inviteParent.pending", "En attente")})</span>
                </span>
              ) : (
                <button
                  type="button"
                  data-testid="profile-invite-second-parent-btn"
                  onClick={() => onInviteParent(child)}
                  className="inline-flex items-center gap-1 text-[12px] font-bold text-primary hover:underline"
                >
                  <FaUserFriends size={12} />
                  <span>{t("mobile:profile.inviteNow", "+ Inviter")}</span>
                </button>
              )}
            </div>
          </div>

          {/* Attending Doctor & Reports */}
          <div className="p-3.5 rounded-xl bg-[#EDF5F2] border border-[#C5DDD3] space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FaUserMd className="text-primary text-[15px]" />
                <span className="text-[12px] font-bold text-primary uppercase tracking-wide">
                  {t("mobile:profile.attendingDoctor", "Médecin référent")}
                </span>
              </div>
              <span className="text-[12px] font-bold text-[#17302A]">
                {child.doctorName || (child.validationStatus === "validated" ? "Non assigné" : "En cours d'attribution")}
              </span>
            </div>

            {child.doctorReports && child.doctorReports.length > 0 && (
              <div className="space-y-2 pt-1 border-t border-[#D5E6DF]" data-testid="doctor-reports-section">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#3B4B46]">
                  <FaFileMedical size={11} />
                  <span>{t("mobile:profile.doctorReportsTitle", "Rapports & Recommandations du médecin")}</span>
                </div>
                {child.doctorReports.slice(0, 1).map((rep) => (
                  <div key={rep.id} className="p-2.5 bg-white rounded-lg border border-[#D5E6DF] text-[12px] space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-[#17302A]">{rep.title}</span>
                      <span className="text-[10px] text-[#5B6B66]">{rep.date}</span>
                    </div>
                    <p className="text-[11px] text-emerald-800 font-semibold">
                      {t("mobile:profile.doctorTargetWeight", "Poids cible : {{weight}} kg", { weight: rep.targetWeightKg })}
                    </p>
                    <p className="text-[11px] text-[#17302A]">
                      <span className="font-bold text-[#5B6B66]">{t("mobile:profile.doctorPrescription", "Protocole")} : </span>
                      {rep.prescription}
                    </p>
                    <p className="text-[11px] text-[#5B6B66] italic">
                      « {rep.observations} »
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Health & Well-being entry button */}
          <div className="pt-1">
            <button
              type="button"
              data-testid="profile-health-report-btn"
              onClick={() => setIsHealthOpen(true)}
              className="w-full py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 text-[13px] font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <FaHeartbeat className="text-emerald-700" size={15} />
              <span>{t("mobile:health.entryButton", "Santé et bien-être de mon enfant")}</span>
            </button>
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-[#E5ECE9] flex items-center justify-between gap-3">
            {!isActive ? (
              <button
                type="button"
                data-testid="set-active-child-btn"
                onClick={() => {
                  setActiveChild(child.id);
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-primary text-primary hover:bg-primary-50 rounded-lg text-[13px] font-bold transition-colors"
              >
                <FaCheckCircle size={13} />
                <span>{t("mobile:persons.selectChild", "Définir comme enfant actif")}</span>
              </button>
            ) : (
              <span className="inline-flex items-center gap-1 text-[13px] font-bold text-emerald-700">
                <FaCheckCircle size={14} />
                <span>{t("mobile:persons.currentActive", "Enfant actif pour la nutrition")}</span>
              </span>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-[#17302A] hover:bg-[#204038] text-white rounded-lg text-[13px] font-bold transition-colors"
            >
              {t("common:actions.close", "Fermer")}
            </button>
          </div>
        </div>
      </div>

      <ChildHealthReportModal
        isOpen={isHealthOpen}
        onClose={() => setIsHealthOpen(false)}
        personId={child.id}
        personName={child.firstName}
      />
    </div>
  );
};
