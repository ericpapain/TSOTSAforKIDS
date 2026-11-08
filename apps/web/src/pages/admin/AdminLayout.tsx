import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AppShell } from "../../components/AppShell";
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
  const { caregivers, userProducts, currentUser } = useAdminStore();

  const pendingCount = caregivers.length + userProducts.length;
  const itemsWithBadges: NavItem[] = adminNavItems.map((item) => {
    if (item.path === "/verifications" && pendingCount > 0) {
      return { ...item, badge: pendingCount };
    }
    return item;
  });

  return (
    <AppShell
      space="admin"
      userName={currentUser || "Équipe TSOTSA Kids"}
      navItems={itemsWithBadges}
      activeNavPath={location.pathname === "/admin" ? "/" : location.pathname}
      onNavigate={(path) => navigate(path)}
      onLogout={() => navigate("/connexion")}
    >
      {children}
    </AppShell>
  );
}

export default AdminLayout;

