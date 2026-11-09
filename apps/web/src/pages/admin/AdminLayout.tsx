import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../../i18n/setup";
import { AppShell } from "../../components/AppShell";
import { useOptionalAuth } from "../../api/authContext";
import type { NavItem } from "../../types";
import { useAdminStore } from "../../features/admin/useAdminStore";

export const adminNavItems: NavItem[] = [
  { label: "Vue d'ensemble", path: "/", iconName: "tachometer-alt" },
  { label: "Vérifications", path: "/verifications", iconName: "user-check" },
  { label: "Comptes", path: "/comptes", iconName: "users" },
  { label: "Base aliments", path: "/base-aliments", iconName: "database" },
  { label: "Produits de référence", path: "/produits-reference", iconName: "flask" },
  { label: "Prix par région", path: "/prix", iconName: "money-bill-wave" },
  { label: "Optimisation", path: "/optimisation", iconName: "calculator" },
  { label: "Modules", path: "/modules", iconName: "toggle-on" },
  { label: "Notifications", path: "/notifications", iconName: "bell" },
];

export function AdminLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation("admin");
  const { caregivers, userProducts, currentUser } = useAdminStore();
  const authContext = useOptionalAuth();
  const authLogout = authContext?.logout;

  const localizedNavItems: NavItem[] = [
    { label: t("nav.overview"), path: "/", iconName: "tachometer-alt" },
    { label: t("nav.verifications"), path: "/verifications", iconName: "user-check" },
    { label: t("nav.accounts"), path: "/comptes", iconName: "users" },
    { label: t("nav.foods"), path: "/base-aliments", iconName: "database" },
    { label: t("nav.products"), path: "/produits-reference", iconName: "flask" },
    { label: t("nav.prices"), path: "/prix", iconName: "money-bill-wave" },
    { label: t("nav.optimization"), path: "/optimisation", iconName: "calculator" },
    { label: t("nav.modules"), path: "/modules", iconName: "toggle-on" },
    { label: t("nav.notifications"), path: "/notifications", iconName: "bell" },
  ];

  const pendingCount = caregivers.length + userProducts.length;
  const itemsWithBadges: NavItem[] = localizedNavItems.map((item) => {
    if (item.path === "/verifications" && pendingCount > 0) {
      return { ...item, badge: pendingCount };
    }
    return item;
  });

  const displayUser =
    currentUser === "Équipe TSOTSA"
      ? t("nav.shortTeamName")
      : currentUser || t("nav.teamName");

  return (
    <AppShell
      space="admin"
      userName={displayUser}
      navItems={itemsWithBadges}
      activeNavPath={location.pathname === "/admin" ? "/" : location.pathname}
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

export default AdminLayout;

