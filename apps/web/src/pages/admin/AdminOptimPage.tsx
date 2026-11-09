import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { initialOptimizationTargets } from "../../features/admin/adminData";
import type { OptimizationTarget } from "../../features/admin/types";

export function AdminOptimPage(): React.JSX.Element {
  const { t, i18n } = useTranslation("admin");
  const [activeTab, setActiveTab] = useState<string>("cibles");
  const [targets] = useState<OptimizationTarget[]>(initialOptimizationTargets);

  useEffect(() => {
    document.title = t("optim.pageTitle");
  }, [t, i18n.language]);

  return (
    <div
      data-testid="admin-optim-page"
      className="p-[29px] max-w-[1400px] flex flex-col gap-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-29 font-bold text-text">
          {t("optim.title")}
        </h1>
        <span
          data-testid="badge-engine-status"
          className="px-5 py-2 bg-warning-50 text-warning font-bold text-14 rounded-full self-start sm:self-auto"
        >
          {t("optim.engineBadge")}
        </span>
      </div>

      {/* Onglets */}
      <div className="flex flex-wrap gap-3">
        {[
          { id: "cibles", label: t("optim.tabs.cibles") },
          { id: "limites", label: t("optim.tabs.limites") },
          { id: "parametres", label: t("optim.tabs.parametres") },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              data-testid={`tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`h-[41px] px-6 rounded-[6px] text-16 transition-colors border ${
                isActive
                  ? "bg-admin text-white border-admin font-bold"
                  : "bg-white text-text border-border font-normal hover:bg-surface-2"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Colonne gauche : tableau des cibles */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="overflow-x-auto border border-border rounded-[9px] bg-white">
            <table className="w-full text-left border-collapse" data-testid="targets-table">
              <thead>
                <tr className="bg-admin text-white text-14 font-bold h-[41px]">
                  <th className="px-3 py-2 w-[171px]">{t("optim.columns.population")}</th>
                  <th className="px-3 py-2 w-[131px]">{t("optim.columns.phase")}</th>
                  <th className="px-3 py-2 w-[114px]">{t("optim.columns.nutrient")}</th>
                  <th className="px-3 py-2 w-[86px]">{t("optim.columns.min")}</th>
                  <th className="px-3 py-2 w-[86px]">{t("optim.columns.max")}</th>
                  <th className="px-3 py-2 w-[108px]">{t("optim.columns.unit")}</th>
                  <th className="px-3 py-2 w-[125px]">{t("optim.columns.source")}</th>
                </tr>
              </thead>
              <tbody>
                {targets.map((item, index) => (
                  <tr
                    key={item.id}
                    data-testid={`target-row-${item.id}`}
                    className={`h-[51px] text-14 border-t border-border ${
                      index % 2 === 0 ? "bg-surface-2" : "bg-white"
                    }`}
                  >
                    <td className="px-3 py-2 font-normal text-text">
                      {item.population === "6–59 mois, MAS"
                        ? t("optim.data.popSam")
                        : t("optim.data.popMam")}
                    </td>
                    <td className="px-3 py-2 font-normal text-text">
                      {item.phase === "Réhabilitation"
                        ? t("optim.data.phaseRehab")
                        : t("optim.data.phaseSupplement")}
                    </td>
                    <td className="px-3 py-2 font-normal text-text">
                      {t(`foodNew.nutrientNames.${item.nutrient}` as never)}
                    </td>
                    <td className="px-3 py-2 font-normal text-text-muted">
                      {item.min === "à saisir" ? t("prices.toEnter") : item.min}
                    </td>
                    <td className="px-3 py-2 font-normal text-text-muted">
                      {item.max === "à saisir" ? t("prices.toEnter") : item.max}
                    </td>
                    <td className="px-3 py-2 font-normal text-text">{item.unit}</td>
                    <td className="px-3 py-2 font-normal text-text">
                      {item.source === "Protocole" ? t("optim.data.sourceProtocol") : item.source}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-14 italic text-text-muted">
            {t("optim.footnote")}
          </p>

          <div>
            <Button
              variant="primary"
              disabled
              className="!bg-toggle-off !cursor-not-allowed !text-white h-[51px]"
              testID="btn-test-formulation"
            >
              {t("optim.testFormulationBtn")}
            </Button>
          </div>
        </div>

        {/* Colonne droite : Ce que le moteur calculera */}
        <div className="lg:col-span-4">
          <Card testID="solver-explanation-card" className="p-6 bg-admin-50 border-0 flex flex-col gap-4">
            <h2 className="text-17 font-bold text-text">{t("optim.solverCardTitle")}</h2>
            <ul className="list-disc pl-5 text-14 text-text space-y-3 leading-relaxed">
              <li>{t("optim.solverBullets.b1")}</li>
              <li>{t("optim.solverBullets.b2")}</li>
              <li>{t("optim.solverBullets.b3")}</li>
              <li>{t("optim.solverBullets.b4")}</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default AdminOptimPage;


