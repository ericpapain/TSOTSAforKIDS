import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { FaTimes, FaUserFriends, FaPaperPlane, FaCheck } from "react-icons/fa";
import { useUserStore } from "../../features/user/useUserStore";

export interface InviteParentModalProps {
  isOpen: boolean;
  childId: string;
  childName: string;
  onClose: () => void;
}

export const InviteParentModal: React.FC<InviteParentModalProps> = ({
  isOpen,
  childId,
  childName,
  onClose,
}) => {
  const { t } = useTranslation(["mobile", "common"]);
  const { inviteSecondParent } = useUserStore();
  const [contact, setContact] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact.trim()) {
      setError(t("mobile:inviteParent.requiredContact", "Veuillez saisir un numéro ou email."));
      return;
    }
    inviteSecondParent(childId, contact.trim());
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setContact("");
      onClose();
    }, 1500);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-testid="invite-parent-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div className="w-full max-w-[480px] rounded-xl bg-white shadow-2xl overflow-hidden border border-[#D5DEDA]">
        <div className="flex items-center justify-between px-6 py-4 bg-[#F7F9F8] border-b border-[#E5ECE9]">
          <div className="flex items-center gap-2">
            <FaUserFriends className="text-primary text-[18px]" />
            <h3 className="text-[16px] font-bold text-[#17302A]">
              {t("mobile:inviteParent.title", "Inviter le second parent")}
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

        {isSuccess ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-[20px]">
              <FaCheck size={20} />
            </div>
            <h4 className="text-[16px] font-bold text-[#17302A]">
              {t("mobile:inviteParent.sentTitle", "Invitation envoyée")}
            </h4>
            <p className="text-[13px] text-[#5B6B66]">
              {t(
                "mobile:inviteParent.sentBody",
                "Un lien sécurisé a été transmis au second parent pour suivre {{name}} en commun.",
                { name: childName }
              )}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <p className="text-[13px] text-[#5B6B66]">
              {t(
                "mobile:inviteParent.description",
                "Partagez le suivi nutritionnel de {{name}} avec l'autre parent ou tuteur légal.",
                { name: childName }
              )}
            </p>

            {error && (
              <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-[12px] rounded-md">
                {error}
              </div>
            )}

            <div>
              <label className="block text-[13px] font-bold text-[#17302A] mb-1">
                {t("mobile:inviteParent.phoneOrEmail", "Numéro de téléphone (+237) ou E-mail")} *
              </label>
              <input
                type="text"
                data-testid="invite-parent-contact-input"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="+237 6... ou parent@exemple.com"
                className="w-full px-3.5 py-2.5 border border-[#D5DEDA] rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            <div className="pt-2 flex justify-end gap-3 border-t border-[#E5ECE9]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-[13px] font-bold text-[#5B6B66] hover:text-[#17302A]"
              >
                {t("common:actions.cancel", "Annuler")}
              </button>
              <button
                type="submit"
                data-testid="invite-parent-submit-btn"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-[13px] font-bold rounded-lg transition-colors"
              >
                <FaPaperPlane size={11} />
                <span>{t("mobile:inviteParent.sendButton", "Envoyer l'invitation")}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
