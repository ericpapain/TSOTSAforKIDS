import React from "react";
import { useTranslation } from "react-i18next";
import { FaShieldAlt, FaCheck, FaArrowLeft } from "react-icons/fa";

export interface ChildConsentStepProps {
  firstName: string;
  hasConsentChecked: boolean;
  setHasConsentChecked: (val: boolean) => void;
  onBack: () => void;
  onSubmit: () => void;
}

export const ChildConsentStep: React.FC<ChildConsentStepProps> = ({
  firstName,
  hasConsentChecked,
  setHasConsentChecked,
  onBack,
  onSubmit,
}) => {
  const { t } = useTranslation(["mobile", "common"]);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-3 p-3.5 bg-primary-50 rounded-lg text-primary text-[13px] font-semibold">
        <FaShieldAlt size={22} className="shrink-0" />
        <span>
          {t(
            "mobile:consent.intro",
            "Protection des données de santé selon les protocoles médicaux."
          )}
        </span>
      </div>

      <ul className="space-y-3 text-[13px] text-[#17302A]">
        <li className="flex items-start gap-2.5">
          <span className="w-5 h-5 rounded-full bg-[#E5ECE9] text-primary flex items-center justify-center shrink-0 mt-0.5">
            <FaCheck size={10} />
          </span>
          <span>
            {t(
              "mobile:consent.bullet1",
              "Les informations de {{name}} servent à suivre sa nutrition et sa croissance.",
              { name: firstName }
            )}
          </span>
        </li>
        <li className="flex items-start gap-2.5">
          <span className="w-5 h-5 rounded-full bg-[#E5ECE9] text-primary flex items-center justify-center shrink-0 mt-0.5">
            <FaCheck size={10} />
          </span>
          <span>
            {t(
              "mobile:consent.bullet2",
              "Les données sont chiffrées, sécurisées et accessibles uniquement par vous et votre soignant référent."
            )}
          </span>
        </li>
        <li className="flex items-start gap-2.5">
          <span className="w-5 h-5 rounded-full bg-[#E5ECE9] text-primary flex items-center justify-center shrink-0 mt-0.5">
            <FaCheck size={10} />
          </span>
          <span>
            {t(
              "mobile:consent.bullet3",
              "Vous pouvez modifier ces informations ou révoquer l'accès à tout moment."
            )}
          </span>
        </li>
      </ul>

      <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[12px] font-semibold">
        {t(
          "mobile:consent.doctorNotice",
          "Un médecin référent et un centre de santé seront attribués lors de la validation du dossier par l'équipe médicale."
        )}
      </div>

      <label className="flex items-start gap-3 p-3 rounded-lg border border-[#D5DEDA] bg-[#F7F9F8] cursor-pointer">
        <input
          type="checkbox"
          data-testid="child-consent-checkbox"
          checked={hasConsentChecked}
          onChange={(e) => setHasConsentChecked(e.target.checked)}
          className="mt-1 h-4 w-4 rounded text-primary focus:ring-primary"
        />
        <span className="text-[13px] font-bold text-[#17302A]">
          {t(
            "mobile:consent.guardianCheckbox",
            "J'atteste être le parent ou tuteur légal de cet enfant et j'accepte le suivi nutritionnel."
          )}
        </span>
      </label>

      <div className="flex items-center justify-between pt-2 border-t border-[#E5ECE9]">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#5B6B66] hover:text-[#17302A]"
        >
          <FaArrowLeft size={11} />
          <span>{t("common:actions.back", "Retour")}</span>
        </button>
        <button
          type="button"
          data-testid="child-submit-consent-btn"
          onClick={onSubmit}
          disabled={!hasConsentChecked}
          className="px-6 py-2.5 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white text-[13px] font-bold rounded-lg transition-colors"
        >
          {t("mobile:consent.agreeAndContinue", "Enregistrer l'enfant")}
        </button>
      </div>
    </div>
  );
};

