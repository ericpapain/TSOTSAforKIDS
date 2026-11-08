import type { NutrientCheckItem } from "./types";

export interface FoodManualInput {
  nom: string;
  nomLocal?: string;
  categorie: string;
  etat: string;
  regions: string[];
  orkgId?: string;
  articleRef?: string;
  nutriments: Array<{
    nom: string;
    valeur: number;
    unite: string;
  }>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateFoodComposition(
  nutrient: string,
  value: number,
  unit: string
): { status: "valid" | "error" | "warning"; message: string } {
  if (!unit || unit.trim() === "") {
    return { status: "warning", message: "⚠ unité manquante" };
  }
  const cleanNutrient = nutrient.toLowerCase();
  if (cleanNutrient.includes("lipide") || cleanNutrient.includes("protéine")) {
    if (value > 100) {
      return { status: "error", message: "✕ hors limites (max 100 g)" };
    }
  }
  if (cleanNutrient.includes("énergie") && value > 900) {
    return { status: "error", message: "✕ hors limites (max 900 kcal)" };
  }
  return { status: "valid", message: "✓ valide" };
}

export function validateManualFood(food: FoodManualInput): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!food.nom || food.nom.trim().length === 0) {
    errors.push("Le nom de l'aliment est obligatoire.");
  }
  if (!food.orkgId && !food.articleRef) {
    errors.push("Une source (comparaison ORKG ou référence d'article) est obligatoire.");
  }
  if (food.nutriments.length === 0) {
    errors.push("Au moins un nutriment doit être renseigné.");
  }

  for (const n of food.nutriments) {
    const check = validateFoodComposition(n.nom, n.valeur, n.unite);
    if (check.status === "error") {
      errors.push(`${n.nom}: ${check.message}`);
    } else if (check.status === "warning") {
      warnings.push(`${n.nom}: ${check.message}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

export function canValidateBatch(
  submitter: string,
  currentReviewer: string
): { allowed: boolean; reason?: string } {
  const normSubmitter = submitter.trim().toLowerCase();
  const normReviewer = currentReviewer.trim().toLowerCase();

  if (normSubmitter === normReviewer) {
    return {
      allowed: false,
      reason: "Interdiction de valider son propre lot : une deuxième personne doit relire avant publication.",
    };
  }
  return { allowed: true };
}

export function summarizeChecks(items: NutrientCheckItem[]): {
  validCount: number;
  errorCount: number;
  warningCount: number;
} {
  return {
    validCount: items.filter((i) => i.status === "valid").length,
    errorCount: items.filter((i) => i.status === "error").length,
    warningCount: items.filter((i) => i.status === "warning").length,
  };
}

