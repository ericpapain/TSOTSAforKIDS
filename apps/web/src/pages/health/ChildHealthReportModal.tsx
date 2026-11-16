import React, { useState, useEffect } from "react";
import {
  getSymptomCatalog,
  createHealthEvent,
  type SymptomCatalogItem,
  type HealthEventCreatePayload,
} from "../../api/health";

export interface ChildHealthReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  personId: string;
  childName?: string;
  personName?: string;
  declarationContext?: "standalone" | "during_meal";
  intakeId?: string | null;
  onSuccess?: () => void;
}

export const ChildHealthReportModal: React.FC<ChildHealthReportModalProps> = ({
  isOpen,
  onClose,
  personId,
  childName,
  personName,
  declarationContext = "standalone",
  intakeId,
  onSuccess,
}) => {
  const displayName = childName || personName || "l'enfant";
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [catalog, setCatalog] = useState<SymptomCatalogItem[]>([]);
  const [selectedSymptomCode, setSelectedSymptomCode] = useState<string>("");
  const [durationKey, setDurationKey] = useState<string>("less_than_24h");
  const [tempCelsius, setTempCelsius] = useState<string>("");
  const [stoolsPerDay, setStoolsPerDay] = useState<string>("");
  const [vomitPerDay, setVomitPerDay] = useState<string>("");
  const [hasBloodStools, setHasBloodStools] = useState<boolean>(false);
  const [duringMeal, setDuringMeal] = useState<boolean>(declarationContext === "during_meal" || Boolean(intakeId));
  const [comment, setComment] = useState<string>("");
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [isDanger, setIsDanger] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSelectedSymptomCode("");
      setFeedbackMessage(null);
      setIsDanger(false);
      setDuringMeal(Boolean(intakeId));
      getSymptomCatalog()
        .then(setCatalog)
        .catch(() => {});
    }
  }, [isOpen, intakeId]);

  if (!isOpen) return null;

  const currentSymptom = catalog.find((c) => c.code === selectedSymptomCode);
  const isDangerActive = isDanger || (currentSymptom?.is_danger_sign ?? false);

  const handleSelectSymptom = (code: string) => {
    setSelectedSymptomCode(code);
    const sym = catalog.find((c) => c.code === code);
    if (sym?.is_danger_sign) {
      setIsDanger(true);
    }
  };

  const getDurationDays = (key: string): number => {
    if (key === "1_to_3_days") return 2;
    if (key === "4_to_13_days") return 7;
    if (key === "14_days_or_more") return 15;
    return 1;
  };

  const handleSubmit = async () => {
    if (!selectedSymptomCode) return;
    setLoading(true);
    try {
      const payload: HealthEventCreatePayload = {
        person_id: personId,
        intake_id: duringMeal ? intakeId : null,
        declaration_context: duringMeal ? "during_meal" : "standalone",
        meal_interrupted: duringMeal,
        symptoms: [
          {
            symptom_code: selectedSymptomCode,
            duration: durationKey,
            duration_days: getDurationDays(durationKey),
            specific_metrics: {
              has_blood: hasBloodStools,
            },
          },
        ],
        temperature_celsius: tempCelsius ? parseFloat(tempCelsius) : undefined,
        stools_frequency_per_day: stoolsPerDay ? parseInt(stoolsPerDay, 10) : undefined,
        vomiting_frequency_per_day: vomitPerDay ? parseInt(vomitPerDay, 10) : undefined,
        comment: comment.trim() || undefined,
      };

      const res = await createHealthEvent(payload);
      setFeedbackMessage(res.parent_guidance_message || "Signalement enregistré.");
      setIsDanger(res.priority === "urgent" || res.has_danger_sign);
      setStep(5);
      if (onSuccess) onSuccess();
    } catch {
      setFeedbackMessage("Erreur lors de l'enregistrement. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-testid="child-health-report-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between border-b pb-3">
          <h2 className="text-xl font-bold text-slate-800">
            Santé et bien-être · {displayName}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 font-bold text-lg"
          >
            ✕
          </button>
        </div>

        {step < 5 && isDangerActive && (
          <div
            data-testid="immediate-danger-sign-banner"
            className="mb-4 rounded-xl bg-red-100 border border-red-300 p-4 text-red-900 animate-pulse"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="font-extrabold text-sm uppercase tracking-wide">
                  URGENCE VITALE : Signe de danger vital détecté
                </p>
                <p className="mt-1 text-xs">
                  Conduisez immédiatement l'enfant au centre de santé ou à l'hôpital le plus proche.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 1: Symptom choice */}
        {step === 1 && (
          <div>
            <p className="mb-3 text-sm text-slate-600 font-medium">
              Quel problème ou changement observez-vous chez votre enfant ?
            </p>
            <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
              {catalog.map((sym) => (
                <button
                  key={sym.code}
                  type="button"
                  data-testid={`symptom-check-${sym.code}`}
                  onClick={() => handleSelectSymptom(sym.code)}
                  className={`w-full text-left rounded-xl p-3 border text-sm transition-all flex items-center justify-between ${
                    selectedSymptomCode === sym.code
                      ? sym.is_danger_sign
                        ? "border-red-500 bg-red-50 text-red-900 font-bold"
                        : "border-blue-600 bg-blue-50 text-blue-900 font-bold"
                      : "border-slate-200 hover:border-slate-300 text-slate-700"
                  }`}
                >
                  <span>{sym.label_fr}</span>
                  {sym.is_danger_sign && (
                    <span className="rounded bg-red-200 px-2 py-0.5 text-xs font-bold text-red-800">
                      Urgent
                    </span>
                  )}
                </button>
              ))}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                type="button"
                data-testid="next-step-btn"
                disabled={!selectedSymptomCode}
                onClick={() => setStep(2)}
                className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Continuer
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Duration and details */}
        {step === 2 && (
          <div data-testid="step-2-view" className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Depuis combien de temps ce problème est-il présent ?
              </label>
              <select
                value={durationKey}
                onChange={(e) => setDurationKey(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-sm"
              >
                <option value="less_than_24h">Moins de 24 heures</option>
                <option value="1_to_3_days">1 à 3 jours</option>
                <option value="4_to_13_days">4 à 13 jours</option>
                <option value="14_days_or_more">14 jours ou plus</option>
              </select>
            </div>

            {selectedSymptomCode === "fever" && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Température mesurée (°C, facultatif)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="34"
                  max="43"
                  value={tempCelsius}
                  onChange={(e) => setTempCelsius(e.target.value)}
                  placeholder="Ex: 38.5"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-sm"
                />
              </div>
            )}

            {selectedSymptomCode === "diarrhea" && (
              <div className="space-y-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Nombre de selles liquides aujourd'hui
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={stoolsPerDay}
                    onChange={(e) => setStoolsPerDay(e.target.value)}
                    placeholder="Ex: 4"
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-sm"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={hasBloodStools}
                    onChange={(e) => setHasBloodStools(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600"
                  />
                  <span>Présence de sang visible dans les selles</span>
                </label>
              </div>
            )}

            {selectedSymptomCode === "vomiting" && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nombre de vomissements aujourd'hui
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={vomitPerDay}
                  onChange={(e) => setVomitPerDay(e.target.value)}
                  placeholder="Ex: 3"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-sm"
                />
              </div>
            )}

            <div className="flex justify-between pt-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="rounded-xl border px-4 py-2 text-sm text-slate-600"
              >
                Retour
              </button>
              <button
                type="button"
                data-testid="next-step-btn"
                onClick={() => setStep(3)}
                className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Continuer
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Context & Impact */}
        {step === 3 && (
          <div data-testid="step-3-view" className="space-y-4">
            <div className="rounded-xl border border-slate-200 p-3 bg-slate-50">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-800">
                <input
                  type="checkbox"
                  checked={duringMeal}
                  onChange={(e) => setDuringMeal(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600"
                />
                <span>Ce problème est survenu pendant ou juste après un repas</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Remarques ou détails supplémentaires pour le soignant
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder="Décrivez avec vos propres mots ce que vous avez remarqué..."
                className="w-full rounded-xl border border-slate-300 p-2.5 text-sm"
              />
            </div>

            <div className="flex justify-between pt-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="rounded-xl border px-4 py-2 text-sm text-slate-600"
              >
                Retour
              </button>
              <button
                type="button"
                data-testid="next-step-btn"
                onClick={() => setStep(4)}
                className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Récapitulatif
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Summary before sending */}
        {step === 4 && (
          <div data-testid="step-4-view" className="space-y-4">
            <div className="rounded-xl bg-slate-50 border p-4 space-y-2 text-sm text-slate-700">
              <p>
                <strong>Problème :</strong> {currentSymptom?.label_fr}
              </p>
              <p>
                <strong>Durée :</strong> {durationKey === "less_than_24h" ? "< 24h" : durationKey}
              </p>
              {duringMeal && <p className="text-amber-700 font-medium">Incident associé à la prise de repas</p>}
              {comment && <p><strong>Commentaire :</strong> {comment}</p>}
            </div>

            <div className="flex justify-between pt-3">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="rounded-xl border px-4 py-2 text-sm text-slate-600"
              >
                Modifier
              </button>
              <button
                type="button"
                data-testid="submit-health-report-btn"
                disabled={loading}
                onClick={handleSubmit}
                className="rounded-xl bg-green-600 px-5 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? "Envoi en cours..." : "Confirmer et envoyer"}
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: Final Result */}
        {step === 5 && (
          <div data-testid="step-5-guidance-view" className="text-center py-4 space-y-4">
            <div className="text-4xl">{isDanger ? "🚨" : "✅"}</div>
            <h3 className="text-lg font-bold text-slate-800">
              {isDanger ? "Orientation d'urgence" : "Signalement bien enregistré"}
            </h3>
            <p className="text-sm text-slate-600 bg-slate-50 rounded-xl p-4 border">
              {feedbackMessage}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Fermer
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

