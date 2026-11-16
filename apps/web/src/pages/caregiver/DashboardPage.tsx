import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { formatNumber, normalizeLocale, DEFAULT_LOCALE } from "@tsotsa/i18n";
import "../../i18n/setup";
import { Card, KpiCard, Button, Chip } from "../../components";
import { CaregiverHealthAlertsWidget } from "../health/CaregiverHealthAlertsWidget";
import { initialAlerts, initialScheduledEvals } from "../../features/caregiver/caregiverData";
import type { AlertItem, AlertPriority } from "../../features/caregiver/types";

const priorityWeight: Record<AlertPriority, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

export function DashboardPage(): React.JSX.Element {
  const { t, i18n } = useTranslation("caregiver");
  const { t: tMedical } = useTranslation("medical");
  const locale = normalizeLocale(i18n.resolvedLanguage ?? i18n.language) ?? DEFAULT_LOCALE;
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState<"priority" | "date">("priority");

  useEffect(() => {
    document.title = t("dashboard.pageTitle");
  }, [t]);

  const priorityLabels: Record<AlertPriority, { text: string; variant: "danger" | "warning" | "care" }> = {
    high: { text: t("dashboard.alertsCard.priorityHigh"), variant: "danger" },
    medium: { text: t("dashboard.alertsCard.priorityMedium"), variant: "warning" },
    low: { text: t("dashboard.alertsCard.priorityLow"), variant: "care" },
  };

  const getAlertReason = (alert: AlertItem): string => {
    if (alert.id === "alt-1") return tMedical("alerts.missedIntakeReason");
    if (alert.id === "alt-2") return tMedical("alerts.weightStagnationReason");
    if (alert.id === "alt-3") return tMedical("alerts.eval30DaysReason");
    return alert.reason;
  };

  const getScheduledTime = (id: string, fallback: string): string => {
    if (id === "se-1") return t("dashboard.scheduledCard.se1Time");
    if (id === "se-2") return t("dashboard.scheduledCard.se2Time");
    if (id === "se-3") return t("dashboard.scheduledCard.se3Time");
    return fallback;
  };

  const getScheduledTitle = (id: string, fallback: string): string => {
    if (id === "se-1") return t("dashboard.scheduledCard.se1Title");
    if (id === "se-2") return t("dashboard.scheduledCard.se2Title");
    if (id === "se-3") return t("dashboard.scheduledCard.se3Title");
    return fallback;
  };

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
        <h1 className="text-24 font-bold text-text">{t("dashboard.title")}</h1>
        <p className="text-14 text-text-muted mt-1">
          {t("dashboard.subtitle", { count: 4 })}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="kpi-grid">
        <KpiCard
          title={t("dashboard.kpi.followedPersonsTitle")}
          value={formatNumber(4, locale)}
          subtitle={t("dashboard.kpi.followedPersonsSubtitle")}
          space="care"
          testID="kpi-followed-persons"
        />
        <KpiCard
          title={t("dashboard.kpi.activeAlertsTitle")}
          value={formatNumber(3, locale)}
          subtitle={t("dashboard.kpi.activeAlertsSubtitle")}
          space="care"
          testID="kpi-active-alerts"
        />
        <KpiCard
          title={t("dashboard.kpi.evaluationsTodayTitle")}
          value={formatNumber(1, locale)}
          subtitle={t("dashboard.kpi.evaluationsTodaySubtitle")}
          space="care"
          testID="kpi-evaluations-today"
        />
        <KpiCard
          title={t("dashboard.kpi.adherenceTitle")}
          value={`${formatNumber(88, locale)} %`}
          subtitle={t("dashboard.kpi.adherenceSubtitle", { delta: formatNumber(3, locale) })}
          space="care"
          testID="kpi-adherence"
        />
      </div>

      <CaregiverHealthAlertsWidget />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alerts Section */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <Card
            title={t("dashboard.alertsCard.title", { count: sortedAlerts.length })}
            action={
              <div className="flex items-center gap-2">
                <label htmlFor="alert-sort-select" className="text-12 text-text-muted font-medium">
                  {t("dashboard.alertsCard.sortByLabel")}
                </label>
                <select
                  id="alert-sort-select"
                  aria-label={t("dashboard.alertsCard.sortByAria")}
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "priority" | "date")}
                  data-testid="alert-sort-select"
                  className="rounded-input border border-border bg-white px-2 py-1 text-12 text-text font-medium"
                >
                  <option value="priority">{t("dashboard.alertsCard.sortPriority")}</option>
                  <option value="date">{t("dashboard.alertsCard.sortDate")}</option>
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
                    <p className="text-13 text-text">{getAlertReason(alert)}</p>
                    <span className="text-12 text-text-muted">{alert.timestamp}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    data-testid={`open-file-btn-${alert.personId}`}
                    onClick={() => navigate(`/soignant/personnes/${alert.personId}`)}
                  >
                    {t("dashboard.alertsCard.openRecordBtn")}
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Scheduled evaluations */}
        <div className="flex flex-col gap-4">
          <Card title={t("dashboard.scheduledCard.title")}>
            <div className="flex flex-col divide-y divide-border">
              {initialScheduledEvals.map((se) => (
                <div key={se.id} className="py-3 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-14 text-text">
                      {se.personName}{" "}
                      <span className="font-mono text-text-muted text-12">{se.personCode}</span>
                    </span>
                    <span className="text-12 font-medium text-care">
                      {getScheduledTime(se.id, se.scheduledTime)}
                    </span>
                  </div>
                  <span className="text-12 text-text-muted">
                    {`${se.location} · ${getScheduledTitle(se.id, se.title)}`}
                  </span>
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
                {t("dashboard.scheduledCard.viewAllPersonsBtn")}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
