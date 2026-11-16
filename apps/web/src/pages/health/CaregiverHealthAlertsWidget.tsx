import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaExclamationTriangle, FaBell, FaArrowRight, FaCheckCircle } from "react-icons/fa";
import { listHealthAlerts, type HealthAlertItem } from "../../api/health";

export const CaregiverHealthAlertsWidget: React.FC = () => {
  const { t } = useTranslation(["medical", "common"]);
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<HealthAlertItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    listHealthAlerts("attention")
      .then((data) => {
        if (isMounted) {
          setAlerts(data);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const urgentAlertsCount = alerts.filter((a) => a.priority === "urgent" || a.has_danger_sign).length;

  return (
    <div
      data-testid="caregiver-health-alerts-widget"
      className={`rounded-xl border p-4 shadow-sm transition-all ${
        urgentAlertsCount > 0
          ? "border-red-300 bg-red-50/60"
          : alerts.length > 0
            ? "border-amber-200 bg-amber-50/40"
            : "border-[#D5DEDA] bg-white"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {urgentAlertsCount > 0 ? (
            <FaExclamationTriangle className="text-red-600 animate-pulse" size={17} />
          ) : (
            <FaBell className="text-primary" size={16} />
          )}
          <h3 className="text-[15px] font-bold text-[#17302A]">
            {t("medical:healthAlerts.widgetTitle", "Alertes de santé signalées")}
          </h3>
        </div>
        <span
          className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
            urgentAlertsCount > 0
              ? "bg-red-600 text-white"
              : alerts.length > 0
                ? "bg-amber-500 text-white"
                : "bg-emerald-100 text-emerald-800"
          }`}
        >
          {alerts.length}{" "}
          {alerts.length > 1
            ? t("common:badges.alertsPlural", "alertes")
            : t("common:badges.alertSingle", "alerte")}
        </span>
      </div>

      {isLoading ? (
        <div className="py-4 text-center text-[12px] text-[#5B6B66]">
          {t("common:loading", "Chargement des alertes...")}
        </div>
      ) : alerts.length === 0 ? (
        <div className="py-3 px-3 bg-white/80 rounded-lg border border-[#E5ECE9] flex items-center gap-2 text-[12px] text-emerald-800">
          <FaCheckCircle className="text-emerald-600 shrink-0" size={14} />
          <span>{t("medical:healthAlerts.noActiveAlerts", "Aucune alerte de santé active pour vos patients.")}</span>
        </div>
      ) : (
        <div className="space-y-2.5">
          {alerts.slice(0, 5).map((alert) => {
            const isUrgent = alert.priority === "urgent" || alert.has_danger_sign;
            return (
              <div
                key={alert.event_id}
                data-testid={`health-alert-item-${alert.event_id}`}
                className={`p-3 rounded-lg border bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs ${
                  isUrgent ? "border-red-300" : "border-amber-200"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        isUrgent
                          ? "bg-red-100 text-red-800"
                          : alert.priority === "high"
                            ? "bg-orange-100 text-orange-800"
                            : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {alert.priority}
                    </span>
                    <span className="font-mono text-[12px] font-bold text-[#17302A]">
                      {alert.person_code || `#${alert.person_id.slice(0, 8)}`}
                    </span>
                    {alert.has_danger_sign && (
                      <span className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
                        {t("medical:healthAlerts.dangerSignBadge", "SIGNE DE DANGER")}
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] text-[#283833]">
                    {alert.symptoms_summary.join(", ") || t("medical:healthAlerts.symptomReported", "Symptôme signalé")}
                  </p>
                </div>

                <button
                  type="button"
                  data-testid={`view-alert-child-btn-${alert.event_id}`}
                  onClick={() => navigate(`/soignant/personnes/${alert.person_id}`)}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1B4D7E] hover:bg-[#153e65] text-white text-[12px] font-bold transition-colors shrink-0"
                >
                  <span>{t("medical:healthAlerts.viewChildRecord", "Voir dossier")}</span>
                  <FaArrowRight size={10} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

