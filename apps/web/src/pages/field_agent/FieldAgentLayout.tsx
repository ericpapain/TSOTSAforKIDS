import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AppShell } from "../../components/AppShell";
import { useAuth } from "../../api/authContext";
import type { NavItem } from "../../types";

export function FieldAgentLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  const { t } = useTranslation("common");
  const location = useLocation();
  const navigate = useNavigate();
  const { session, logout } = useAuth();

  const fieldAgentNavItems: NavItem[] = [
    { label: t("fieldAgent.navFamilies"), path: "/agent/familles", iconName: "patients" },
    { label: t("fieldAgent.navValidation"), path: "/agent/validation", iconName: "verify" },
    { label: t("fieldAgent.navProfile"), path: "/agent/profil", iconName: "settings" },
  ];

  const displayName = session?.name || session?.email || t("fieldAgent.profileRoleValue");

  return (
    <AppShell
      space="primary"
      userName={displayName}
      unreadNotifications={0}
      navItems={fieldAgentNavItems}
      activeNavPath={location.pathname}
      onNavigate={(path) => navigate(path)}
      onLogout={() => {
        logout();
        navigate("/connexion");
      }}
    >
      {children}
    </AppShell>
  );
}
