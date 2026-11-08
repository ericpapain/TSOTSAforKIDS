import { describe, it, expect } from "vitest";
import {
  calculateClinicalEvaluation,
  parseFrenchDate,
} from "../evaluationCalculator";

describe("evaluationCalculator", () => {
  it("parses French DD/MM/YYYY dates accurately", () => {
    const d = parseFrenchDate("12/11/2026");
    expect(d.getUTCFullYear()).toBe(2026);
    expect(d.getUTCMonth()).toBe(10); // 0-indexed November
    expect(d.getUTCDate()).toBe(12);
  });

  it("calculates standard Amina clinical evaluation (W05 calibration)", () => {
    const res = calculateClinicalEvaluation({
      birthDate: "12/12/2024",
      evalDate: "12/11/2026",
      weightKg: 8.5,
      lengthCm: 76.5,
      position: "Couchée",
      pbMm: 122,
      edema: "Non",
      lastWeightKg: 7.9,
      lastEvalDate: "29/10/2026",
    });

    expect(res.ageDays).toBe(700);
    expect(res.ageLabel).toContain("1 an 11 mois (700 jours)");
    expect(res.zScore).toBe(-1.17);
    expect(res.zScoreInterpretation).toContain("dans la norme");
    expect(res.pbInterpretation).toContain("modérée (115 à 125 mm)");
    expect(res.edemaInterpretation).toBe("non");
    expect(res.dailyGainGKg).toBe(5.2);
    expect(res.dailyGainLabel).toContain("repère atteint (≥ 5)");
    expect(res.proposedClassification).toContain("malnutrition aiguë modérée (PB < 125 mm)");
  });

  it("flags severe classification when edema is present", () => {
    const res = calculateClinicalEvaluation({
      evalDate: "12/11/2026",
      weightKg: 9.0,
      lengthCm: 78.0,
      position: "Couchée",
      pbMm: 130,
      edema: "+",
    });

    expect(res.edemaInterpretation).toContain("présents (+)");
    expect(res.proposedClassification).toContain("malnutrition aiguë sévère (MAS)");
  });

  it("flags severe classification when MUAC is under 115 mm", () => {
    const res = calculateClinicalEvaluation({
      evalDate: "12/11/2026",
      weightKg: 8.0,
      lengthCm: 78.0,
      position: "Debout",
      pbMm: 110,
      edema: "Non",
    });

    expect(res.pbInterpretation).toContain("sévère (< 115 mm)");
    expect(res.proposedClassification).toContain("malnutrition aiguë sévère (MAS)");
  });

  it("identifies low weight gain rate under 5 g/kg/j", () => {
    const res = calculateClinicalEvaluation({
      evalDate: "12/11/2026",
      weightKg: 8.0,
      lengthCm: 76.5,
      position: "Couchée",
      pbMm: 120,
      edema: "Non",
      lastWeightKg: 7.9,
      lastEvalDate: "29/10/2026",
    });

    expect(res.dailyGainGKg).toBeLessThan(5);
    expect(res.dailyGainLabel).toContain("repère non atteint (< 5)");
  });
});

