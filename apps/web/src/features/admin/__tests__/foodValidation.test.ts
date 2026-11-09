import { describe, it, expect } from "vitest";
import {
  validateFoodComposition,
  validateManualFood,
  canValidateBatch,
  summarizeChecks,
} from "../foodValidation";

describe("foodValidation", () => {
  describe("validateFoodComposition", () => {
    it("valide les valeurs plausibles", () => {
      const res = validateFoodComposition("Protéines", 25.8, "g");
      expect(res.status).toBe("valid");
      expect(res.message).toBe("✓ valide");
    });

    it("rejette les lipides > 100 g", () => {
      const res = validateFoodComposition("Lipides", 199, "g");
      expect(res.status).toBe("error");
      expect(res.message).toContain("hors limites");
    });

    it("rejette l'énergie > 900 kcal", () => {
      const res = validateFoodComposition("Énergie", 950, "kcal");
      expect(res.status).toBe("error");
      expect(res.message).toContain("hors limites");
    });

    it("avertit si l'unité est manquante", () => {
      const res = validateFoodComposition("Vitamine A", 10, "");
      expect(res.status).toBe("warning");
      expect(res.message).toContain("unité manquante");
    });
  });

  describe("validateManualFood", () => {
    it("valide une saisie complète avec source", () => {
      const res = validateManualFood({
        nom: "Arachide",
        categorie: "Oléagineux",
        etat: "Graine crue",
        regions: ["Ouest", "Centre"],
        orkgId: "R12458",
        nutriments: [{ nom: "Protéines", valeur: 25.8, unite: "g" }],
      });
      expect(res.isValid).toBe(true);
      expect(res.errors).toHaveLength(0);
    });

    it("échoue si le nom est manquant", () => {
      const res = validateManualFood({
        nom: "",
        categorie: "Oléagineux",
        etat: "Graine crue",
        regions: [],
        orkgId: "R12458",
        nutriments: [{ nom: "Protéines", valeur: 25.8, unite: "g" }],
      });
      expect(res.isValid).toBe(false);
      expect(res.errors).toContain("Le nom de l'aliment est obligatoire.");
    });

    it("échoue si aucune source n'est fournie", () => {
      const res = validateManualFood({
        nom: "Soja",
        categorie: "Légumineuses",
        etat: "Graine crue",
        regions: ["Ouest"],
        nutriments: [{ nom: "Protéines", valeur: 36, unite: "g" }],
      });
      expect(res.isValid).toBe(false);
      expect(res.errors[0]).toContain("Une source");
    });
  });

  describe("canValidateBatch", () => {
    it("interdit à l'auteur de valider son propre lot", () => {
      const res = canValidateBatch("Fidel", "Fidel");
      expect(res.allowed).toBe(false);
      expect(res.reason).toContain("Interdiction de valider son propre lot");
    });

    it("autorise un second lecteur différent de l'auteur", () => {
      const res = canValidateBatch("Fidel", "Équipe TSOTSA");
      expect(res.allowed).toBe(true);
      expect(res.reason).toBeUndefined();
    });
  });

  describe("summarizeChecks", () => {
    it("compte correctement valides, erreurs et avertissements", () => {
      const summary = summarizeChecks([
        { aliment: "A", nutriment: "P", valeur: "10", unite: "g", status: "valid", message: "ok" },
        { aliment: "B", nutriment: "L", valeur: "199", unite: "g", status: "error", message: "err" },
        { aliment: "C", nutriment: "V", valeur: "—", unite: "—", status: "warning", message: "warn" },
      ]);
      expect(summary.validCount).toBe(1);
      expect(summary.errorCount).toBe(1);
      expect(summary.warningCount).toBe(1);
    });
  });
});

