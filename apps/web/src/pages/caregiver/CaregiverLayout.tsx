import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AppShell } from "../../components/AppShell";
import type { NavItem } from "../../types";

export const caregiverNavItems: NavItem[] = [
  { label: "Tableau de bord", path: "/soignant", iconName: "dashboard" },
  { label: "Personnes suivies", path: "/soignant/personnes", iconName: "patients", badge: 4 },
  { label: "Notifications", path: "/soignant/notifications", iconName: "notifications", badge: 2 },
  { label: "Réglages", path: "/soignant/parametres/notifications", iconName: "settings" },
];

export function CaregiverLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <AppShell
      space="care"
      userName="Dr. Marc Eto'o"
      unreadNotifications={2}
      navItems={caregiverNavItems}
      activeNavPath={location.pathname}
      onNavigate={(path) => navigate(path)}
      onLogout={() => navigate("/connexion")}
    >
      {children}
    </AppShell>
  );
}

