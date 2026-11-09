import React from "react";
import { useNavigate } from "react-router-dom";
import { KpiCard } from "../../components/KpiCard";
import { Card } from "../../components/Card";
import { useAdminStore } from "../../features/admin/useAdminStore";

export function AdminDashboardPage(): React.JSX.Element {
  const navigate = useNavigate();
  const { caregivers, userProducts, batches } = useAdminStore();

  const pendingCaregiversCount = caregivers.length;
  const pendingUserProductsCount = userProducts.length;
  const pendingLotsCount = batches.filter((b) => b.status === "pending_review").length;

  const healthMetrics = [
    { label: "Comptes utilisateurs", value: "—" },
    { label: "Soignants vérifiés", value: "—" },
    { label: "Personnes suivies", value: "—" },
    { label: "Prises confirmées (7 jours)", value: "—" },
    { label: "Synchronisations en échec", value: "—" },
    { label: "Dernière sauvegarde restaurée", value: "—" },
  ];

  return (
    <div
      data-testid="admin-dashboard-page"
      className="p-[29px] max-w-[1200px] flex flex-col gap-6"
    >
      <h1 className="text-29 font-bold text-text">Vue d'ensemble</h1>

      {/* 4 KPI indicator cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <KpiCard
          value={String(pendingCaregiversCount)}
          label="soignant à vérifier"
          color="care"
          onClick={() => navigate("/verifications")}
          className="cursor-pointer hover:shadow-md transition-shadow"
          testID="kpi-caregiver"
        />
        <KpiCard
          value={String(pendingUserProductsCount)}
          label="produit utilisateur à vérifier"
          color="warning"
          onClick={() => navigate("/verifications")}
          className="cursor-pointer hover:shadow-md transition-shadow"
          testID="kpi-product"
        />
        <KpiCard
          value={pendingLotsCount > 0 ? String(pendingLotsCount) : "—"}
          label="lots d'aliments à valider"
          color="admin"
          onClick={() => navigate("/base-aliments")}
          className="cursor-pointer hover:shadow-md transition-shadow"
          testID="kpi-lots"
        />
        <KpiCard
          value="0 / 6"
          label="prix renseignés"
          color="danger"
          onClick={() => navigate("/prix")}
          className="cursor-pointer hover:shadow-md transition-shadow"
          testID="kpi-prices"
        />
      </div>

      {/* Santé de la plateforme */}
      <Card testID="platform-health-card" className="p-6">
        <h2 className="text-22 font-bold text-text mb-6">
          Santé de la plateforme
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {healthMetrics.map((metric) => (
            <div
              key={metric.label}
              className="bg-surface-2 rounded-[6px] px-4 py-3 flex items-center justify-between"
            >
              <span className="text-17 text-text font-normal">{metric.label}</span>
              <span className="text-19 font-bold text-text">{metric.value}</span>
            </div>
          ))}
        </div>
        <p className="text-14 italic text-text-muted mt-6">
          Les chiffres s'afficheront avec les données réelles. Aucune valeur
          inventée dans l'administration.
        </p>
      </Card>
    </div>
  );
}

export default AdminDashboardPage;
