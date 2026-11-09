import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/Button";
import { Notice } from "../../components/Notice";
import { validateManualFood } from "../../features/admin/foodValidation";
import { useAdminStore } from "../../features/admin/useAdminStore";
import { FoodCompositionCard, type NutrientRow } from "./FoodCompositionCard";

export function AdminFoodNewPage(): React.JSX.Element {
  const navigate = useNavigate();
  const { addManualFoodBatch } = useAdminStore();

  const [nom, setNom] = useState<string>("Arachide");
  const [nomLocal, setNomLocal] = useState<string>("");
  const [categorie, setCategorie] = useState<string>("Oléagineux");
  const [etat, setEtat] = useState<string>("Graine crue");
  const [regions, setRegions] = useState<string[]>(["Ouest", "Centre"]);
  const [orkgId, setOrkgId] = useState<string>("R12458");
  const [articleRef, setArticleRef] = useState<string>("DOI: 10.1016/j.foodchem.2023.01");
  const [errors, setErrors] = useState<string[]>([]);

  const [nutriments, setNutriments] = useState<NutrientRow[]>([
    { id: "1", nom: "Énergie", valeur: 567, unite: "kcal" },
    { id: "2", nom: "Protéines", valeur: 25.8, unite: "g" },
    { id: "3", nom: "Lipides", valeur: 49.2, unite: "g" },
    { id: "4", nom: "Fer", valeur: 4.6, unite: "mg" },
    { id: "5", nom: "Calcium", valeur: 92, unite: "mg" },
  ]);

  const removeRegion = (r: string): void => {
    setRegions(regions.filter((reg) => reg !== r));
  };

  const addRegion = (): void => {
    const candidate = "Littoral";
    if (!regions.includes(candidate)) {
      setRegions([...regions, candidate]);
    }
  };

  const removeNutrient = (id: string): void => {
    setNutriments(nutriments.filter((n) => n.id !== id));
  };

  const addNutrient = (): void => {
    setNutriments([
      ...nutriments,
      { id: String(Date.now()), nom: "Zinc", valeur: 3.2, unite: "mg" },
    ]);
  };

  const handleSubmit = (isDraft: boolean): void => {
    const result = validateManualFood({
      nom,
      nomLocal,
      categorie,
      etat,
      regions,
      orkgId,
      articleRef,
      nutriments,
    });

    if (!isDraft && !result.isValid) {
      setErrors(result.errors);
      return;
    }

    addManualFoodBatch(nom, orkgId || articleRef || "Source déclarée");
    navigate("/base-aliments");
  };

  return (
    <div
      data-testid="admin-food-new-page"
      className="p-[29px] max-w-[1400px] flex flex-col gap-6"
    >
      <h1 className="text-29 font-bold text-text">Nouvel aliment · saisie manuelle</h1>

      {errors.length > 0 && (
        <Notice variant="warning" testID="food-new-errors">
          <ul className="list-disc pl-5">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </Notice>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Formulaire gauche */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-14 font-bold text-text-muted">Nom</label>
              <input
                type="text"
                data-testid="input-food-name"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                className="h-[43px] px-3.5 bg-surface-2 border border-border rounded-[6px] text-16 text-text"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-14 font-bold text-text-muted">Nom local</label>
              <input
                type="text"
                data-testid="input-food-local-name"
                value={nomLocal}
                onChange={(e) => setNomLocal(e.target.value)}
                placeholder="[nom local]"
                className="h-[43px] px-3.5 bg-surface-2 border border-border rounded-[6px] text-16 text-text"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-14 font-bold text-text-muted">Catégorie</label>
              <select
                data-testid="select-category"
                value={categorie}
                onChange={(e) => setCategorie(e.target.value)}
                className="h-[43px] px-3.5 bg-surface-2 border border-border rounded-[6px] text-16 text-text"
              >
                <option value="Oléagineux">Oléagineux ▾</option>
                <option value="Légumineuses">Légumineuses ▾</option>
                <option value="Céréales">Céréales ▾</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-14 font-bold text-text-muted">État</label>
              <select
                data-testid="select-state"
                value={etat}
                onChange={(e) => setEtat(e.target.value)}
                className="h-[43px] px-3.5 bg-surface-2 border border-border rounded-[6px] text-16 text-text"
              >
                <option value="Graine crue">Graine crue ▾</option>
                <option value="Cuit">Cuit ▾</option>
                <option value="Farine">Farine ▾</option>
              </select>
            </div>
          </div>

          {/* Régions disponibles */}
          <div className="flex flex-col gap-2">
            <span className="text-14 font-bold text-text-muted">
              Régions où il est disponible
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {regions.map((reg) => (
                <button
                  key={reg}
                  type="button"
                  data-testid={`badge-region-${reg}`}
                  onClick={() => removeRegion(reg)}
                  className="px-4 py-1.5 bg-admin-50 text-admin rounded-full text-14 font-bold flex items-center gap-1.5"
                >
                  {reg} ✕
                </button>
              ))}
              <button
                type="button"
                data-testid="btn-add-region"
                onClick={addRegion}
                className="px-4 py-1.5 bg-white border border-border text-text-muted rounded-full text-14 font-bold hover:bg-surface-2"
              >
                + Région
              </button>
            </div>
          </div>

          {/* Source ORKG et Article */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-14 font-bold text-text-muted">Comparaison ORKG</label>
              <input
                type="text"
                data-testid="input-orkg-id"
                value={orkgId}
                onChange={(e) => setOrkgId(e.target.value)}
                placeholder="R[identifiant]"
                className="h-[43px] px-3.5 bg-surface-2 border border-border rounded-[6px] text-16 text-text"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-14 font-bold text-text-muted">
                Article (référence ou DOI)
              </label>
              <input
                type="text"
                data-testid="input-article-ref"
                value={articleRef}
                onChange={(e) => setArticleRef(e.target.value)}
                placeholder="[référence]"
                className="h-[43px] px-3.5 bg-surface-2 border border-border rounded-[6px] text-16 text-text"
              />
            </div>
          </div>

          {/* Limites optimisation */}
          <div className="p-4 bg-surface-2 border border-border rounded-[7px] flex flex-col gap-1">
            <span className="text-16 font-bold text-text">
              Limites pour l'optimisation (facultatif)
            </span>
            <p className="text-14 text-text-muted">
              Portion minimale et maximale par repas (g) : à définir avec l'équipe médicale
            </p>
          </div>

          {/* Boutons actions */}
          <div className="flex flex-wrap gap-4 mt-2">
            <Button
              variant="outline"
              className="flex-1 h-[51px]"
              testID="btn-draft-food"
              onClick={() => handleSubmit(true)}
            >
              Enregistrer en brouillon
            </Button>
            <Button
              variant="primary"
              className="!bg-admin hover:!bg-slate-800 flex-1 h-[51px]"
              testID="btn-submit-food"
              onClick={() => handleSubmit(false)}
            >
              Soumettre à validation
            </Button>
          </div>
        </div>

        {/* Colonne droite : composition pour 100g */}
        <div className="lg:col-span-5">
          <FoodCompositionCard
            nutriments={nutriments}
            onAddNutrient={addNutrient}
            onRemoveNutrient={removeNutrient}
          />
        </div>
      </div>
    </div>
  );
}

export default AdminFoodNewPage;
