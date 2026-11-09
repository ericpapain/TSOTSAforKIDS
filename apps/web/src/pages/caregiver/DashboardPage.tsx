import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, KpiCard, Button, Chip } from "../../components";
import { initialAlerts, initialScheduledEvals } from "../../features/caregiver/caregiverData";
import type { AlertItem, AlertPriority } from "../../features/caregiver/types";

const priorityWeight: Record<AlertPriority, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

const priorityLabels: Record<AlertPriority, { text: string; variant: "danger" | "warning" | "care" }> = {
  high: { text: "Priorité Haute", variant: "danger" },
  medium: { text: "Priorité Moyenne", variant: "warning" },
  low: { text: "Priorité Basse", variant: "care" },
};

export function DashboardPage(): React.JSX.Element {
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState<"priority" | "date">("priority");

  const sortedAlerts = useMemo(() => {
    return [...initialAlerts].sort((a, b) => {
      if (sortBy === "priority") {
        return priorityWeight[b.priority] - priorityWeight[a.priority];
      }
      return b.timestamp.localeCompare(a.timestamp);
    });
  }, [sortBy]);

  return (
    <div className="flex flex-col gap-6" data-testid="caregiver-dashboard-page">
      <div>
        <h1 className="text-24 font-bold text-text">Tableau de bord — Espace soignant</h1>
        <p className="text-14 text-text-muted mt-1">CMA de Kousséri · 4 personnes suivies actives</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="kpi-grid">
        <KpiCard
          title="Personnes suivies"
          value="4"
          subtitle="Total sous protocole"
          space="care"
          testID="kpi-followed-persons"
        />
        <KpiCard
          title="Alertes actives"
          value="3"
          subtitle="1 haute, 1 moyenne, 1 basse"
          space="care"
          testID="kpi-active-alerts"
        />
        <KpiCard
          title="Évaluations du jour"
          value="1"
          subtitle="Hamadou (#A-014) à 10h00"
          space="care"
          testID="kpi-evaluations-today"
        />
        <KpiCard
          title="Observance moyenne"
          value="88 %"
          subtitle="+3 % sur 7 jours"
          space="care"
          testID="kpi-adherence"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alerts Section (2 columns on lg) */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <Card
            title="Alertes à traiter (3)"
            action={
              <div className="flex items-center gap-2">
                <label htmlFor="alert-sort-select" className="text-12 text-text-muted font-medium">
                  Trier par :
                </label>
                <select
                  id="alert-sort-select"
                  aria-label="Trier les alertes par"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "priority" | "date")}
                  data-testid="alert-sort-select"
                  className="rounded-input border border-border bg-white px-2 py-1 text-12 text-text font-medium"
                >
                  <option value="priority">Priorité (haute d'abord)</option>
                  <option value="date">Date (récente d'abord)</option>
                </select>
              </div>
            }
          >
            <div className="flex flex-col divide-y divide-border" data-testid="alerts-list">
              {sortedAlerts.map((alert: AlertItem) => (
                <div
                  key={alert.id}
                  data-testid={`alert-item-${alert.id}`}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-3.5 gap-3"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-14 text-text">{alert.personName}</span>
                      <span className="text-12 text-text-muted font-mono">{alert.personCode}</span>
                      <Chip
                        label={priorityLabels[alert.priority].text}
                        variant={priorityLabels[alert.priority].variant}
                      />
                    </div>
                    <p className="text-13 text-text">{alert.reason}</p>
                    <span className="text-12 text-text-muted">{alert.timestamp}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    data-testid={`open-file-btn-${alert.personId}`}
                    onClick={() => navigate(`/soignant/personnes/${alert.personId}`)}
                  >
                    Ouvrir le dossier ›
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Scheduled evaluations */}
        <div className="flex flex-col gap-4">
          <Card title="Évaluations programmées">
            <div className="flex flex-col divide-y divide-border">
              {initialScheduledEvals.map((se) => (
                <div key={se.id} className="py-3 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-14 text-text">
                      {se.personName} <span className="font-mono text-text-muted text-12">{se.personCode}</span>
                    </span>
                    <span className="text-12 font-medium text-care">{se.scheduledTime}</span>
                  </div>
                  <span className="text-12 text-text-muted">{se.location} · {se.title}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-border">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-care"
                onClick={() => navigate("/soignant/personnes")}
              >
                Voir toutes les personnes suivies ›
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
