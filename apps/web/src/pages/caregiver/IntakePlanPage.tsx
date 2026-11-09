import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Button, Toggle, Notice } from "../../components";
import { initialAminaIntakePlan } from "../../features/caregiver/caregiverData";
import type { IntakePlanRow } from "../../features/caregiver/types";

export function IntakePlanPage(): React.JSX.Element {
  const { personId = "A-014" } = useParams();
  const navigate = useNavigate();

  const [rows, setRows] = useState<IntakePlanRow[]>(initialAminaIntakePlan);
  const [reminders, setReminders] = useState<Record<string, boolean>>({
    "intake-1": true,
    "intake-2": true,
    "intake-3": true,
    "intake-4": true,
    "intake-5": true,
  });

  const [rule3Reminders, setRule3Reminders] = useState(true);
  const [ruleRealtime, setRuleRealtime] = useState(false);
  const [ruleStagnation, setRuleStagnation] = useState(true);

  const [newTime, setNewTime] = useState("");
  const [newMeal, setNewMeal] = useState("");
  const [newPortion, setNewPortion] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleAddHour = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTime || !newMeal) return;
    const newId = `intake-${Date.now()}`;
    const newRow: IntakePlanRow = {
      id: newId,
      time: newTime,
      mealName: newMeal,
      portion: newPortion || "150 ml",
    };
    setRows([...rows, newRow]);
    setReminders((prev) => ({ ...prev, [newId]: true }));
    setNewTime("");
    setNewMeal("");
    setNewPortion("");
    setIsAdding(false);
  };

  const handleDelete = (id: string) => {
    setRows(rows.filter((r) => r.id !== id));
  };

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  return (
    <div className="flex flex-col gap-6" data-testid="intake-plan-page">
      {savedSuccess && (
        <Notice variant="success" title="Modifications enregistrées" testID="plan-saved-notice">
          Le plan de prises d'Amina et les règles de rappel ont été mis à jour avec succès.
        </Notice>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <nav className="text-12 text-text-muted mb-1">
            <span
              className="cursor-pointer hover:underline"
              onClick={() => navigate("/soignant/personnes")}
            >
              Personnes suivies
            </span>{" "}
            ›{" "}
            <span
              className="cursor-pointer hover:underline"
              onClick={() => navigate(`/soignant/personnes/${personId}`)}
            >
              Amina
            </span>{" "}
            › Plan de prises
          </nav>
          <h1 className="text-24 font-bold text-text">
            Plan de prises et rappels — Amina (#{personId})
          </h1>
          <p className="text-14 text-text-muted mt-1">
            Prescription active · {rows.length} prises quotidiennes
          </p>
        </div>
        <Button
          variant="primary"
          space="care"
          size="md"
          data-testid="add-intake-btn"
          onClick={() => setIsAdding(true)}
        >
          + Ajouter une heure
        </Button>
      </div>

      {/* Add slot modal / inline card */}
      {isAdding && (
        <Card title="Ajouter une prise quotidienne">
          <form onSubmit={handleAddHour} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
            <div>
              <label htmlFor="new-slot-time-input" className="block text-12 font-bold text-text mb-1">
                Heure (HH:MM)
              </label>
              <input
                id="new-slot-time-input"
                type="text"
                placeholder="21h30"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                data-testid="new-slot-time-input"
                className="w-full rounded-input border border-border px-3 py-2 text-13"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="new-slot-meal-input" className="block text-12 font-bold text-text mb-1">
                Aliment / Prise prescrite
              </label>
              <input
                id="new-slot-meal-input"
                type="text"
                placeholder="Bouillie enrichie ou collation"
                value={newMeal}
                onChange={(e) => setNewMeal(e.target.value)}
                data-testid="new-slot-meal-input"
                className="w-full rounded-input border border-border px-3 py-2 text-13"
                required
              />
            </div>
            <div>
              <label htmlFor="new-slot-portion-input" className="block text-12 font-bold text-text mb-1">
                Portion
              </label>
              <input
                id="new-slot-portion-input"
                type="text"
                placeholder="150 ml"
                value={newPortion}
                onChange={(e) => setNewPortion(e.target.value)}
                data-testid="new-slot-portion-input"
                className="w-full rounded-input border border-border px-3 py-2 text-13"
              />
            </div>
            <div className="sm:col-span-4 flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAdding(false)}>
                Annuler
              </Button>
              <Button type="submit" variant="primary" space="care" size="sm" data-testid="save-new-slot-btn">
                Ajouter au plan
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Intakes Table */}
      <Card title="Horaires et rations prescrits">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-13 border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface-2 text-12 font-bold text-text-muted">
                <th className="py-2.5 px-3">Heure</th>
                <th className="py-2.5 px-3">Prise / Aliment prescrit</th>
                <th className="py-2.5 px-3">Portion</th>
                <th className="py-2.5 px-3 text-center">Rappels actifs</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border" data-testid="intake-plan-tbody">
              {rows.map((row) => (
                <tr key={row.id} data-testid={`intake-row-${row.id}`}>
                  <td className="py-3 px-3 font-bold text-care text-14">{row.time}</td>
                  <td className="py-3 px-3 text-text font-medium">{row.mealName}</td>
                  <td className="py-3 px-3 text-text-muted">{row.portion}</td>
                  <td className="py-3 px-3 text-center">
                    <Toggle
                      checked={reminders[row.id] ?? true}
                      onChange={(checked) =>
                        setReminders((prev) => ({ ...prev, [row.id]: checked }))
                      }
                      testID={`toggle-reminder-${row.id}`}
                    />
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      type="button"
                      data-testid={`delete-intake-${row.id}`}
                      onClick={() => handleDelete(row.id)}
                      className="text-12 text-red-600 hover:underline font-medium"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Alert Rules Card */}
      <Card title="Règles d'alerte soignant pour Amina">
        <div className="flex flex-col gap-4 text-13">
          <div className="flex items-center justify-between py-2 border-b border-border">
            <div>
              <span className="font-bold text-text block">
                Alerter en cas de prise non confirmée après 3 rappels
              </span>
              <span className="text-12 text-text-muted">
                Notification push et ajout en priorité haute au tableau de bord.
              </span>
            </div>
            <Toggle
              checked={rule3Reminders}
              onChange={setRule3Reminders}
              testID="toggle-rule-3reminders"
            />
          </div>

          <div className="flex items-center justify-between py-2 border-b border-border">
            <div>
              <span className="font-bold text-text block">
                Notifier les prises confirmées en temps réel
              </span>
              <span className="text-12 text-text-muted">
                Recevoir une notification in-app dès que la mère valide la prise.
              </span>
            </div>
            <Toggle
              checked={ruleRealtime}
              onChange={setRuleRealtime}
              testID="toggle-rule-realtime"
            />
          </div>

          <div className="flex items-center justify-between py-2 border-b border-border">
            <div>
              <span className="font-bold text-text block">
                Alerte de stagnation si aucun gain sur 14 jours
              </span>
              <span className="text-12 text-text-muted">
                Déclenche une proposition d'adaptation de la ration et du protocole.
              </span>
            </div>
            <Toggle
              checked={ruleStagnation}
              onChange={setRuleStagnation}
              testID="toggle-rule-stagnation"
            />
          </div>
        </div>
      </Card>

      {/* Actions footer */}
      <div className="flex items-center justify-between pt-3">
        <Button
          variant="outline"
          size="md"
          onClick={() => navigate(`/soignant/personnes/${personId}`)}
        >
          Retour au dossier
        </Button>
        <Button
          variant="primary"
          space="care"
          size="md"
          data-testid="save-plan-btn"
          onClick={handleSave}
        >
          Enregistrer les modifications
        </Button>
      </div>
    </div>
  );
}

