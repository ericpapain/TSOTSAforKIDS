import React, { useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Card, Button, Notice, ZScoreChart } from "../../components";
import {
  initialAminaEvaluations,
  aminaNewEvaluationRecord,
  initialAminaIntakePlan,
} from "../../features/caregiver/caregiverData";
import type { ZScorePoint } from "../../types";

export function PersonFilePage(): React.JSX.Element {
  const { personId = "A-014" } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isUpdated = searchParams.get("updated") === "true";
  const [activeCurve, setActiveCurve] = useState<"wfl" | "muac" | "wfa">("wfl");

  const evaluations = isUpdated
    ? [aminaNewEvaluationRecord, ...initialAminaEvaluations]
    : initialAminaEvaluations;

  const zScorePoints: ZScorePoint[] = evaluations
    .slice()
    .reverse()
    .map((e) => ({
      date: e.date,
      zScore: e.zScore,
      color: e.date === "12/11" ? "#F08A24" : "#534AB7",
    }));

  return (
    <div className="flex flex-col gap-6" data-testid="person-file-page">
      {/* Top Banner if updated (W06) */}
      {isUpdated && (
        <Notice
          variant="success"
          title="Évaluation enregistrée"
          testID="evaluation-saved-notice"
        >
          Évaluation du 12/11 enregistrée. Gain : 5,2 g/kg/j. Poids-pour-taille normal ; PB encore &lt; 125 mm : poursuivre.
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
              Personnes suivies
            </span>{" "}
            › Hamadou
          </nav>
          <div className="flex items-center gap-3">
            <h1 className="text-24 font-bold text-text">Hamadou (#{personId})</h1>
            <span className="text-14 text-text-muted">Fille · 23 mois</span>
            <span className="px-2.5 py-0.5 rounded text-12 font-bold bg-amber-50 text-amber-800 border border-amber-200">
              MAM
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
                Retour au tableau de bord
              </Button>
              <Button
                variant="primary"
                space="care"
                size="md"
                data-testid="finish-demo-btn"
                onClick={() => navigate("/soignant")}
              >
                Terminer la démo ›
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
                Modifier le plan de prises
              </Button>
              <Button
                variant="primary"
                space="care"
                size="md"
                data-testid="new-evaluation-btn"
                onClick={() => navigate(`/soignant/personnes/${personId}/evaluation`)}
              >
                Nouvelle évaluation
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 3 columns grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Demographics */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <Card title="Identité & Dossier">
            <dl className="flex flex-col gap-2.5 text-13">
              <div>
                <dt className="text-text-muted text-12">Identifiant</dt>
                <dd className="font-mono font-bold text-care text-14">#{personId}</dd>
              </div>
              <div>
                <dt className="text-text-muted text-12">Prénom</dt>
                <dd className="font-bold text-text">Hamadou</dd>
              </div>
              <div>
                <dt className="text-text-muted text-12">Date de naissance</dt>
                <dd className="text-text">12/12/2024</dd>
              </div>
              <div>
                <dt className="text-text-muted text-12">Sexe</dt>
                <dd className="text-text">Féminin</dd>
              </div>
              <div>
                <dt className="text-text-muted text-12">Région</dt>
                <dd className="text-text">Extrême-Nord</dd>
              </div>
              <div>
                <dt className="text-text-muted text-12">Établissement</dt>
                <dd className="text-text">CMA de Kousséri</dd>
              </div>
              <div>
                <dt className="text-text-muted text-12">Observance 7 jours</dt>
                <dd className="font-bold text-care">88 %</dd>
              </div>
            </dl>
          </Card>

          <Card title="Alertes en cours">
            <div className="rounded border border-red-200 bg-red-50 p-3 text-12 text-red-800">
              <span className="font-bold block">Prise sautée hier (19h00)</span>
              <span>3e rappel sans confirmation de la mère.</span>
            </div>
          </Card>
        </div>

        {/* Middle Column: Chart & History */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <Card
            title="Courbe poids-pour-taille (OMS 2006)"
            action={
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setActiveCurve("wfl")}
                  className={`px-2 py-1 rounded text-11 font-bold ${
                    activeCurve === "wfl" ? "bg-care text-white" : "bg-surface-2 text-text-muted"
                  }`}
                >
                  Poids-pour-taille
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCurve("muac")}
                  className={`px-2 py-1 rounded text-11 font-bold ${
                    activeCurve === "muac" ? "bg-care text-white" : "bg-surface-2 text-text-muted"
                  }`}
                >
                  PB
                </button>
              </div>
            }
          >
            <div className="py-2" data-testid="growth-chart-wrapper">
              <ZScoreChart
                points={zScorePoints}
                height={260}
                currentZScore={zScorePoints[zScorePoints.length - 1]?.zScore}
                testID="growth-chart"
              />
            </div>
          </Card>

          <Card title="Historique des évaluations">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-13 border-collapse">
                <thead>
                  <tr className="border-b border-border bg-surface-2 text-12 font-bold text-text-muted">
                    <th className="py-2 px-2.5">Date</th>
                    <th className="py-2 px-2.5">Poids</th>
                    <th className="py-2 px-2.5">Taille</th>
                    <th className="py-2 px-2.5">PB</th>
                    <th className="py-2 px-2.5">Z-score</th>
                    <th className="py-2 px-2.5">Œdèmes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {evaluations.map((ev) => {
                    const isNew = ev.date === "12/11";
                    return (
                      <tr
                        key={ev.id}
                        data-testid={`eval-row-${ev.date.replace("/", "-")}`}
                        className={isNew ? "bg-[#FFF1E2] font-semibold" : ""}
                      >
                        <td className="py-2 px-2.5">{ev.date}</td>
                        <td className="py-2 px-2.5">{ev.weightKg.toString().replace(".", ",")} kg</td>
                        <td className="py-2 px-2.5">{ev.lengthCm.toString().replace(".", ",")} cm</td>
                        <td className="py-2 px-2.5">{ev.pbMm} mm</td>
                        <td className="py-2 px-2.5 font-bold text-care">
                          {ev.zScore.toString().replace(".", ",")}
                        </td>
                        <td className="py-2 px-2.5">{ev.edema}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right Column: Intake Plan */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <Card
            title="Plan de prises actuel"
            action={
              <button
                type="button"
                className="text-12 text-care font-bold hover:underline"
                onClick={() => navigate(`/soignant/personnes/${personId}/plan`)}
              >
                Gérer ›
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
                  <p className="text-12 text-text mt-0.5">{item.mealName}</p>
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
                Voir tout le plan ›
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

