import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { FaTimes } from "react-icons/fa";
import { useUserStore } from "../../features/user/useUserStore";
import type { ChildSex, FamilyRelation, EdemaGrade, ChildStatus } from "../../features/user/types";
import { createFamilyMember } from "../../api/persons";
import { ChildFormStep } from "./ChildFormStep";
import { ChildConsentStep } from "./ChildConsentStep";

export interface AddChildModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AddChildModal: React.FC<AddChildModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { t } = useTranslation(["mobile", "common"]);
  const { addChild } = useUserStore();

  const [step, setStep] = useState<1 | 2>(1);
  const [firstName, setFirstName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [sex, setSex] = useState<ChildSex>("F");
  const [relation] = useState<FamilyRelation>("mother");
  const [weightKg, setWeightKg] = useState("8.5");
  const [heightCm, setHeightCm] = useState("72");
  const [muacMm, setMuacMm] = useState("120");
  const [edema] = useState<EdemaGrade>("none");
  const [hasConsentChecked, setHasConsentChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) {
      setError(t("mobile:addPerson.requiredFirstName", "Le prénom est obligatoire."));
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!hasConsentChecked) {
      setError(t("mobile:consent.mustCheck", "Veuillez cocher la case de consentement."));
      return;
    }

    const muacVal = parseFloat(muacMm) || 120;
    const determinedStatus: ChildStatus =
      edema !== "none" || muacVal < 115 ? "MAS" : muacVal < 125 ? "MAM" : "normal";

    const cleanFirstName = firstName.trim();
    const formattedBirthDate = birthDate.trim() || new Date().toISOString().split("T")[0];

    setError(null);

    try {
      const created = await createFamilyMember({
        first_name: cleanFirstName,
        birth_date: formattedBirthDate,
        sex,
        relation: "child",
      });

      addChild({
        id: created.id,
        code: created.pseudonym,
        firstName: created.first_name || cleanFirstName,
        birthDate: created.birth_date || formattedBirthDate,
        sex,
        relation,
        weightKg: parseFloat(weightKg) || 8.5,
        heightCm: parseFloat(heightCm) || 72,
        muacMm: muacVal,
        edema,
        status: determinedStatus,
        validationStatus: created.status || "pending",
        doctorName: created.doctor_name || "En cours d'attribution",
        facilityName: "Centre médical de référence",
      });
    } catch {
      // Fallback offline / local
      addChild({
        firstName: cleanFirstName,
        birthDate: formattedBirthDate,
        sex,
        relation,
        weightKg: parseFloat(weightKg) || 8.5,
        heightCm: parseFloat(heightCm) || 72,
        muacMm: muacVal,
        edema,
        status: determinedStatus,
        validationStatus: "pending",
        doctorName: "En cours d'attribution",
        facilityName: "Centre de santé local",
      });
    } finally {
      onSuccess?.();
      handleClose();
    }
  };

  const handleClose = () => {
    setStep(1);
    setFirstName("");
    setBirthDate("");
    setHasConsentChecked(false);
    setError(null);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-testid="add-child-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div className="w-full max-w-[540px] rounded-xl bg-white shadow-2xl overflow-hidden border border-[#D5DEDA]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#F7F9F8] border-b border-[#E5ECE9]">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary text-white text-[12px] font-bold flex items-center justify-center">
              {step}
            </span>
            <h3 className="text-[17px] font-bold text-[#17302A]">
              {step === 1
                ? t("mobile:addPerson.title", "Ajouter un enfant")
                : t("mobile:consent.title", "Consentement légal")}
            </h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-[#5B6B66] hover:text-[#17302A] p-1.5"
            aria-label={t("common:header.close", "Fermer")}
          >
            <FaTimes size={16} />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-[13px] rounded-lg">
            {error}
          </div>
        )}

        {step === 1 ? (
          <ChildFormStep
            firstName={firstName}
            setFirstName={setFirstName}
            birthDate={birthDate}
            setBirthDate={setBirthDate}
            sex={sex}
            setSex={setSex}
            weightKg={weightKg}
            setWeightKg={setWeightKg}
            heightCm={heightCm}
            setHeightCm={setHeightCm}
            muacMm={muacMm}
            setMuacMm={setMuacMm}
            onNext={handleNext}
            onCancel={handleClose}
          />
        ) : (
          <ChildConsentStep
            firstName={firstName}
            hasConsentChecked={hasConsentChecked}
            setHasConsentChecked={setHasConsentChecked}
            onBack={() => setStep(1)}
            onSubmit={handleSubmit}
          />
        )}
      </div>
    </div>
  );
};
