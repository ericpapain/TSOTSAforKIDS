import React, { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { formatDate, formatNumber, type SupportedLocale } from "@tsotsa/i18n";
import "../../i18n/setup";
import { Card, Button } from "../../components";
import { calculateClinicalEvaluation } from "../../features/caregiver/evaluationCalculator";

export function NewEvaluationPage(): React.JSX.Element {
  const { personId = "A-014" } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation("caregiver");
  const locale: SupportedLocale = i18n.language === "en" ? "en" : "fr";

  useEffect(() => {
    document.title = t("assessment.pageTitle", { name: "Hamadou", id: personId });
  }, [t, personId]);

  const [evalDate, setEvalDate] = useState("12/11/2026");
  const [weightKg, setWeightKg] = useState("8,5");
  const [lengthCm, setLengthCm] = useState("76,5");
  const [position, setPosition] = useState<"Couchée" | "Debout">("Couchée");
  const [pbMm, setPbMm] = useState("122");
  const [edema, setEdema] = useState<"Non" | "+" | "++" | "+++">("Non");
  const [observations, setObservations] = useState(() => t("assessment.defaultObservations"));

  useEffect(() => {
    setObservations((prev) => {
      const frDefault =
        "Bonne tolérance de la bouillie enrichie. Mère attentive et présente.";
      const enDefault =
        "Good tolerance of enriched porridge. Attentive and present mother.";
      if (prev === frDefault || prev === enDefault) {
        return t("assessment.defaultObservations");
      }
      return prev;
    });
  }, [t]);

  const numWeight = parseFloat(weightKg.replace(",", "."));
  const numLength = parseFloat(lengthCm.replace(",", "."));
  const numPb = parseInt(pbMm, 10);

  const clinicalResult = useMemo(() => {
    return calculateClinicalEvaluation({
      birthDate: "12/12/2024",
      evalDate,
      weightKg: isNaN(numWeight) ? 8.5 : numWeight,
      lengthCm: isNaN(numLength) ? 76.5 : numLength,
      position,
      pbMm: isNaN(numPb) ? 122 : numPb,
      edema,
      lastWeightKg: 7.9,
      lastEvalDate: "29/10/2026",
      locale,
    });
  }, [evalDate, numWeight, numLength, position, numPb, edema, locale]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/soignant/personnes/${personId}?updated=true`);
  };

  return (
    <div className="flex flex-col gap-6" data-testid="new-evaluation-page">
      <div>
        <nav className="text-12 text-text-muted mb-1">
          <span
            className="cursor-pointer hover:underline"
            onClick={() => navigate("/soignant/personnes")}
          >
            {t("nav.persons")}
          </span>{" "}
          {"› "}
          <span
            className="cursor-pointer hover:underline"
            onClick={() => navigate(`/soignant/personnes/${personId}`)}
          >
            {`Hamadou`}
          </span>{" "}
          {`› ${t("assessment.breadcrumbNew")}`}
        </nav>
        <h1 className="text-24 font-bold text-text">
          {t("assessment.title", { name: "Hamadou", id: personId })}
        </h1>
        <p className="text-14 text-text-muted mt-1">
          {t("assessment.subtitle", {
            birthDate: formatDate(new Date(Date.UTC(2024, 11, 12, 12, 0, 0)), locale),
          })}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form column */}
        <div className="lg:col-span-7">
          <Card title={t("assessment.formCardTitle")}>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label htmlFor="eval-date-input" className="block text-13 font-bold text-text mb-1">
                  {t("assessment.dateLabel")}
                </label>
                <input
                  id="eval-date-input"
                  type="text"
                  value={evalDate}
                  onChange={(e) => setEvalDate(e.target.value)}
                  className="w-full rounded-input border border-border bg-white px-3 py-2 text-14 text-text"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="weight-input" className="block text-13 font-bold text-text mb-1">
                    {t("assessment.weightLabel")}
                  </label>
                  <input
                    id="weight-input"
                    type="text"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    data-testid="eval-weight-input"
                    className="w-full rounded-input border border-border bg-white px-3 py-2 text-14 text-text"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="length-input" className="block text-13 font-bold text-text mb-1">
                    {t("assessment.lengthLabel")}
                  </label>
                  <input
                    id="length-input"
                    type="text"
                    value={lengthCm}
                    onChange={(e) => setLengthCm(e.target.value)}
                    data-testid="eval-length-input"
                    className="w-full rounded-input border border-border bg-white px-3 py-2 text-14 text-text"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="position-select" className="block text-13 font-bold text-text mb-1">
                    {t("assessment.positionLabel")}
                  </label>
                  <select
                    id="position-select"
                    value={position}
                    onChange={(e) => setPosition(e.target.value as "Couchée" | "Debout")}
                    className="w-full rounded-input border border-border bg-white px-3 py-2 text-14 text-text"
                  >
                    <option value="Couchée">{t("assessment.positionLying")}</option>
                    <option value="Debout">{t("assessment.positionStanding")}</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="pb-input" className="block text-13 font-bold text-text mb-1">
                    {t("assessment.muacLabel")}
                  </label>
                  <input
                    id="pb-input"
                    type="text"
                    value={pbMm}
                    onChange={(e) => setPbMm(e.target.value)}
                    data-testid="eval-pb-input"
                    className="w-full rounded-input border border-border bg-white px-3 py-2 text-14 text-text"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="edema-select" className="block text-13 font-bold text-text mb-1">
                  {t("assessment.edemaLabel")}
                </label>
                <select
                  id="edema-select"
                  value={edema}
                  onChange={(e) => setEdema(e.target.value as "Non" | "+" | "++" | "+++")}
                  className="w-full rounded-input border border-border bg-white px-3 py-2 text-14 text-text"
                >
                  <option value="Non">{t("assessment.edemaNone")}</option>
                  <option value="+">{t("assessment.edemaPlus1")}</option>
                  <option value="++">{t("assessment.edemaPlus2")}</option>
                  <option value="+++">{t("assessment.edemaPlus3")}</option>
                </select>
              </div>

              <div>
                <label htmlFor="obs-textarea" className="block text-13 font-bold text-text mb-1">
                  {t("assessment.observationsLabel")}
                </label>
                <textarea
                  id="obs-textarea"
                  rows={3}
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  className="w-full rounded-input border border-border bg-white px-3 py-2 text-14 text-text"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => navigate(`/soignant/personnes/${personId}`)}
                >
                  {t("assessment.cancelBtn")}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  space="care"
                  size="md"
                  data-testid="submit-evaluation-btn"
                >
                  {t("assessment.submitBtn")}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Real-time calculation column */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <Card
            title={t("assessment.calcCardTitle")}
            subtitle={t("assessment.calcCardSubtitle")}
          >
            <div className="flex flex-col gap-3 text-13" data-testid="clinical-calc-results">
              <div className="flex justify-between py-1.5 border-b border-border">
                <span className="text-text-muted">{t("assessment.calculatedAge")}</span>
                <span className="font-bold text-text">{clinicalResult.ageLabel}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border">
                <span className="text-text-muted">{t("assessment.weightForLength")}</span>
                <span className="font-bold text-care">
                  {`z = ${formatNumber(clinicalResult.zScore, locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} → ${clinicalResult.zScoreInterpretation}`}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border">
                <span className="text-text-muted">{t("assessment.muacResultLabel")}</span>
                <span className="font-bold text-text">
                  {`${formatNumber(numPb || 122, locale)} mm → ${clinicalResult.pbInterpretation}`}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border">
                <span className="text-text-muted">{t("assessment.edemaResultLabel")}</span>
                <span className="font-bold text-text">{clinicalResult.edemaInterpretation}</span>
              </div>
              {clinicalResult.dailyGainLabel && (
                <div className="flex justify-between py-1.5 border-b border-border">
                  <span className="text-text-muted">{t("assessment.dailyGainLabel")}</span>
                  <span className="font-bold text-care">{clinicalResult.dailyGainLabel}</span>
                </div>
              )}

              {/* Proposed classification box */}
              <div className="mt-3 rounded-card bg-amber-50 border border-amber-200 p-3.5 text-13 text-amber-900">
                <span className="font-bold block text-14" data-testid="proposed-classification">
                  {clinicalResult.proposedClassification}
                </span>
                <p className="text-12 text-amber-800 mt-1">
                  {clinicalResult.recommendationNote}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

