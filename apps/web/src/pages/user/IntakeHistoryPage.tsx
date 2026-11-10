import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../../i18n/setup";
import { FaUtensils, FaCheckCircle, FaClock, FaFilter } from "react-icons/fa";
import { AppHeader } from "../../components/AppHeader";
import { UserNavTabs } from "./UserNavTabs";
import { useUserStore } from "../../features/user/useUserStore";
import { useOptionalAuth } from "../../api/authContext";

export const IntakeHistoryPage: React.FC = () => {
  const { t } = useTranslation(["mobile", "common", "nutrition"]);
  const navigate = useNavigate();
  const authContext = useOptionalAuth();
  const { intakes, children } = useUserStore();
  const [filterChildId, setFilterChildId] = useState<string>("all");

  const handleLogout = () => {
    authContext?.logout();
    navigate("/connexion");
  };

  const filteredIntakes = intakes.filter((it) => {
    if (filterChildId === "all") return true;
    return it.childId === filterChildId;
  });

  return (
    <div className="min-h-screen bg-[#F1F3F2] font-sans">
      <AppHeader space="user" onLogout={handleLogout} />
      <UserNavTabs />

      <main className="mx-auto max-w-[1200px] px-7 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-7">
          <div>
            <h1 className="text-[24px] font-bold text-[#17302A]">
              {t("mobile:history.title", "Historique des prises")}
            </h1>
            <p className="text-[14px] text-[#5B6B66] mt-0.5">
              {t("mobile:history.subtitle", "Journal complet des repas et suppléments nutritionnels donnés.")}
            </p>
          </div>

          <button
            type="button"
            data-testid="give-intake-history-btn"
            onClick={() => navigate("/nutrition/produits/plumpy-nut")}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-[13px] font-bold rounded-lg shadow-sm transition-colors"
          >
            <FaUtensils size={12} />
            <span>{t("mobile:history.newIntakeBtn", "Enregistrer une prise")}</span>
          </button>
        </div>

        {/* Filter by Child */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto py-1">
          <span className="text-[13px] font-bold text-[#5B6B66] flex items-center gap-1.5 mr-1">
            <FaFilter size={11} />
            <span>{t("mobile:history.filterChild", "Filtrer :")}</span>
          </span>
          <button
            type="button"
            onClick={() => setFilterChildId("all")}
            className={`px-3.5 py-1.5 rounded-full text-[12px] font-bold transition-colors ${
              filterChildId === "all"
                ? "bg-primary text-white shadow-xs"
                : "bg-white text-[#5B6B66] hover:bg-[#E5ECE9]"
            }`}
          >
            {t("mobile:history.allChildren", "Tous les enfants")} ({intakes.length})
          </button>
          {children.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setFilterChildId(c.id)}
              className={`px-3.5 py-1.5 rounded-full text-[12px] font-bold transition-colors ${
                filterChildId === c.id
                  ? "bg-primary text-white shadow-xs"
                  : "bg-white text-[#5B6B66] hover:bg-[#E5ECE9]"
              }`}
            >
              {c.firstName} ({intakes.filter((i) => i.childId === c.id).length})
            </button>
          ))}
        </div>

        {/* Intakes List / Table */}
        <div className="rounded-xl border border-[#D5DEDA] bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-[#F7F9F8] border-b border-[#E5ECE9] flex items-center justify-between">
            <h2 className="text-[15px] font-bold text-[#17302A]">
              {t("mobile:history.recordedIntakes", "Prises nutritionnelles enregistrées")} (
              {filteredIntakes.length})
            </h2>
            <div className="text-[12px] text-[#5B6B66] flex items-center gap-1">
              <FaClock size={11} />
              <span>{t("mobile:history.nextIntake", "Prochaine prise conseillée : 19h00")}</span>
            </div>
          </div>

          {filteredIntakes.length === 0 ? (
            <div className="p-12 text-center text-[#5B6B66] space-y-2">
              <p className="text-[14px] font-semibold">
                {t("mobile:history.empty", "Aucune prise enregistrée pour cet enfant.")}
              </p>
              <button
                type="button"
                onClick={() => navigate("/nutrition/produits/plumpy-nut")}
                className="text-primary hover:underline font-bold text-[13px]"
              >
                {t("mobile:history.firstIntakeLink", "Consulter les aliments équivalents et donner une prise")}
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[#E5ECE9]">
              {filteredIntakes.map((intake) => (
                <div
                  key={intake.id}
                  data-testid={`intake-row-${intake.id}`}
                  className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F7F9F8] transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                      <FaCheckCircle size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[15px] font-bold text-[#17302A]">{intake.foodName}</span>
                        <span className="text-[12px] font-bold text-primary px-2 py-0.5 rounded-full bg-primary-50">
                          {intake.quantity} {intake.unit}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[12px] text-[#5B6B66]">
                        <span className="font-semibold text-[#17302A]">{intake.childName}</span>
                        <span>·</span>
                        <span>{intake.date}</span>
                        <span>·</span>
                        <span>{intake.time}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <span className="text-[12px] font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800">
                      {t("mobile:history.givenLabel", "C'est donné ✓")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default IntakeHistoryPage;
