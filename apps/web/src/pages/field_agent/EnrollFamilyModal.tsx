import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { CAMEROON_REGIONS } from "../../features/reference/cameroonRegions";
import { enrollFamily } from "../../api/fieldAgent";
import { ChildEnrollmentCard, type ChildDraft } from "./ChildEnrollmentCard";

interface EnrollFamilyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const EnrollFamilyModal: React.FC<EnrollFamilyModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation("common");

  const [parentFirstName, setParentFirstName] = useState("");
  const [parentLastName, setParentLastName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [parentPassword, setParentPassword] = useState("Tsotsa2026!Famille");
  const [regionCode, setRegionCode] = useState("CE");
  const [locality, setLocality] = useState("");

  const [newChildren, setNewChildren] = useState<ChildDraft[]>([
    { first_name: "", birth_date: "", sex: "M" },
  ]);

  if (!isOpen) return null;

  const handleAddChildToForm = () => {
    setNewChildren((prev) => [...prev, { first_name: "", birth_date: "", sex: "M" }]);
  };

  const handleRemoveChildFromForm = (index: number) => {
    if (newChildren.length <= 1) return;
    setNewChildren((prev) => prev.filter((_, i) => i !== index));
  };

  const handleChildFieldChange = (index: number, field: string, val: string | number) => {
    setNewChildren((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: val } : c))
    );
  };

  const parseOptionalFloat = (val: string | number | undefined) => {
    if (val === undefined || val === null || val === "") return undefined;
    const str = String(val).replace(",", ".").trim();
    const num = parseFloat(str);
    return isNaN(num) || num <= 0 ? undefined : num;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentFirstName || !parentLastName || !parentPhone) return;

    const filteredChildren = newChildren.filter(
      (c) => c.first_name.trim().length > 0 || c.birth_date
    );
    if (filteredChildren.length === 0) {
      alert("Veuillez renseigner au moins un enfant (prénom et date de naissance obligatoires).");
      return;
    }
    for (let i = 0; i < filteredChildren.length; i++) {
      const c = filteredChildren[i];
      if (c.first_name.trim().length < 2) {
        alert(`Le prénom de l'enfant #${i + 1} doit comporter au moins 2 caractères.`);
        return;
      }
      if (!c.birth_date) {
        alert(`La date de naissance de l'enfant #${i + 1} est obligatoire.`);
        return;
      }
    }

    try {
      await enrollFamily({
        parent_first_name: parentFirstName.trim(),
        parent_last_name: parentLastName.trim(),
        parent_email: parentEmail.trim() || undefined,
        parent_phone: parentPhone.trim(),
        parent_password: parentPassword,
        region_id: regionCode,
        locality: locality.trim() || undefined,
        children: filteredChildren.map((c) => ({
          first_name: c.first_name.trim(),
          birth_date: c.birth_date,
          sex: c.sex,
          weight_kg: parseOptionalFloat(c.weight_kg),
          height_cm: parseOptionalFloat(c.height_cm),
          muac_mm: c.muac_mm ? Math.round(Number(c.muac_mm)) : undefined,
        })),
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      let detail = "Erreur inattendue du serveur.";
      if (err && typeof err === "object") {
        const e = err as Record<string, unknown>;
        const innerErr = e.error as Record<string, unknown> | undefined;
        if (Array.isArray(innerErr?.details) && innerErr.details.length > 0) {
          const d0 = innerErr.details[0] as { msg?: string; message?: string };
          detail = d0.msg || d0.message || JSON.stringify(d0);
        } else if (Array.isArray(e.detail) && e.detail.length > 0) {
          const d0 = e.detail[0] as { msg?: string; message?: string };
          detail = d0.msg || d0.message || JSON.stringify(d0);
        } else if (typeof innerErr?.message === "string") {
          detail = innerErr.message;
        } else if (typeof e.detail === "string") {
          detail = e.detail;
        } else if (typeof e.message === "string") {
          detail = e.message;
        } else {
          detail = JSON.stringify(err);
        }
      } else if (typeof err === "string") {
        detail = err;
      }
      alert(`Erreur lors de l'enrôlement : ${detail}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <Card className="w-full max-w-[560px] p-6 relative my-8">
        <h2 className="text-lg font-bold text-text-primary mb-1">Enrôler une nouvelle famille</h2>
        <p className="text-xs text-text-secondary mb-4">
          Création du compte famille et des dossiers enfants rattachés.
        </p>
        <form onSubmit={handleSubmit} className="space-y-3.5 text-left">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold mb-1">Prénom du parent *</label>
              <input
                type="text"
                required
                data-testid="parent-firstname-input"
                value={parentFirstName}
                onChange={(e) => setParentFirstName(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border rounded"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Nom du parent *</label>
              <input
                type="text"
                required
                data-testid="parent-lastname-input"
                value={parentLastName}
                onChange={(e) => setParentLastName(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border rounded"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold mb-1">Téléphone *</label>
              <input
                type="tel"
                required
                data-testid="parent-phone-input"
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border rounded"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">E-mail (optionnel)</label>
              <input
                type="email"
                value={parentEmail}
                onChange={(e) => setParentEmail(e.target.value)}
                placeholder="famille@exemple.com"
                className="w-full px-3 py-1.5 text-sm border rounded"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold mb-1">Région</label>
              <select
                value={regionCode}
                onChange={(e) => setRegionCode(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border rounded bg-white"
              >
                {CAMEROON_REGIONS.map((r) => (
                  <option key={r.code} value={r.code}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Localité</label>
              <input
                type="text"
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
                placeholder="Ville, village ou quartier"
                className="w-full px-3 py-1.5 text-sm border rounded"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Mot de passe famille (pour connexion future)</label>
            <input
              type="text"
              required
              value={parentPassword}
              onChange={(e) => setParentPassword(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border rounded font-mono text-xs"
            />
          </div>

          <div className="border-t pt-3 mt-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-text-secondary uppercase">
                Enfants ({newChildren.length})
              </h3>
              <button
                type="button"
                onClick={handleAddChildToForm}
                className="text-xs text-primary font-bold hover:underline"
              >
                ➕ Ajouter un autre enfant
              </button>
            </div>

            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
              {newChildren.map((c, idx) => (
                <ChildEnrollmentCard
                  key={idx}
                  child={c}
                  index={idx}
                  canRemove={newChildren.length > 1}
                  onRemove={() => handleRemoveChildFromForm(idx)}
                  onChange={(field, val) => handleChildFieldChange(idx, field, val)}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <Button variant="outline" size="sm" onClick={onClose}>
              {t("actions.cancel")}
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              testID="btn-confirm-register-family"
            >
              Enregistrer et soumettre
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
