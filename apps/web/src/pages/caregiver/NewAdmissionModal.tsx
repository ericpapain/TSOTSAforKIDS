import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { FaTimes, FaUserPlus } from "react-icons/fa";
import type { CaregiverDoctor, FollowedPerson } from "../../features/caregiver/types";

export interface NewAdmissionModalProps {
  isOpen: boolean;
  doctors: CaregiverDoctor[];
  onClose: () => void;
  onConfirm: (patientData: Partial<FollowedPerson> & { name: string; age: string; gender: "F" | "M" }) => void;
}

const REGIONS = [
  "Centre",
  "Extrême-Nord",
  "Littoral",
  "Adamaoua",
  "Est",
  "Nord",
  "Nord-Ouest",
  "Ouest",
  "Sud",
  "Sud-Ouest",
];

export const NewAdmissionModal: React.FC<NewAdmissionModalProps> = ({
  isOpen,
  doctors,
  onClose,
  onConfirm,
}) => {
  const { t } = useTranslation(["caregiver", "common"]);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"F" | "M">("F");
  const [region, setRegion] = useState("Centre");
  const [pb, setPb] = useState("118");
  const [weight, setWeight] = useState("8.5");
  const [height, setHeight] = useState("74");
  const [hasEdema, setHasEdema] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState(doctors[0]?.id || "");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(t("caregiver:persons.admissionModal.requiredName", "Le prénom du patient est obligatoire."));
      return;
    }
    if (!age.trim()) {
      setError(t("caregiver:persons.admissionModal.requiredAge", "L'âge du patient est obligatoire (ex: 1 a 6 m)."));
      return;
    }

    const pbNum = parseFloat(pb) || 120;
    const assignedDoc = doctors.find((d) => d.id === selectedDoctorId) || doctors[0];

    let status: "MAM" | "MAS" | "Normal" = "MAM";
    let statusColor = "#B7791F";

    if (hasEdema || pbNum < 115) {
      status = "MAS";
      statusColor = "#C93C3C";
    } else if (pbNum < 125) {
      status = "MAM";
      statusColor = "#B7791F";
    } else {
      status = "Normal";
      statusColor = "#0F7B5F";
    }

    onConfirm({
      name: name.trim(),
      age: age.trim(),
      gender,
      region,
      facility: assignedDoc?.facility || "CMA de démo",
      pb: pbNum,
      zScore: hasEdema ? -3.2 : pbNum < 115 ? -3.1 : pbNum < 125 ? -2.3 : -1.2,
      status,
      statusColor,
      assignedDoctorId: assignedDoc?.id,
      assignedDoctorName: assignedDoc?.name,
    });

    onClose();
    setName("");
    setAge("");
    setError(null);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-testid="new-admission-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div className="w-full max-w-[540px] rounded-xl bg-white shadow-2xl overflow-hidden border border-[#D5DEDA]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#F7F9F8] border-b border-[#E5ECE9]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-care/10 text-care flex items-center justify-center">
              <FaUserPlus size={14} />
            </div>
            <h3 className="text-[17px] font-bold text-[#17302A]">
              {t("caregiver:persons.admissionModal.title", "Nouvelle admission pédiatrique")}
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-[12px] rounded-md">
              {error}
            </div>
          )}

          {/* Nom & Âge */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] font-bold text-[#17302A] mb-1">
                {t("caregiver:persons.admissionModal.nameLabel", "Prénom de l'enfant *")}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ex. Fatima"
                data-testid="admission-name-input"
                className="w-full h-10 px-3 text-[14px] border border-[#D5DEDA] rounded-lg focus:outline-none focus:border-care"
                required
              />
            </div>
            <div>
              <label className="block text-[13px] font-bold text-[#17302A] mb-1">
                {t("caregiver:persons.admissionModal.ageLabel", "Âge *")}
              </label>
              <input
                type="text"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="ex. 1 a 6 m"
                data-testid="admission-age-input"
                className="w-full h-10 px-3 text-[14px] border border-[#D5DEDA] rounded-lg focus:outline-none focus:border-care"
                required
              />
            </div>
          </div>

          {/* Sexe & Région */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] font-bold text-[#17302A] mb-1">
                {t("caregiver:persons.admissionModal.genderLabel", "Sexe")}
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setGender("F")}
                  className={`flex-1 h-10 rounded-lg text-[13px] font-bold border transition-colors ${
                    gender === "F" ? "bg-care text-white border-care" : "bg-white text-[#17302A] border-[#D5DEDA]"
                  }`}
                >
                  {t("caregiver:persons.admissionModal.genderFemale", "Fille (F)")}
                </button>
                <button
                  type="button"
                  onClick={() => setGender("M")}
                  className={`flex-1 h-10 rounded-lg text-[13px] font-bold border transition-colors ${
                    gender === "M" ? "bg-care text-white border-care" : "bg-white text-[#17302A] border-[#D5DEDA]"
                  }`}
                >
                  {t("caregiver:persons.admissionModal.genderMale", "Garçon (M)")}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-[13px] font-bold text-[#17302A] mb-1">
                {t("caregiver:persons.admissionModal.regionLabel", "Région")}
              </label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full h-10 px-3 text-[14px] border border-[#D5DEDA] rounded-lg focus:outline-none focus:border-care bg-white"
              >
                {REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Paramètres cliniques */}
          <div className="p-3.5 bg-[#F7F9F8] rounded-lg border border-[#E5ECE9] space-y-3">
            <div className="text-[12px] font-bold uppercase tracking-wider text-[#5B6B66]">
              {t("caregiver:persons.admissionModal.clinicalSection", "Constantes cliniques initiales")}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] text-[#5B6B66] mb-0.5">
                  {t("caregiver:persons.admissionModal.weightLabel", "Poids (kg)")}
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full h-9 px-2.5 text-[13px] border border-[#D5DEDA] rounded-md bg-white focus:outline-none focus:border-care"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#5B6B66] mb-0.5">
                  {t("caregiver:persons.admissionModal.heightLabel", "Taille (cm)")}
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full h-9 px-2.5 text-[13px] border border-[#D5DEDA] rounded-md bg-white focus:outline-none focus:border-care"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#5B6B66] mb-0.5">
                  {t("caregiver:persons.admissionModal.pbLabel", "PB (mm) *")}
                </label>
                <input
                  type="number"
                  value={pb}
                  onChange={(e) => setPb(e.target.value)}
                  className="w-full h-9 px-2.5 text-[13px] border border-[#D5DEDA] rounded-md bg-white focus:outline-none focus:border-care"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={hasEdema}
                onChange={(e) => setHasEdema(e.target.checked)}
                className="w-4 h-4 text-danger rounded border-[#D5DEDA] focus:ring-danger"
              />
              <span className="text-[13px] text-danger font-bold">
                {t("caregiver:persons.admissionModal.edemaLabel", "Présence d'œdèmes bilatéraux (signe de MAS)")}
              </span>
            </label>
          </div>

          {/* Médecin assigné */}
          <div>
            <label className="block text-[13px] font-bold text-[#17302A] mb-1">
              {t("caregiver:persons.admissionModal.doctorLabel", "Médecin référent")}
            </label>
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="w-full h-10 px-3 text-[14px] border border-[#D5DEDA] rounded-lg focus:outline-none focus:border-care bg-white"
            >
              {doctors.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {`${doc.name} — ${doc.facility} (${doc.patientCount})`}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5ECE9]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[14px] text-[#5B6B66] hover:text-[#17302A] font-bold"
            >
              {t("common:actions.cancel", "Annuler")}
            </button>
            <button
              type="submit"
              data-testid="confirm-admission-btn"
              className="px-5 py-2.5 bg-care text-white text-[14px] font-bold rounded-lg hover:bg-care/90 transition-colors shadow-sm"
            >
              {t("caregiver:persons.admissionModal.submitBtn", "Confirmer l'admission")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

