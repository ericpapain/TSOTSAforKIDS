import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../../i18n/setup";
import { FaPlus, FaEye, FaUtensils, FaCheck } from "react-icons/fa";
import { AppHeader } from "../../components/AppHeader";
import { UserNavTabs } from "./UserNavTabs";
import { AddChildModal } from "./AddChildModal";
import { InviteParentModal } from "./InviteParentModal";
import { ChildProfileModal } from "./ChildProfileModal";
import { useUserStore } from "../../features/user/useUserStore";
import type { ChildMember } from "../../features/user/types";
import { useOptionalAuth } from "../../api/authContext";

export const FamilyPersonsPage: React.FC = () => {
  const { t } = useTranslation(["mobile", "common", "nutrition"]);
  const navigate = useNavigate();
  const authContext = useOptionalAuth();
  const { children, activeChildId, setActiveChild } = useUserStore();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedChildForProfile, setSelectedChildForProfile] = useState<ChildMember | null>(null);
  const [selectedChildForInvite, setSelectedChildForInvite] = useState<ChildMember | null>(null);

  const handleLogout = () => {
    authContext?.logout();
    navigate("/connexion");
  };

  const handleGiveIntake = (child: ChildMember) => {
    setActiveChild(child.id);
    navigate("/nutrition/produits/plumpy-nut");
  };

  return (
    <div className="min-h-screen bg-[#F1F3F2] font-sans">
      <AppHeader space="user" onLogout={handleLogout} />
      <UserNavTabs onOpenAddChild={() => setIsAddModalOpen(true)} />

      <main className="mx-auto max-w-[1200px] px-7 py-8">
        {/* Title and Top Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-7">
          <div>
            <h1 className="text-[24px] font-bold text-[#17302A]">
              {t("mobile:persons.title", "Mes enfants & Famille")}
            </h1>
            <p className="text-[14px] text-[#5B6B66] mt-0.5">
              {t(
                "mobile:persons.subtitle",
                "Suivi de croissance et équivalents nutritionnels pour chaque enfant."
              )}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              data-testid="add-child-top-btn"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-[13px] font-bold rounded-lg shadow-sm transition-colors"
            >
              <FaPlus size={12} />
              <span>{t("mobile:persons.addPerson", "Ajouter un enfant")}</span>
            </button>
          </div>
        </div>

        {/* Children Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {children.map((child) => {
            const isActive = child.id === activeChildId;

            return (
              <div
                key={child.id}
                data-testid={`child-card-${child.id}`}
                className={`rounded-xl border bg-white p-5 flex flex-col justify-between shadow-sm transition-all hover:shadow-md ${
                  isActive ? "border-primary ring-2 ring-primary/20" : "border-[#D5DEDA]"
                }`}
              >
                <div>
                  {/* Top card bar */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-[18px]">
                        {child.firstName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-[17px] font-bold text-[#17302A]">{child.firstName}</h2>
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#E5ECE9] text-[#5B6B66]">
                            {child.code}
                          </span>
                        </div>
                        <p className="text-[12px] text-[#5B6B66]">
                          {child.birthDate} ·{" "}
                          {child.sex === "F"
                            ? t("mobile:addPerson.sexFemale", "Fille")
                            : t("mobile:addPerson.sexMale", "Garçon")}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        child.status === "MAS"
                          ? "bg-red-100 text-red-700"
                          : child.status === "MAM"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {child.status}
                    </span>
                  </div>

                  {/* Measurements */}
                  <div className="grid grid-cols-3 gap-2 py-3 border-y border-[#E5ECE9] text-center my-3 bg-[#F7F9F8] rounded-lg">
                    <div>
                      {/* eslint-disable-next-line i18next/no-literal-string */}
                      <span className="block text-[14px] font-bold text-[#17302A]">{child.weightKg} kg</span>
                      <span className="text-[10px] text-[#5B6B66] uppercase font-bold">
                        {t("mobile:addPerson.weight", "Poids")}
                      </span>
                    </div>
                    <div>
                      {/* eslint-disable-next-line i18next/no-literal-string */}
                      <span className="block text-[14px] font-bold text-[#17302A]">{child.heightCm} cm</span>
                      <span className="text-[10px] text-[#5B6B66] uppercase font-bold">
                        {t("mobile:addPerson.height", "Taille")}
                      </span>
                    </div>
                    <div>
                      {/* eslint-disable-next-line i18next/no-literal-string */}
                      <span className="block text-[14px] font-bold text-[#17302A]">{child.muacMm} mm</span>
                      <span className="text-[10px] text-[#5B6B66] uppercase font-bold">
                        {t("mobile:addPerson.muac", "PB (mm)")}
                      </span>
                    </div>
                  </div>

                  {/* Info row */}
                  <div className="space-y-1.5 text-[12px] text-[#5B6B66] mb-4">
                    <div className="flex justify-between">
                      <span>{t("mobile:profile.attendingDoctor", "Médecin")} :</span>
                      <span className="font-bold text-primary">{child.doctorName || "Prof. Félicité Ngeufack"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t("mobile:profile.facility", "Centre")} :</span>
                      <span className="font-bold text-[#17302A]">{child.facilityName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t("mobile:history.lastIntake", "Dernière prise")} :</span>
                      <span className="font-bold text-[#17302A]">{child.lastIntakeTime || "12:30"}</span>
                    </div>
                    {child.secondParentInvite && (
                      <div className="flex justify-between items-center text-amber-700">
                        <span>{t("mobile:profile.secondParent", "2e parent")} :</span>
                        <span className="text-[11px] font-bold">
                          {child.secondParentInvite.phoneOrEmail} ({t("mobile:inviteParent.invited", "Invité")})
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="space-y-2 pt-2 border-t border-[#E5ECE9]">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      data-testid={`give-intake-btn-${child.id}`}
                      onClick={() => handleGiveIntake(child)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-primary hover:bg-primary-hover text-white text-[12px] font-bold rounded-lg transition-colors"
                    >
                      <FaUtensils size={11} />
                      <span>{t("mobile:give.giveTo", "Donner une prise")}</span>
                    </button>
                    <button
                      type="button"
                      data-testid={`view-profile-btn-${child.id}`}
                      onClick={() => setSelectedChildForProfile(child)}
                      className="px-3 py-2 border border-[#D5DEDA] hover:bg-[#F1F3F2] text-[#17302A] text-[12px] font-bold rounded-lg transition-colors flex items-center justify-center"
                      title={t("mobile:profile.title", "Fiche profil")}
                    >
                      <FaEye size={12} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1">
                    {!isActive ? (
                      <button
                        type="button"
                        onClick={() => setActiveChild(child.id)}
                        className="text-primary hover:underline font-bold"
                      >
                        {t("mobile:persons.selectChild", "Choisir pour la nutrition")}
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                        <FaCheck size={10} />
                        <span>{t("mobile:persons.activeBadge", "Enfant actif")}</span>
                      </span>
                    )}

                    {!child.secondParentInvite && (
                      <button
                        type="button"
                        data-testid={`invite-parent-btn-${child.id}`}
                        onClick={() => setSelectedChildForInvite(child)}
                        className="text-[#5B6B66] hover:text-[#17302A] hover:underline"
                      >
                        + {t("mobile:profile.inviteSecondParent", "Inviter parent")}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Modals */}
      <AddChildModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      <ChildProfileModal
        child={selectedChildForProfile}
        isOpen={selectedChildForProfile !== null}
        onClose={() => setSelectedChildForProfile(null)}
        onInviteParent={(child) => {
          setSelectedChildForProfile(null);
          setSelectedChildForInvite(child);
        }}
      />

      <InviteParentModal
        childId={selectedChildForInvite?.id || ""}
        childName={selectedChildForInvite?.firstName || ""}
        isOpen={selectedChildForInvite !== null}
        onClose={() => setSelectedChildForInvite(null)}
      />
    </div>
  );
};

export default FamilyPersonsPage;
