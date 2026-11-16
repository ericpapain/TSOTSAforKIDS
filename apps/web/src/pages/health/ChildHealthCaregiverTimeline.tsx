import React, { useState, useEffect } from "react";
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

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await listHealthEventsForPerson(personId);
      setEvents(data);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (personId) {
      loadData();
    }
  }, [personId]);

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
      alert("Erreur lors de l'enregistrement de l'évaluation.");
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
      alert("Erreur lors de l'enregistrement de l'action.");
    }
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case "urgent":
        return <span className="rounded bg-red-100 text-red-800 px-2.5 py-0.5 text-xs font-bold uppercase">Urgent</span>;
      case "high":
        return <span className="rounded bg-orange-100 text-orange-800 px-2.5 py-0.5 text-xs font-semibold">Élevé</span>;
      case "attention":
        return <span className="rounded bg-amber-100 text-amber-800 px-2.5 py-0.5 text-xs font-semibold">Attention</span>;
      default:
        return <span className="rounded bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-xs font-semibold">Normal</span>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-slate-800">
          Historique médical et événements de santé ({events.length})
        </h3>
        <button
          onClick={loadData}
          className="text-xs text-blue-600 hover:underline font-medium"
        >
          Actualiser
        </button>
      </div>

      {loading && <p className="text-sm text-slate-500">Chargement des événements...</p>}

      {!loading && events.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
          Aucun événement de santé signalé pour cet enfant.
        </div>
      )}

      <div className="space-y-3">
        {events.map((ev) => (
          <div key={ev.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">
                    {new Date(ev.created_at).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {getPriorityBadge(ev.priority)}
                  <span className="rounded bg-slate-100 text-slate-600 px-2 py-0.5 text-xs">
                    {ev.status}
                  </span>
                </div>
                <div className="mt-1 font-semibold text-slate-800 text-sm">
                  {ev.symptoms.map((s) => s.symptom_code).join(", ")}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedEventId(ev.id);
                    setEvalModalOpen(true);
                  }}
                  className="rounded-lg bg-blue-50 text-blue-700 px-3 py-1 text-xs font-semibold hover:bg-blue-100"
                >
                  Évaluer
                </button>
                <button
                  onClick={() => {
                    setSelectedEventId(ev.id);
                    setActionModalOpen(true);
                  }}
                  className="rounded-lg bg-slate-100 text-slate-700 px-3 py-1 text-xs font-semibold hover:bg-slate-200"
                >
                  Action
                </button>
              </div>
            </div>

            {/* Caregiver guidance notes */}
            {ev.caregiver_guidance_notes && ev.caregiver_guidance_notes.length > 0 && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-2.5 text-xs text-amber-900 space-y-1">
                {ev.caregiver_guidance_notes.map((n, i) => (
                  <p key={i}>• {n}</p>
                ))}
              </div>
            )}

            {/* Comment by parent */}
            {ev.comment && (
              <p className="text-xs text-slate-600 italic">
                « {ev.comment} »
              </p>
            )}

            {/* Assessments */}
            {ev.assessments && ev.assessments.length > 0 && (
              <div className="border-t pt-2 space-y-1">
                <p className="text-xs font-bold text-slate-700">Évaluations médicales :</p>
                {ev.assessments.map((a) => (
                  <div key={a.id} className="text-xs text-slate-600 bg-slate-50 rounded p-2">
                    <p>{a.clinical_notes}</p>
                    {a.suspected_condition && (
                      <p className="text-blue-800 font-medium mt-0.5">Suspicion : {a.suspected_condition}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Assessment Modal */}
      {evalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 space-y-4">
            <h4 className="font-bold text-slate-800 text-base">Évaluation clinique</h4>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Observations cliniques</label>
              <textarea
                value={evalNotes}
                onChange={(e) => setEvalNotes(e.target.value)}
                rows={3}
                placeholder="Examen clinique, hydratation, signes respiratoires..."
                className="w-full rounded-xl border p-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Suspicion diagnostique (facultatif)</label>
              <input
                type="text"
                value={suspectedCond}
                onChange={(e) => setSuspectedCond(e.target.value)}
                placeholder="Ex: Gastro-entérite aiguë"
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
                Nécessite des examens complémentaires
              </label>
              {reqInvest && (
                <input
                  type="text"
                  value={investType}
                  onChange={(e) => setInvestType(e.target.value)}
                  placeholder="Ex: TDR Paludisme, Examen selles"
                  className="w-full rounded-xl border p-2 text-sm mt-1.5"
                />
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEvalModalOpen(false)}
                className="rounded-xl border px-3 py-1.5 text-xs text-slate-600"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveAssessment}
                className="rounded-xl bg-blue-600 text-white px-4 py-1.5 text-xs font-semibold"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {actionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 space-y-4">
            <h4 className="font-bold text-slate-800 text-base">Enregistrer une action médicale</h4>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Type d'action</label>
              <select
                value={actionType}
                onChange={(e) => setActionType(e.target.value)}
                className="w-full rounded-xl border p-2 text-sm"
              >
                <option value="treatment_advised">Conseil / Traitement ambulatoire</option>
                <option value="scheduled_followup">Suivi / Contrôle planifié</option>
                <option value="clarification_requested">Précisions demandées à la famille</option>
                <option value="referral_specialist">Orientation vers un spécialiste</option>
                <option value="emergency_transfer">Transfert d'urgence</option>
                <option value="closed">Clôturer l'événement (résolu)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Détails de l'action</label>
              <textarea
                value={actionDetails}
                onChange={(e) => setActionDetails(e.target.value)}
                rows={3}
                placeholder="Précisez la conduite à tenir ou les consignes données..."
                className="w-full rounded-xl border p-2 text-sm"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setActionModalOpen(false)}
                className="rounded-xl border px-3 py-1.5 text-xs text-slate-600"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveAction}
                className="rounded-xl bg-blue-600 text-white px-4 py-1.5 text-xs font-semibold"
              >
                Enregistrer l'action
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

