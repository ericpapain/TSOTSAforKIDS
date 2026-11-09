import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { initialReferenceProducts } from "../../features/admin/adminData";
import type { ReferenceProduct } from "../../features/admin/types";

export function AdminProductsPage(): React.JSX.Element {
  const navigate = useNavigate();
  const [products] = useState<ReferenceProduct[]>(initialReferenceProducts);

  const getStatusColor = (status: string): string => {
    if (status.includes("À valider")) return "text-warning font-bold";
    return "text-text-muted";
  };

  return (
    <div
      data-testid="admin-products-page"
      className="p-[29px] max-w-[1400px] flex flex-col gap-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-29 font-bold text-text">Produits de référence</h1>
        <Button
          variant="primary"
          className="!bg-admin hover:!bg-slate-800"
          testID="btn-add-ref-product"
        >
          + Ajouter un produit
        </Button>
      </div>

      {/* Tableau des produits */}
      <div className="overflow-x-auto border border-border rounded-[9px] bg-white">
        <table className="w-full text-left border-collapse" data-testid="products-table">
          <thead>
            <tr className="bg-admin text-white text-14 font-bold h-[41px]">
              <th className="px-4 py-2 w-[182px]">Produit</th>
              <th className="px-4 py-2 w-[103px]">Base</th>
              <th className="px-4 py-2 w-[296px]">Nutriments essentiels</th>
              <th className="px-4 py-2 w-[314px]">Source</th>
              <th className="px-4 py-2 w-[239px]">Statut</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p, index) => (
              <tr
                key={p.id}
                data-testid={`product-row-${p.id}`}
                className={`h-[63px] text-17 border-t border-border ${
                  index % 2 === 0 ? "bg-surface-2" : "bg-white"
                }`}
              >
                <td className="px-4 py-3 font-bold text-text">{p.name}</td>
                <td className="px-4 py-3 text-text-muted">{p.base}</td>
                <td className="px-4 py-3 text-text">{p.essentialNutrients}</td>
                <td className="px-4 py-3 text-text-muted">{p.source}</td>
                <td className={`px-4 py-3 ${getStatusColor(p.status)}`}>
                  {p.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cartouche d'information */}
      <Card testID="products-notice-card" className="p-6 bg-admin-50 border-0">
        <p className="text-17 text-text leading-relaxed">
          Chaque valeur garde sa source et sa date. Une modification est tracée
          dans le journal d'audit. Les nutriments essentiels par défaut sont
          fixés par l'équipe scientifique (décision D2).
        </p>
      </Card>

      {/* Lien vers côté utilisateur */}
      <div>
        <button
          type="button"
          data-testid="link-user-view"
          onClick={() => navigate("/nutrition/produits/plumpy-nut")}
          className="text-17 font-bold text-primary hover:underline cursor-pointer"
        >
          Voir côté utilisateur ›
        </button>
      </div>
    </div>
  );
}

export default AdminProductsPage;

