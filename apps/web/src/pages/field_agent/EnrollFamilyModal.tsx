import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { CAMEROON_REGIONS } from "../../features/reference/cameroonRegions";
import { enrollFamily } from "../../api/fieldAgent";

interface ChildDraft {
  first_name: string;
  birth_date: string;
  sex: "M" | "F";
  weight_kg?: number;
  height_cm?: number;
  muac_mm?: number;
}

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

    try {
      await enrollFamily({
        parent_first_name: parentFirstName.trim(),
        parent_last_name: parentLastName.trim(),
        parent_email: parentEmail.trim() || undefined,
        parent_phone: parentPhone.trim(),
        parent_password: parentPassword,
        region_id: regionCode,
        locality: locality.trim() || undefined,
        children: newChildren.map((c) => ({
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
      const errObj = err as Record<string, unknown> | undefined;
      const detail =
        (Array.isArray(errObj?.detail) ? (errObj?.detail as Array<{ msg?: string }>)[0]?.msg : null) ||
        (typeof errObj?.detail === "string" ? errObj.detail : null) ||
        (typeof errObj?.message === "string" ? errObj.message : null) ||
        (typeof err === "object" ? JSON.stringify(err) : String(err));
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
                <div key={idx} className="p-2.5 bg-slate-50 border rounded text-xs space-y-2 relative">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">Enfant #{idx + 1}</span>
                    {newChildren.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveChildFromForm(idx)}
                        className="text-red-500 hover:text-red-700 text-[11px]"
                      >
                        Retirer
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <input
                        type="text"
                        required
                        placeholder="Prénom"
                        data-testid={`child-${idx}-firstname`}
                        value={c.first_name}
                        onChange={(e) => handleChildFieldChange(idx, "first_name", e.target.value)}
                        className="w-full px-2 py-1 border rounded bg-white text-xs"
                      />
                    </div>
                    <div>
                      <select
                        value={c.sex}
                        onChange={(e) => handleChildFieldChange(idx, "sex", e.target.value)}
                        className="w-full px-2 py-1 border rounded bg-white text-xs"
                      >
                        <option value="M">Garçon</option>
                        <option value="F">Fille</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <input
                        type="date"
                        required
                        data-testid={`child-${idx}-birthdate`}
                        value={c.birth_date}
                        onChange={(e) => handleChildFieldChange(idx, "birth_date", e.target.value)}
                        className="w-full px-2 py-1 border rounded bg-white text-xs"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        data-testid={`child-${idx}-weight`}
                        placeholder="Poids (kg)"
                        value={c.weight_kg !== undefined && c.weight_kg !== null ? String(c.weight_kg) : ""}
                        onChange={(e) => handleChildFieldChange(idx, "weight_kg", e.target.value)}
                        className="w-full px-2 py-1 border rounded bg-white text-xs"
                      />
                    </div>
                  </div>
                </div>
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
