import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../../i18n/setup";
import { AppShell } from "../../components/AppShell";
import { useOptionalAuth } from "../../api/authContext";
import type { NavItem } from "../../types";

export const caregiverNavItems: NavItem[] = [
  { label: "Tableau de bord", path: "/soignant", iconName: "dashboard" },
  { label: "Personnes suivies", path: "/soignant/personnes", iconName: "patients", badge: 4 },
  { label: "Notifications", path: "/soignant/notifications", iconName: "notifications", badge: 2 },
  { label: "Réglages", path: "/soignant/parametres/notifications", iconName: "settings" },
];

export function CaregiverLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  const { t } = useTranslation("caregiver");
  const location = useLocation();
  const navigate = useNavigate();
  const authContext = useOptionalAuth();
  const authLogout = authContext?.logout;

  const localizedNavItems: NavItem[] = [
    { label: t("nav.dashboard"), path: "/soignant", iconName: "dashboard" },
    { label: t("nav.persons"), path: "/soignant/personnes", iconName: "patients", badge: 4 },
    { label: t("nav.notifications"), path: "/soignant/notifications", iconName: "notifications", badge: 2 },
    { label: t("nav.settings"), path: "/soignant/parametres/notifications", iconName: "settings" },
  ];

  return (
    <AppShell
      space="care"
      userName="Prof. Félicité Ngeufack"
      unreadNotifications={2}
      onNotificationClick={() => navigate("/soignant/notifications")}
      navItems={localizedNavItems}
      activeNavPath={location.pathname}
      onNavigate={(path) => navigate(path)}
      onLogout={() => {
        authLogout?.();
        navigate("/connexion");
      }}
    >
      {children}
    </AppShell>
  );
}
