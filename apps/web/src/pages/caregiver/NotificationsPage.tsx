import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { formatDate, type SupportedLocale } from "@tsotsa/i18n";
import "../../i18n/setup";
import { Card, Button } from "../../components";
import { initialNotifications } from "../../features/caregiver/caregiverData";
import type { CaregiverNotification } from "../../features/caregiver/types";

function formatShortTimestamp(timestamp: string, locale: SupportedLocale): string {
  const [datePart, timePart] = timestamp.split(" ");
  if (!datePart || !timePart) return timestamp;
  const [dayStr, monthStr] = datePart.split("/");
  const day = parseInt(dayStr, 10);
  const month = parseInt(monthStr, 10);
  const utcDate = new Date(Date.UTC(2026, month - 1, day, 12, 0, 0));
  const formattedDayMonth = formatDate(utcDate, locale, { day: "2-digit", month: "2-digit" });
  return `${formattedDayMonth} ${timePart}`;
}

export function NotificationsPage(): React.JSX.Element {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation("notifications");
  const { t: tMedical } = useTranslation("medical");
  const locale: SupportedLocale = i18n.language === "en" ? "en" : "fr";

  useEffect(() => {
    document.title = t("caregiverPage.pageTitle");
  }, [t]);

  const [notifications, setNotifications] = useState<CaregiverNotification[]>(initialNotifications);
  const [activeFilter, setActiveFilter] = useState<"all" | "intake" | "reminder" | "alert">("all");

  const counts = useMemo(() => {
    return {
      all: notifications.length,
      intake: notifications.filter((n) => n.category === "intake").length,
      reminder: notifications.filter((n) => n.category === "reminder").length,
      alert: notifications.filter((n) => n.category === "alert").length,
    };
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    if (activeFilter === "all") return notifications;
    return notifications.filter((n) => n.category === activeFilter);
  }, [notifications, activeFilter]);

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
  };

  const getNotifTitle = (notif: CaregiverNotification): string => {
    if (notif.id === "notif-1") return tMedical("alerts.missedIntakeEveningTitle");
    if (notif.id === "notif-2") return tMedical("alerts.weightStagnationTitle");
    if (notif.id === "notif-3") return t("caregiverPage.items.notif-3.title");
    if (notif.id === "notif-4") return t("caregiverPage.items.notif-4.title");
    if (notif.id === "notif-5") return t("caregiverPage.items.notif-5.title");
    return notif.title;
  };

  const getNotifMessage = (notif: CaregiverNotification): string => {
    if (notif.id === "notif-1") return tMedical("alerts.missedIntakeNotifMessage");
    if (notif.id === "notif-2") return tMedical("alerts.weightStagnationNotifMessage");
    if (notif.id === "notif-3") return t("caregiverPage.items.notif-3.message");
    if (notif.id === "notif-4") return t("caregiverPage.items.notif-4.message");
    if (notif.id === "notif-5") return t("caregiverPage.items.notif-5.message");
    return notif.message;
  };

  return (
    <div className="flex flex-col gap-6" data-testid="caregiver-notifications-page">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-24 font-bold text-text">{t("caregiverPage.title")}</h1>
          <p className="text-14 text-text-muted mt-1">
            {t("caregiverPage.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            data-testid="mark-all-read-btn"
            onClick={markAllAsRead}
          >
            {t("caregiverPage.markAllReadBtn")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/soignant/parametres/notifications")}
          >
            {t("caregiverPage.settingsBtn")}
          </Button>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex items-center gap-2 flex-wrap" data-testid="notif-filters">
        <button
          type="button"
          onClick={() => setActiveFilter("all")}
          className={`px-3 py-1.5 rounded-full text-12 font-bold transition-colors ${
            activeFilter === "all" ? "bg-care text-white" : "bg-surface-2 text-text-muted hover:bg-neutral-200"
          }`}
          data-testid="filter-all-btn"
        >
          {t("caregiverPage.filters.all", { count: counts.all })}
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter("alert")}
          className={`px-3 py-1.5 rounded-full text-12 font-bold transition-colors ${
            activeFilter === "alert" ? "bg-care text-white" : "bg-surface-2 text-text-muted hover:bg-neutral-200"
          }`}
          data-testid="filter-alerts-btn"
        >
          {t("caregiverPage.filters.alerts", { count: counts.alert })}
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter("intake")}
          className={`px-3 py-1.5 rounded-full text-12 font-bold transition-colors ${
            activeFilter === "intake" ? "bg-care text-white" : "bg-surface-2 text-text-muted hover:bg-neutral-200"
          }`}
          data-testid="filter-intakes-btn"
        >
          {t("caregiverPage.filters.intakes", { count: counts.intake })}
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter("reminder")}
          className={`px-3 py-1.5 rounded-full text-12 font-bold transition-colors ${
            activeFilter === "reminder" ? "bg-care text-white" : "bg-surface-2 text-text-muted hover:bg-neutral-200"
          }`}
          data-testid="filter-reminders-btn"
        >
          {t("caregiverPage.filters.reminders", { count: counts.reminder })}
        </button>
      </div>

      {/* Notifications list */}
      <Card>
        <div className="flex flex-col divide-y divide-border" data-testid="notifications-list">
          {filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              data-testid={`notif-item-${notif.id}`}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-3.5 gap-3"
            >
              <div className="flex items-start gap-3">
                {/* Orange dot for unread */}
                <div className="pt-1.5">
                  <span
                    className={`inline-block w-2.5 h-2.5 rounded-full ${
                      notif.isRead ? "bg-transparent" : "bg-[#F08A24]"
                    }`}
                    data-testid={`unread-dot-${notif.id}`}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-14 text-text">{getNotifTitle(notif)}</span>
                    <span className="font-mono text-12 text-care bg-care/10 px-2 py-0.5 rounded font-bold">
                      {`${notif.personName} (${notif.personCode})`}
                    </span>
                  </div>
                  <p className="text-13 text-text-muted">{getNotifMessage(notif)}</p>
                  <span className="text-11 text-text-muted">
                    {formatShortTimestamp(notif.timestamp, locale)}
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                data-testid={`open-file-from-notif-${notif.id}`}
                onClick={() => navigate(`/soignant/personnes/${notif.personId}`)}
              >
                {t("caregiverPage.openRecordBtn")}
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

