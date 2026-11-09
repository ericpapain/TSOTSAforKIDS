import type { NutrientCheckItem, ImportRowCheckCode } from "./types";

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

export type FoodManualErrorCode =
  | "ERR_NAME_REQUIRED"
  | "ERR_SOURCE_REQUIRED"
  | "ERR_NUTRIENT_REQUIRED";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  errorCodes: FoodManualErrorCode[];
  warnings: string[];
}

export function validateFoodComposition(
  nutrient: string,
  value: number,
  unit: string
): { status: "valid" | "error" | "warning"; code: ImportRowCheckCode; message: string } {
  if (!unit || unit.trim() === "") {
    return { status: "warning", code: "WARN_MISSING_UNIT", message: "⚠ unité manquante" };
  }
  const cleanNutrient = nutrient.toLowerCase();
  if (cleanNutrient.includes("lipide") || cleanNutrient.includes("protéine")) {
    if (value > 100) {
      return {
        status: "error",
        code: "ERR_OUT_OF_BOUNDS_100G",
        message: "✕ hors limites (max 100 g)",
      };
    }
  }
  if (cleanNutrient.includes("énergie") && value > 900) {
    return {
      status: "error",
      code: "ERR_OUT_OF_BOUNDS_900KCAL",
      message: "✕ hors limites (max 900 kcal)",
    };
  }
  return { status: "valid", code: "VALID", message: "✓ valide" };
}

export function validateManualFood(food: FoodManualInput): ValidationResult {
  const errors: string[] = [];
  const errorCodes: FoodManualErrorCode[] = [];
  const warnings: string[] = [];

  if (!food.nom || food.nom.trim().length === 0) {
    errors.push("Le nom de l'aliment est obligatoire.");
    errorCodes.push("ERR_NAME_REQUIRED");
  }
  if (!food.orkgId && !food.articleRef) {
    errors.push("Une source (comparaison ORKG ou référence d'article) est obligatoire.");
    errorCodes.push("ERR_SOURCE_REQUIRED");
  }
  if (food.nutriments.length === 0) {
    errors.push("Au moins un nutriment doit être renseigné.");
    errorCodes.push("ERR_NUTRIENT_REQUIRED");
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
    errorCodes,
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

