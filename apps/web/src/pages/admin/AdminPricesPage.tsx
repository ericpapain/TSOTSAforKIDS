import React, { useState } from "react";
import { Button } from "../../components/Button";
import { initialRegionalPrices } from "../../features/admin/adminData";
import type { RegionalPrice } from "../../features/admin/types";

export function AdminPricesPage(): React.JSX.Element {
  const [prices] = useState<RegionalPrice[]>(initialRegionalPrices);

  return (
    <div
      data-testid="admin-prices-page"
      className="p-[29px] max-w-[1400px] flex flex-col gap-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-29 font-bold text-text">Prix par région</h1>
        <Button
          variant="primary"
          className="!bg-admin hover:!bg-slate-800"
          testID="btn-add-price"
        >
          + Ajouter un relevé
        </Button>
      </div>

      {/* Tableau des prix */}
      <div className="overflow-x-auto border border-border rounded-[9px] bg-white">
        <table className="w-full text-left border-collapse" data-testid="prices-table">
          <thead>
            <tr className="bg-admin text-white text-14 font-bold h-[41px]">
              <th className="px-4 py-2 w-[194px]">Région</th>
              <th className="px-4 py-2 w-[274px]">Produit ou aliment</th>
              <th className="px-4 py-2 w-[160px]">Prix (FCFA)</th>
              <th className="px-4 py-2 w-[137px]">Unité</th>
              <th className="px-4 py-2 w-[182px]">Date du relevé</th>
              <th className="px-4 py-2 w-[188px]">Source</th>
            </tr>
          </thead>
          <tbody>
            {prices.map((p, index) => (
              <tr
                key={p.id}
                data-testid={`price-row-${p.id}`}
                className={`h-[55px] text-17 border-t border-border ${
                  index % 2 === 0 ? "bg-surface-2" : "bg-white"
                }`}
              >
                <td className="px-4 py-3 text-text font-normal">{p.region}</td>
                <td className="px-4 py-3 font-bold text-text">{p.item}</td>
                <td className="px-4 py-3 text-text-muted">{p.price}</td>
                <td className="px-4 py-3 text-text-muted">{p.unit}</td>
                <td className="px-4 py-3 text-text-muted">{p.date}</td>
                <td className="px-4 py-3 text-danger font-bold">{p.source}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-16 italic text-text-muted">
        Sans relevé, l'application affiche « prix non renseigné ». Chaque prix a
        une date et une source (relevé de marché, partenaire).
      </p>
    </div>
  );
}

export default AdminPricesPage;

