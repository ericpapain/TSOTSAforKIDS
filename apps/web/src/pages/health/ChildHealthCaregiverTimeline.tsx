import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  listHealthEventsForPerson,
  addClinicalAssessment,
  addHealthAction,
  type HealthEventItem,
} from "../../api/health";

interface ChildHealthCaregiverTimelineProps {
  personId: string;
}

export const ChildHealthCaregiverTimeline: React.FC<ChildHealthCaregiverTimelineProps> = ({
  personId,
}) => {
  const { t } = useTranslation(["medical", "common"]);
  const [events, setEvents] = useState<HealthEventItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [evalNotes, setEvalNotes] = useState("");
  const [suspectedCond, setSuspectedCond] = useState("");
  const [reqInvest, setReqInvest] = useState(false);
  const [investType, setInvestType] = useState("");
  const [actionType, setActionType] = useState("treatment_advised");
  const [actionDetails, setActionDetails] = useState("");
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [evalModalOpen, setEvalModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listHealthEventsForPerson(personId);
      setEvents(data);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [personId]);

  useEffect(() => {
    if (personId) {
      loadData();
    }
  }, [personId, loadData]);

  const handleSaveAssessment = async () => {
    if (!selectedEventId || !evalNotes.trim()) return;
    try {
      await addClinicalAssessment(selectedEventId, {
        clinical_notes: evalNotes.trim(),
        suspected_condition: suspectedCond.trim() || undefined,
        requires_investigation: reqInvest,
        investigation_type: investType.trim() || undefined,
      });
      setEvalModalOpen(false);
      setEvalNotes("");
      loadData();
    } catch {
      // Ignored in offline/test mode
    }
  };

  const handleSaveAction = async () => {
    if (!selectedEventId || !actionDetails.trim()) return;
    try {
      await addHealthAction(selectedEventId, {
        action_type: actionType,
        details: actionDetails.trim(),
      });
      setActionModalOpen(false);
      setActionDetails("");
      loadData();
    } catch {
      // Ignored in offline/test mode
    }
  };

  const renderPriorityBadge = (priority: string) => {
    switch (priority) {
      case "urgent":
        return <span className="rounded bg-red-100 text-red-800 px-2.5 py-0.5 text-xs font-bold uppercase">{t("medical:healthAlerts.urgent", "Urgent")}</span>;
      case "high":
        return <span className="rounded bg-orange-100 text-orange-800 px-2.5 py-0.5 text-xs font-semibold">{t("medical:healthAlerts.high", "Élevé")}</span>;
      case "attention":
        return <span className="rounded bg-amber-100 text-amber-800 px-2.5 py-0.5 text-xs font-semibold">{t("medical:healthAlerts.attention", "Attention")}</span>;
      default:
        return <span className="rounded bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-xs font-semibold">{t("medical:healthAlerts.normal", "Normal")}</span>;
    }
  };

  return (
    <div className="space-y-4" data-testid="caregiver-health-timeline">
      <div className="flex items-center justify-between border-b pb-3">
        <h3 className="text-base font-bold text-slate-800">
          {t("medical:healthAlerts.timelineTitle", "Historique médical et événements de santé ({{count}})", { count: events.length })}
        </h3>
        <button
          type="button"
          onClick={loadData}
          className="text-xs text-blue-600 hover:underline font-medium"
        >
          {t("common:actions.refresh", "Actualiser")}
        </button>
      </div>

      {loading && <p className="text-sm text-slate-500">{t("common:loading", "Chargement des événements...")}</p>}

      {!loading && events.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
          {t("medical:healthAlerts.noEvents", "Aucun événement de santé signalé pour cet enfant.")}
        </div>
      )}

      <div className="space-y-3">
        {events.map((ev) => (
          <div
            key={ev.id}
            data-testid={`health-event-card-${ev.id}`}
            className="rounded-xl border border-slate-200 p-4 shadow-sm bg-white hover:border-slate-300 transition-colors"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
              <div className="flex items-center gap-2">
                {renderPriorityBadge(ev.priority)}
                {ev.has_danger_sign && (
                  <span className="rounded bg-red-600 text-white px-2 py-0.5 text-xs font-extrabold uppercase animate-pulse">
                    {t("medical:healthAlerts.dangerSignBadge", "Signe de danger vital")}
                  </span>
                )}
                <span className="text-xs text-slate-500">
                  {new Date(ev.created_at).toLocaleDateString()}
                </span>
                {ev.declaration_context === "during_meal" && (
                  <span className="rounded bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 text-xs font-medium">
                    {t("medical:healthAlerts.duringMealContext", "Signalé pendant un repas")}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  data-testid={`eval-btn-${ev.id}`}
                  onClick={() => {
                    setSelectedEventId(ev.id);
                    setEvalModalOpen(true);
                  }}
                  className="rounded-lg bg-blue-50 text-blue-700 px-3 py-1 text-xs font-semibold hover:bg-blue-100"
                >
                  {t("medical:healthAlerts.assessBtn", "Évaluer")}
                </button>
                <button
                  type="button"
                  data-testid={`action-btn-${ev.id}`}
                  onClick={() => {
                    setSelectedEventId(ev.id);
                    setActionModalOpen(true);
                  }}
                  className="rounded-lg bg-slate-100 text-slate-700 px-3 py-1 text-xs font-semibold hover:bg-slate-200"
                >
                  {t("medical:healthAlerts.actionBtn", "Action")}
                </button>
              </div>
            </div>

            <div className="py-2.5">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                {t("medical:healthAlerts.symptomsReported", "Symptômes signalés")} :
              </p>
              <ul className="mt-1 list-disc list-inside text-sm text-slate-800 space-y-0.5">
                {ev.symptoms.map((s) => (
                  <li key={s.id}>
                    <span className="font-semibold">{s.symptom_code}</span> (
                    {s.duration})
                  </li>
                ))}
              </ul>
              {ev.comment && (
                <p className="mt-2 text-xs italic text-slate-600 bg-slate-50 p-2 rounded">
                  &laquo; {ev.comment} &raquo;
                </p>
              )}
            </div>

            {ev.caregiver_guidance_notes && ev.caregiver_guidance_notes.length > 0 && (
              <div className="mt-2 rounded-lg bg-amber-50 border border-amber-200 p-2.5 text-xs text-amber-900">
                <span className="font-bold">{t("medical:healthAlerts.clinicalAlertsTitle", "Alertes cliniques automatiques")} :</span>
                <ul className="mt-1 list-disc list-inside space-y-0.5">
                  {ev.caregiver_guidance_notes.map((note, idx) => (
                    <li key={idx}>{note}</li>
                  ))}
                </ul>
              </div>
            )}

            {ev.assessments && ev.assessments.length > 0 && (
              <div className="mt-2 border-t pt-2 space-y-1.5">
                <span className="text-xs font-bold text-blue-900">{t("medical:healthAlerts.assessmentsTitle", "Évaluations médicales")} :</span>
                {ev.assessments.map((a) => (
                  <div key={a.id} className="rounded bg-blue-50/60 p-2 text-xs text-blue-950">
                    <p className="font-medium">{a.clinical_notes}</p>
                    {a.suspected_condition && (
                      <p className="text-blue-800 mt-0.5 font-bold">
                        {t("medical:healthAlerts.suspectedCondition", "Suspicion : {{condition}}", { condition: a.suspected_condition })}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {ev.actions && ev.actions.length > 0 && (
              <div className="mt-2 border-t pt-2 space-y-1">
                <span className="text-xs font-bold text-slate-700">{t("medical:healthAlerts.actionsTitle", "Actions menées")} :</span>
                {ev.actions.map((act) => (
                  <div key={act.id} className="text-xs text-slate-700 flex items-center gap-1">
                    <span className="font-bold text-slate-900">{act.action_type} :</span>
                    <span>{act.details}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {evalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 space-y-4">
            <h4 className="font-bold text-slate-800 text-base">{t("medical:healthAlerts.evalModalTitle", "Évaluation clinique")}</h4>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">{t("medical:healthAlerts.clinicalNotesLabel", "Notes d'examen clinique")}</label>
              <textarea
                value={evalNotes}
                onChange={(e) => setEvalNotes(e.target.value)}
                rows={3}
                placeholder={t("medical:healthAlerts.clinicalNotesPlaceholder", "Examen clinique, hydratation, signes respiratoires...")}
                className="w-full rounded-xl border p-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">{t("medical:healthAlerts.suspectedCondLabel", "Suspicion diagnostique (facultatif)")}</label>
              <input
                type="text"
                value={suspectedCond}
                onChange={(e) => setSuspectedCond(e.target.value)}
                placeholder={t("medical:healthAlerts.suspectedCondPlaceholder", "Ex: Gastro-entérite aiguë")}
                className="w-full rounded-xl border p-2 text-sm"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={reqInvest}
                  onChange={(e) => setReqInvest(e.target.checked)}
                />
                {t("medical:healthAlerts.reqInvestLabel", "Nécessite des examens complémentaires")}
              </label>
              {reqInvest && (
                <input
                  type="text"
                  value={investType}
                  onChange={(e) => setInvestType(e.target.value)}
                  placeholder={t("medical:healthAlerts.investTypePlaceholder", "Ex: TDR Paludisme, Examen selles")}
                  className="w-full rounded-xl border p-2 text-sm mt-1.5"
                />
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEvalModalOpen(false)}
                className="rounded-xl border px-3 py-1.5 text-xs text-slate-600"
              >
                {t("common:actions.cancel", "Annuler")}
              </button>
              <button
                type="button"
                onClick={handleSaveAssessment}
                className="rounded-xl bg-blue-600 text-white px-4 py-1.5 text-xs font-semibold"
              >
                {t("common:actions.save", "Enregistrer")}
              </button>
            </div>
          </div>
        </div>
      )}

      {actionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 space-y-4">
            <h4 className="font-bold text-slate-800 text-base">{t("medical:healthAlerts.actionModalTitle", "Enregistrer une action médicale")}</h4>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">{t("medical:healthAlerts.actionTypeLabel", "Type d'action")}</label>
              <select
                value={actionType}
                onChange={(e) => setActionType(e.target.value)}
                className="w-full rounded-xl border p-2 text-sm"
              >
                <option value="treatment_advised">{t("medical:healthAlerts.actionTreatment", "Conseil / Traitement ambulatoire")}</option>
                <option value="scheduled_followup">{t("medical:healthAlerts.actionFollowup", "Suivi / Contrôle planifié")}</option>
                <option value="clarification_requested">{t("medical:healthAlerts.actionClarification", "Précisions demandées à la famille")}</option>
                <option value="referral_specialist">{t("medical:healthAlerts.actionReferral", "Orientation vers un spécialiste")}</option>
                <option value="emergency_transfer">{t("medical:healthAlerts.actionTransfer", "Transfert d'urgence")}</option>
                <option value="closed">{t("medical:healthAlerts.actionClosed", "Clôturer l'événement (résolu)")}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">{t("medical:healthAlerts.actionDetailsLabel", "Détails de l'action")}</label>
              <textarea
                value={actionDetails}
                onChange={(e) => setActionDetails(e.target.value)}
                rows={3}
                placeholder={t("medical:healthAlerts.actionDetailsPlaceholder", "Précisez la posologie, l'orientation ou la conduite à tenir...")}
                className="w-full rounded-xl border p-2 text-sm"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActionModalOpen(false)}
                className="rounded-xl border px-3 py-1.5 text-xs text-slate-600"
              >
                {t("common:actions.cancel", "Annuler")}
              </button>
              <button
                type="button"
                onClick={handleSaveAction}
                className="rounded-xl bg-green-600 text-white px-4 py-1.5 text-xs font-semibold"
              >
                {t("common:actions.save", "Enregistrer")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
