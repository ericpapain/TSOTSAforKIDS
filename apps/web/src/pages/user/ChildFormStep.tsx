import React from "react";
import { useTranslation } from "react-i18next";
import { FaArrowRight } from "react-icons/fa";
import type { ChildSex } from "../../features/user/types";

export interface ChildFormStepProps {
  firstName: string;
  setFirstName: (val: string) => void;
  birthDate: string;
  setBirthDate: (val: string) => void;
  sex: ChildSex;
  setSex: (val: ChildSex) => void;
  weightKg: string;
  setWeightKg: (val: string) => void;
  heightCm: string;
  setHeightCm: (val: string) => void;
  muacMm: string;
  setMuacMm: (val: string) => void;
  onNext: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export const ChildFormStep: React.FC<ChildFormStepProps> = ({
  firstName,
  setFirstName,
  birthDate,
  setBirthDate,
  sex,
  setSex,
  weightKg,
  setWeightKg,
  heightCm,
  setHeightCm,
  muacMm,
  setMuacMm,
  onNext,
  onCancel,
}) => {
  const { t } = useTranslation(["mobile", "common"]);

  return (
    <form onSubmit={onNext} className="p-6 space-y-4">
      <div>
        <label className="block text-[13px] font-bold text-[#17302A] mb-1">
          {t("mobile:addPerson.firstName", "Prénom de l'enfant")} *
        </label>
        <input
          type="text"
          data-testid="child-firstname-input"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="Ex : Amina"
          className="w-full px-3.5 py-2.5 border border-[#D5DEDA] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-primary"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[13px] font-bold text-[#17302A] mb-1">
            {t("mobile:addPerson.birthDate", "Date de naissance")}
          </label>
          <input
            type="date"
            data-testid="child-birthdate-input"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="w-full px-3.5 py-2 border border-[#D5DEDA] rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-[13px] font-bold text-[#17302A] mb-1">
            {t("mobile:addPerson.sex", "Sexe")}
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSex("F")}
              className={`flex-1 py-2 rounded-lg text-[13px] font-bold border transition-colors ${
                sex === "F"
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-[#17302A] border-[#D5DEDA]"
              }`}
            >
              {t("mobile:addPerson.sexFemale", "Fille")}
            </button>
            <button
              type="button"
              onClick={() => setSex("M")}
              className={`flex-1 py-2 rounded-lg text-[13px] font-bold border transition-colors ${
                sex === "M"
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-[#17302A] border-[#D5DEDA]"
              }`}
            >
              {t("mobile:addPerson.sexMale", "Garçon")}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-[12px] font-bold text-[#5B6B66] mb-1">
            {t("mobile:addPerson.weight", "Poids (kg)")}
          </label>
          <input
            type="number"
            step="0.1"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            className="w-full px-3 py-1.5 border border-[#D5DEDA] rounded-md text-[13px]"
          />
        </div>
        <div>
          <label className="block text-[12px] font-bold text-[#5B6B66] mb-1">
            {t("mobile:addPerson.height", "Taille (cm)")}
          </label>
          <input
            type="number"
            step="0.5"
            value={heightCm}
            onChange={(e) => setHeightCm(e.target.value)}
            className="w-full px-3 py-1.5 border border-[#D5DEDA] rounded-md text-[13px]"
          />
        </div>
        <div>
          <label className="block text-[12px] font-bold text-[#5B6B66] mb-1">
            {t("mobile:addPerson.muac", "PB (mm)")}
          </label>
          <input
            type="number"
            value={muacMm}
            onChange={(e) => setMuacMm(e.target.value)}
            className="w-full px-3 py-1.5 border border-[#D5DEDA] rounded-md text-[13px]"
          />
        </div>
      </div>

      <div className="pt-2 flex justify-end gap-3 border-t border-[#E5ECE9]">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-[13px] font-bold text-[#5B6B66] hover:text-[#17302A]"
        >
          {t("common:actions.cancel", "Annuler")}
        </button>
        <button
          type="submit"
          data-testid="child-next-step-btn"
          className="inline-flex items-center gap-1.5 px-5 py-2 bg-primary hover:bg-primary-hover text-white text-[13px] font-bold rounded-lg transition-colors"
        >
          <span>{t("common:actions.next", "Étape suivante")}</span>
          <FaArrowRight size={11} />
        </button>
      </div>
    </form>
  );
};

