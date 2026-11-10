import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { formatDate, formatNumber, type SupportedLocale } from "@tsotsa/i18n";
import "../../i18n/setup";
import { Card, Button, Notice, ZScoreChart } from "../../components";
import {
  initialAminaEvaluations,
  aminaNewEvaluationRecord,
  initialAminaIntakePlan,
} from "../../features/caregiver/caregiverData";
import { useCaregiverStore } from "../../features/caregiver/useCaregiverStore";
import { ReassignDoctorModal } from "./ReassignDoctorModal";
import { PersonHistoryTable } from "./PersonHistoryTable";
import type { ZScorePoint } from "../../types";

function formatShortDayMonth(dateStr: string, locale: SupportedLocale): string {
  const parts = dateStr.split("/");
  if (parts.length !== 2) return dateStr;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const utcDate = new Date(Date.UTC(2026, month - 1, day, 12, 0, 0));
  return formatDate(utcDate, locale, { day: "2-digit", month: "2-digit" });
}

export function PersonFilePage(): React.JSX.Element {
  const { personId = "A-014" } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isUpdated = searchParams.get("updated") === "true";
  const [activeCurve, setActiveCurve] = useState<"wfl" | "muac" | "wfa">("wfl");
  const [isReassignOpen, setIsReassignOpen] = useState(false);

  const { t, i18n } = useTranslation("caregiver");
  const { t: tMedical } = useTranslation("medical");
  const locale: SupportedLocale = i18n.language === "en" ? "en" : "fr";

  const { persons, doctors, isSuperCaregiver, reassignPatient } = useCaregiverStore();
  const currentPerson =
    persons.find((p) => p.id === personId || p.code.toLowerCase().includes(personId.toLowerCase())) ||
    persons[0];

  useEffect(() => {
    document.title = t("record.pageTitle", { name: "Hamadou", id: personId });
  }, [t, personId]);

  const evaluations = isUpdated
    ? [aminaNewEvaluationRecord, ...initialAminaEvaluations]
    : initialAminaEvaluations;

  const zScorePoints: ZScorePoint[] = evaluations
    .slice()
    .reverse()
    .map((e) => ({
      date: formatShortDayMonth(e.date, locale),
      zScore: e.zScore,
      color: e.date === "12/11" ? "#F08A24" : "#534AB7",
    }));

  const getMealText = (id: string, fallback: string): string => {
    if (id === "intake-1") return t("record.meals.intake-1");
    if (id === "intake-2") return t("record.meals.intake-2");
    if (id === "intake-3") return t("record.meals.intake-3");
    if (id === "intake-4") return t("record.meals.intake-4");
    if (id === "intake-5") return t("record.meals.intake-5");
    return fallback;
  };

  return (
    <div className="flex flex-col gap-6" data-testid="person-file-page">
      {/* Top Banner if updated (W06) */}
      {isUpdated && (
        <Notice
          variant="success"
          title={tMedical("assessmentSaved.title")}
          testID="evaluation-saved-notice"
        >
          {tMedical("assessmentSaved.message", {
            date: formatShortDayMonth("12/11", locale),
            gain: formatNumber(5.2, locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
          })}
        </Notice>
      )}

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <nav className="text-12 text-text-muted mb-1">
            <span
              className="cursor-pointer hover:underline"
              onClick={() => navigate("/soignant/personnes")}
            >
              {t("nav.persons")}
            </span>{" "}
            {`› Hamadou`}
          </nav>
          <div className="flex items-center gap-3">
            <h1 className="text-24 font-bold text-text">{`Hamadou (#${personId})`}</h1>
            <span className="text-14 text-text-muted">
              {t("record.girlAge", { months: formatNumber(23, locale) })}
            </span>
            <span className="px-2.5 py-0.5 rounded text-12 font-bold bg-amber-50 text-amber-800 border border-amber-200">
              {tMedical("status.mam")}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isUpdated ? (
            <>
              <Button
                variant="outline"
                size="md"
                data-testid="back-to-dashboard-btn"
                onClick={() => navigate("/soignant")}
              >
                {t("record.backToDashboardBtn")}
              </Button>
              <Button
                variant="primary"
                space="care"
                size="md"
                data-testid="finish-demo-btn"
                onClick={() => navigate("/soignant")}
              >
                {t("record.finishDemoBtn")}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="md"
                data-testid="modify-plan-btn"
                onClick={() => navigate(`/soignant/personnes/${personId}/plan`)}
              >
                {t("record.modifyPlanBtn")}
              </Button>
              <Button
                variant="primary"
                space="care"
                size="md"
                data-testid="new-evaluation-btn"
                onClick={() => navigate(`/soignant/personnes/${personId}/evaluation`)}
              >
                {t("record.newAssessmentBtn")}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 3 columns grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Demographics */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <Card title={t("record.identityCardTitle")}>
            <dl className="flex flex-col gap-2.5 text-13">
              {[
                { label: t("record.fields.id"), value: `#${personId}`, className: "font-mono font-bold text-care text-14" },
                { label: t("record.fields.firstName"), value: "Hamadou", className: "font-bold text-text" },
                { label: t("persons.columns.doctor", "Médecin référent"), value: currentPerson?.assignedDoctorName || "Prof. Félicité Ngeufack", className: "font-bold text-[#1B4D7E]" },
                { label: t("record.fields.birthDate"), value: formatDate(new Date(Date.UTC(2024, 11, 12, 12, 0, 0)), locale), className: "text-text" },
                { label: t("record.fields.sex"), value: t("record.fields.sexFemale"), className: "text-text" },
                { label: t("record.fields.region"), value: t("persons.regions.farNorth"), className: "text-text" },
                { label: t("record.fields.facility"), value: t("persons.facilities.kousseri"), className: "text-text" },
                { label: t("record.fields.adherence7d"), value: `${formatNumber(88, locale)} %`, className: "font-bold text-care" },
              ].map((field) => (
                <div key={field.label}>
                  <dt className="text-text-muted text-12">{field.label}</dt>
                  <dd className={field.className}>{field.value}</dd>
                </div>
              ))}
            </dl>

            {isSuperCaregiver && (
              <div className="pt-3 mt-3 border-t border-border flex justify-end">
                <button
                  type="button"
                  data-testid="reassign-file-btn"
                  onClick={() => setIsReassignOpen(true)}
                  className="text-[12px] font-bold text-care hover:underline"
                >
                  {t("persons.reassign", "Réattribuer le patient")} ›
                </button>
              </div>
            )}
          </Card>

          <Card title={t("record.activeAlertsCardTitle")}>
            <div className="rounded border border-red-200 bg-red-50 p-3 text-12 text-red-800">
              <span className="font-bold block">{tMedical("alerts.missedIntakeYesterdayTitle")}</span>
              <span>{tMedical("alerts.missedIntakeMotherDetail")}</span>
            </div>
          </Card>
        </div>

        {/* Middle Column: Chart & History */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <Card
            title={t("record.chartCardTitle")}
            action={
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setActiveCurve("wfl")}
                  className={`px-2.5 py-1 text-12 font-bold rounded ${
                    activeCurve === "wfl" ? "bg-care text-white" : "bg-surface-2 text-text-muted"
                  }`}
                >
                  {t("record.chartTabWfl")}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCurve("muac")}
                  className={`px-2.5 py-1 text-12 font-bold rounded ${
                    activeCurve === "muac" ? "bg-care text-white" : "bg-surface-2 text-text-muted"
                  }`}
                >
                  {t("record.chartTabMuac")}
                </button>
              </div>
            }
          >
            <div className="h-[240px]">
              <ZScoreChart points={zScorePoints} testID="wfl-zscore-chart" />
            </div>
          </Card>

          <Card title={t("record.historyCardTitle")}>
            <PersonHistoryTable
              evaluations={evaluations}
              locale={locale}
              formatShortDayMonth={formatShortDayMonth}
            />
          </Card>
        </div>

        {/* Right Column: Intake Plan */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <Card
            title={t("record.intakePlanCardTitle")}
            action={
              <button
                type="button"
                className="text-12 text-care font-bold hover:underline"
                onClick={() => navigate(`/soignant/personnes/${personId}/plan`)}
              >
                {t("record.manageBtn")}
              </button>
            }
          >
            <div className="flex flex-col divide-y divide-border text-13">
              {initialAminaIntakePlan.map((item) => (
                <div key={item.id} className="py-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-care">{item.time}</span>
                    <span className="text-11 text-text-muted">{item.portion}</span>
                  </div>
                  <p className="text-12 text-text mt-0.5">{getMealText(item.id, item.mealName)}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => navigate(`/soignant/personnes/${personId}/plan`)}
              >
                {t("record.viewFullPlanBtn")}
              </Button>
            </div>
          </Card>
        </div>
      </div>

      <ReassignDoctorModal
        person={currentPerson}
        isOpen={isReassignOpen}
        doctors={doctors}
        onClose={() => setIsReassignOpen(false)}
        onConfirm={(pId, toDocId, reason) => {
          reassignPatient(pId, toDocId, reason);
          setIsReassignOpen(false);
        }}
      />
    </div>
  );
}
