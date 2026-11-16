import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { initialReferenceProducts } from "../../features/admin/adminData";
import type { ReferenceProduct } from "../../features/admin/types";

export function AdminProductsPage(): React.JSX.Element {
  const { t, i18n } = useTranslation("admin");
  const navigate = useNavigate();
  const [products] = useState<ReferenceProduct[]>(initialReferenceProducts);

  useEffect(() => {
    document.title = t("products.pageTitle");
  }, [t, i18n.language]);

  const getStatusColor = (status: string): string => {
    if (status.includes("À valider")) return "text-warning font-bold";
    return "text-text-muted";
  };

  const renderNutrients = (val: string): string =>
    val === "à définir" ? t("products.data.toDefine") : t("products.data.plumpyNutNutrients");

  const renderSource = (val: string): string => {
    if (val === "OMS, malnutrition sévère (1999)") return t("products.data.whoSam1999");
    if (val === "Spécification RUTF OMS/UNICEF") return t("products.data.whoUnicefRutf");
    return t("products.data.manufacturerSheet");
  };

  const renderStatus = (val: string): string => {
    if (val === "À valider · hôpital") return t("products.data.statusValidateHospital");
    if (val === "À valider") return t("products.data.statusValidate");
    return t("products.data.statusToEnter");
  };

  return (
    <div
      data-testid="admin-products-page"
      className="p-[29px] max-w-[1400px] flex flex-col gap-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-29 font-bold text-text">{t("products.title")}</h1>
        <Button
          variant="primary"
          className="!bg-admin hover:!bg-slate-800"
          testID="btn-add-ref-product"
        >
          {t("products.addProductBtn")}
        </Button>
      </div>

      {/* Tableau des produits */}
      <div className="overflow-x-auto border border-border rounded-[9px] bg-white">
        <table className="w-full text-left border-collapse" data-testid="products-table">
          <thead>
            <tr className="bg-admin text-white text-14 font-bold h-[41px]">
              <th className="px-4 py-2 w-[182px]">{t("products.columns.product")}</th>
              <th className="px-4 py-2 w-[103px]">{t("products.columns.base")}</th>
              <th className="px-4 py-2 w-[296px]">{t("products.columns.nutrients")}</th>
              <th className="px-4 py-2 w-[314px]">{t("products.columns.source")}</th>
              <th className="px-4 py-2 w-[239px]">{t("products.columns.status")}</th>
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
                <td className="px-4 py-3 text-text">{renderNutrients(p.essentialNutrients)}</td>
                <td className="px-4 py-3 text-text-muted">{renderSource(p.source)}</td>
                <td className={`px-4 py-3 ${getStatusColor(p.status)}`}>
                  {renderStatus(p.status)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cartouche d'information */}
      <Card testID="products-notice-card" className="p-6 bg-admin-50 border-0">
        <p className="text-17 text-text leading-relaxed">
          {t("products.notice")}
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
          {t("products.viewUserSideLink")}
        </button>
      </div>
    </div>
  );
}

export default AdminProductsPage;


