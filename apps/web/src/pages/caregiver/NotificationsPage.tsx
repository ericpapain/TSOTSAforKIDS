import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Button } from "../../components";
import { initialNotifications } from "../../features/caregiver/caregiverData";
import type { CaregiverNotification } from "../../features/caregiver/types";

export function NotificationsPage(): React.JSX.Element {
  const navigate = useNavigate();
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

  return (
    <div className="flex flex-col gap-6" data-testid="caregiver-notifications-page">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-24 font-bold text-text">Notifications soignant</h1>
          <p className="text-14 text-text-muted mt-1">
            Centre d'alertes cliniques et de suivi des prises
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            data-testid="mark-all-read-btn"
            onClick={markAllAsRead}
          >
            Tout marquer comme lu
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/soignant/parametres/notifications")}
          >
            Paramètres ›
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
          Toutes ({counts.all})
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter("alert")}
          className={`px-3 py-1.5 rounded-full text-12 font-bold transition-colors ${
            activeFilter === "alert" ? "bg-care text-white" : "bg-surface-2 text-text-muted hover:bg-neutral-200"
          }`}
          data-testid="filter-alerts-btn"
        >
          Alertes ({counts.alert})
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter("intake")}
          className={`px-3 py-1.5 rounded-full text-12 font-bold transition-colors ${
            activeFilter === "intake" ? "bg-care text-white" : "bg-surface-2 text-text-muted hover:bg-neutral-200"
          }`}
          data-testid="filter-intakes-btn"
        >
          Prises ({counts.intake})
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter("reminder")}
          className={`px-3 py-1.5 rounded-full text-12 font-bold transition-colors ${
            activeFilter === "reminder" ? "bg-care text-white" : "bg-surface-2 text-text-muted hover:bg-neutral-200"
          }`}
          data-testid="filter-reminders-btn"
        >
          Rappels ({counts.reminder})
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
                    <span className="font-bold text-14 text-text">{notif.title}</span>
                    <span className="font-mono text-12 text-care bg-care/10 px-2 py-0.5 rounded font-bold">
                      {notif.personName} ({notif.personCode})
                    </span>
                  </div>
                  <p className="text-13 text-text-muted">{notif.message}</p>
                  <span className="text-11 text-text-muted">{notif.timestamp}</span>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                data-testid={`open-file-from-notif-${notif.id}`}
                onClick={() => navigate(`/soignant/personnes/${notif.personId}`)}
              >
                Ouvrir le dossier ›
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

