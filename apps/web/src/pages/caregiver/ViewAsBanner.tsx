import React from "react";
import { useTranslation } from "react-i18next";
import { useOptionalAuth } from "../../api/authContext";

export const ViewAsBanner: React.FC = () => {
  const { t } = useTranslation("caregiver");
  const auth = useOptionalAuth();
  const session = auth?.session ?? null;
  const viewAsCaregiver = auth?.viewAsCaregiver;

  if (!session?.viewAsCaregiverId) {
    return null;
  }

  const doctorName = session.viewAsCaregiverName || t("supervision.colCurrentDoctor");

  return (
    <div
      data-testid="view-as-banner"
      className="bg-[#FEF3C7] border-b border-[#F59E0B] text-[#92400E] px-4 py-2.5 flex items-center justify-between shadow-sm sticky top-0 z-50 font-sans"
    >
      <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold">
        <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#D97706] animate-pulse" />
        <span>{t("supervision.viewAsDoctorBanner", { doctor: doctorName })}</span>
      </div>
      <button
        type="button"
        data-testid="exit-view-as-btn"
        onClick={() => viewAsCaregiver?.(null, null)}
        className="px-2.5 py-1 text-xs font-bold rounded bg-white text-[#92400E] border border-[#F59E0B] hover:bg-[#FFFBEB] transition-colors"
      >
        {t("supervision.exitViewAs")}
      </button>
    </div>
  );
};
