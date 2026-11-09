import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { formatNumber, type SupportedLocale } from "@tsotsa/i18n";
import "../../i18n/setup";
import { KpiCard } from "../../components/KpiCard";
import { Card } from "../../components/Card";
import { useAdminStore } from "../../features/admin/useAdminStore";

export function AdminDashboardPage(): React.JSX.Element {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation("admin");
  const locale: SupportedLocale = i18n.language === "en" ? "en" : "fr";
  const { caregivers, userProducts, batches } = useAdminStore();

  useEffect(() => {
    document.title = t("dashboard.pageTitle");
  }, [t]);

  const pendingCaregiversCount = caregivers.length;
  const pendingUserProductsCount = userProducts.length;
  const pendingLotsCount = batches.filter((b) => b.status === "pending_review").length;

  const healthMetrics = [
    { label: t("dashboard.metrics.userAccounts"), value: "—" },
    { label: t("dashboard.metrics.verifiedCaregivers"), value: "—" },
    { label: t("dashboard.metrics.followedPersons"), value: "—" },
    { label: t("dashboard.metrics.confirmedIntakes7d"), value: "—" },
    { label: t("dashboard.metrics.failedSyncs"), value: "—" },
    { label: t("dashboard.metrics.lastRestoredBackup"), value: "—" },
  ];

  return (
    <div
      data-testid="admin-dashboard-page"
      className="p-[29px] max-w-[1200px] flex flex-col gap-6"
    >
      <h1 className="text-29 font-bold text-text">{t("dashboard.title")}</h1>

      {/* 4 KPI indicator cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <KpiCard
          value={formatNumber(pendingCaregiversCount, locale)}
          label={t("dashboard.kpiCaregiver")}
          color="care"
          onClick={() => navigate("/verifications")}
          className="cursor-pointer hover:shadow-md transition-shadow"
          testID="kpi-caregiver"
        />
        <KpiCard
          value={formatNumber(pendingUserProductsCount, locale)}
          label={t("dashboard.kpiProduct")}
          color="warning"
          onClick={() => navigate("/verifications")}
          className="cursor-pointer hover:shadow-md transition-shadow"
          testID="kpi-product"
        />
        <KpiCard
          value={pendingLotsCount > 0 ? formatNumber(pendingLotsCount, locale) : "—"}
          label={t("dashboard.kpiLots")}
          color="admin"
          onClick={() => navigate("/base-aliments")}
          className="cursor-pointer hover:shadow-md transition-shadow"
          testID="kpi-lots"
        />
        <KpiCard
          value={`${formatNumber(0, locale)} / ${formatNumber(6, locale)}`}
          label={t("dashboard.kpiPrices")}
          color="danger"
          onClick={() => navigate("/prix")}
          className="cursor-pointer hover:shadow-md transition-shadow"
          testID="kpi-prices"
        />
      </div>

      {/* Santé de la plateforme */}
      <Card testID="platform-health-card" className="p-6">
        <h2 className="text-22 font-bold text-text mb-6">
          {t("dashboard.platformHealthTitle")}
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
          {t("dashboard.realDataNotice")}
        </p>
      </Card>
    </div>
  );
}

export default AdminDashboardPage;
