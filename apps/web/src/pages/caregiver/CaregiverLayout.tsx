import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../../i18n/setup";
import { AppShell } from "../../components/AppShell";
import { useOptionalAuth, hasPermission } from "../../api/authContext";
import { ViewAsBanner } from "./ViewAsBanner";
import type { NavItem } from "../../types";

export function CaregiverLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  const { t } = useTranslation("caregiver");
  const location = useLocation();
  const navigate = useNavigate();
  const authContext = useOptionalAuth();
  const session = authContext?.session ?? null;
  const authLogout = authContext?.logout;

  const canReadAll = hasPermission(session, "patients.read_all");
  const canAssign = hasPermission(session, "patients.assign");
  const canValidateStaff = hasPermission(session, "staff.validate");
  const canManagePerms = hasPermission(session, "permissions.manage");

  const localizedNavItems: NavItem[] = [
    { label: t("nav.dashboard"), path: "/soignant", iconName: "dashboard" },
    { label: t("nav.persons"), path: "/soignant/personnes", iconName: "patients" },
  ];

  if (canReadAll) {
    localizedNavItems.push({
      label: "Tous les patients",
      path: "/soignant/supervision/patients",
      iconName: "records",
    });
  }

  if (canAssign) {
    localizedNavItems.push({
      label: "Association",
      path: "/soignant/supervision/association",
      iconName: "assign",
    });
  }

  if (canValidateStaff) {
    localizedNavItems.push({
      label: "Validation soignants",
      path: "/soignant/supervision/validation",
      iconName: "verify",
    });
  }

  if (canManagePerms) {
    localizedNavItems.push({
      label: "Gestion des droits",
      path: "/soignant/supervision/delegations",
      iconName: "roles",
    });
  }

  localizedNavItems.push(
    { label: t("nav.notifications"), path: "/soignant/notifications", iconName: "notifications" },
    { label: t("nav.settings"), path: "/soignant/parametres/notifications", iconName: "settings" }
  );

  const displayName = session?.name || session?.email || "Soignant";

  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const viewAsParam = params.get("viewAs");
    if (viewAsParam && authContext?.viewAsCaregiver && !session?.viewAsCaregiverId) {
      authContext.viewAsCaregiver("dr-view-as", viewAsParam);
    }
  }, [location.search, authContext, session?.viewAsCaregiverId]);

  return (
    <>
      <ViewAsBanner />
      <AppShell
        space="care"
        userName={displayName}
        unreadNotifications={0}
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
    </>
  );
}
