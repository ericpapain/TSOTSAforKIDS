import React, { useState } from "react";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { initialOptimizationTargets } from "../../features/admin/adminData";
import type { OptimizationTarget } from "../../features/admin/types";

export function AdminOptimPage(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<string>("cibles");
  const [targets] = useState<OptimizationTarget[]>(initialOptimizationTargets);

  return (
    <div
      data-testid="admin-optim-page"
      className="p-[29px] max-w-[1400px] flex flex-col gap-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-29 font-bold text-text">
          Optimisation des rations · préparation
        </h1>
        <span
          data-testid="badge-engine-status"
          className="px-5 py-2 bg-warning-50 text-warning font-bold text-14 rounded-full self-start sm:self-auto"
        >
          Moteur : phase 2 (non activé)
        </span>
      </div>

      {/* Onglets */}
      <div className="flex flex-wrap gap-3">
        {[
          { id: "cibles", label: "Cibles nutritionnelles" },
          { id: "limites", label: "Limites par aliment" },
          { id: "parametres", label: "Paramètres" },
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
                  <th className="px-3 py-2 w-[171px]">Population</th>
                  <th className="px-3 py-2 w-[131px]">Phase</th>
                  <th className="px-3 py-2 w-[114px]">Nutriment</th>
                  <th className="px-3 py-2 w-[86px]">Min</th>
                  <th className="px-3 py-2 w-[86px]">Max</th>
                  <th className="px-3 py-2 w-[108px]">Unité</th>
                  <th className="px-3 py-2 w-[125px]">Source</th>
                </tr>
              </thead>
              <tbody>
                {targets.map((t, index) => (
                  <tr
                    key={t.id}
                    data-testid={`target-row-${t.id}`}
                    className={`h-[51px] text-14 border-t border-border ${
                      index % 2 === 0 ? "bg-surface-2" : "bg-white"
                    }`}
                  >
                    <td className="px-3 py-2 font-normal text-text">{t.population}</td>
                    <td className="px-3 py-2 font-normal text-text">{t.phase}</td>
                    <td className="px-3 py-2 font-normal text-text">{t.nutrient}</td>
                    <td className="px-3 py-2 font-normal text-text-muted">{t.min}</td>
                    <td className="px-3 py-2 font-normal text-text-muted">{t.max}</td>
                    <td className="px-3 py-2 font-normal text-text">{t.unit}</td>
                    <td className="px-3 py-2 font-normal text-text">{t.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-14 italic text-text-muted">
            Les cibles viennent du protocole national, validé par la référente
            médicale. Aucune valeur par défaut.
          </p>

          <div>
            <Button
              variant="primary"
              disabled
              className="!bg-toggle-off !cursor-not-allowed !text-white h-[51px]"
              testID="btn-test-formulation"
            >
              Tester une formulation
            </Button>
          </div>
        </div>

        {/* Colonne droite : Ce que le moteur calculera */}
        <div className="lg:col-span-4">
          <Card testID="solver-explanation-card" className="p-6 bg-admin-50 border-0 flex flex-col gap-4">
            <h2 className="text-17 font-bold text-text">Ce que le moteur calculera</h2>
            <ul className="list-disc pl-5 text-14 text-text space-y-3 leading-relaxed">
              <li>
                La combinaison d'aliments locaux la moins chère qui atteint les
                cibles
              </li>
              <li>Les quantités en grammes par repas</li>
              <li>Avec les seuls aliments disponibles dans la région</li>
              <li>Toujours validée par un soignant</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default AdminOptimPage;

