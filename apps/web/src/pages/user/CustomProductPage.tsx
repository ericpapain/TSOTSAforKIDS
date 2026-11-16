import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../../i18n/setup";
import { FaPlusCircle, FaCheck, FaArrowLeft, FaCalculator } from "react-icons/fa";
import { AppHeader } from "../../components/AppHeader";
import { UserNavTabs } from "./UserNavTabs";
import { useUserStore } from "../../features/user/useUserStore";
import { useOptionalAuth } from "../../api/authContext";

export const CustomProductPage: React.FC = () => {
  const { t } = useTranslation(["mobile", "common", "nutrition"]);
  const navigate = useNavigate();
  const authContext = useOptionalAuth();
  const { addCustomProduct } = useUserStore();

  const [name, setName] = useState("");
  const [energyKcal, setEnergyKcal] = useState("450");
  const [proteinG, setProteinG] = useState("14");
  const [lipidsG, setLipidsG] = useState("22");
  const [ironMg, setIronMg] = useState("11");
  const [zincMg, setZincMg] = useState("12");
  const [calciumMg, setCalciumMg] = useState("320");
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = () => {
    authContext?.logout();
    navigate("/connexion");
  };

  const calculatedScore = Math.min(
    99,
    Math.round(
      ((parseFloat(energyKcal) || 0) / 540) * 40 +
        ((parseFloat(proteinG) || 0) / 14) * 30 +
        ((parseFloat(zincMg) || 0) / 12) * 30
    )
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(t("mobile:addProduct.requiredName", "Veuillez renseigner le nom du produit."));
      return;
    }

    addCustomProduct({
      name: name.trim(),
      category: "custom",
      specification: "Recette familiale personnalisée · Base 100g",
      portionGrams: 100,
      nutrients: {
        energyKcal: parseFloat(energyKcal) || 450,
        proteinG: parseFloat(proteinG) || 14,
        lipidsG: parseFloat(lipidsG) || 22,
        ironMg: parseFloat(ironMg) || 11,
        zincMg: parseFloat(zincMg) || 12,
        calciumMg: parseFloat(calciumMg) || 320,
      },
      equivalenceScore: calculatedScore,
    });

    setIsSuccess(true);
    setTimeout(() => {
      navigate("/nutrition/produits/plumpy-nut");
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#F1F3F2] font-sans">
      <AppHeader space="user" onLogout={handleLogout} />
      <UserNavTabs />

      <main className="mx-auto max-w-[800px] px-7 py-8">
        <button
          type="button"
          onClick={() => navigate("/nutrition/produits/plumpy-nut")}
          className="inline-flex items-center gap-2 text-[13px] font-bold text-[#5B6B66] hover:text-[#17302A] mb-4"
        >
          <FaArrowLeft size={11} />
          <span>{t("common:actions.back", "Retour aux produits")}</span>
        </button>

        <div className="rounded-xl border border-[#D5DEDA] bg-white shadow-sm overflow-hidden p-7">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <FaPlusCircle size={20} />
            </div>
            <div>
              <h1 className="text-[20px] font-bold text-[#17302A]">
                {t("mobile:addProduct.title", "Ajouter un produit ou recette personnalisée")}
              </h1>
              <p className="text-[13px] text-[#5B6B66]">
                {t(
                  "mobile:addProduct.subtitle",
                  "Définissez la composition de votre bouillie locale pour estimer son équivalence."
                )}
              </p>
            </div>
          </div>

          {isSuccess ? (
            <div className="p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-[22px]">
                <FaCheck />
              </div>
              <h2 className="text-[17px] font-bold text-[#17302A]">
                {t("mobile:addProduct.successTitle", "Produit ajouté avec succès !")}
              </h2>
              <p className="text-[13px] text-[#5B6B66]">
                {t(
                  "mobile:addProduct.successBody",
                  "Votre recette est désormais sélectionnable dans le catalogue nutritionnel."
                )}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-[13px] rounded-lg">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-[13px] font-bold text-[#17302A] mb-1">
                  {t("mobile:addProduct.productName", "Nom de la recette ou du produit")} *
                </label>
                <input
                  type="text"
                  data-testid="custom-product-name-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex : Bouillie soja-maïs enrichie à l'arachide"
                  className="w-full px-3.5 py-2.5 border border-[#D5DEDA] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              {/* Equivalence score preview card */}
              <div className="p-4 rounded-xl bg-[#F7F9F8] border border-[#E5ECE9] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FaCalculator className="text-primary text-[18px]" />
                  <div>
                    <span className="text-[13px] font-bold text-[#17302A]">
                      {t("mobile:addProduct.scoreEstimate", "Score d'équivalence estimé")}
                    </span>
                    <p className="text-[11px] text-[#5B6B66]">
                      {t("mobile:addProduct.vsReference", "Calculé par rapport au Plumpy'Nut de référence")}
                    </p>
                  </div>
                </div>
                <div
                  data-testid="equivalence-score-badge"
                  className="text-[20px] font-bold text-primary px-3 py-1 bg-white border border-primary/20 rounded-lg"
                >
                  {calculatedScore} %
                </div>
              </div>

              {/* Nutrients inputs */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-[12px] font-bold text-[#5B6B66] mb-1">
                    {t("mobile:addProduct.energyLabel", "Énergie (kcal pour 100 g)")}
                  </label>
                  <input
                    type="number"
                    value={energyKcal}
                    onChange={(e) => setEnergyKcal(e.target.value)}
                    className="w-full px-3 py-2 border border-[#D5DEDA] rounded-md text-[13px]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#5B6B66] mb-1">
                    {t("mobile:addProduct.proteinLabel", "Protéines (g pour 100 g)")}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={proteinG}
                    onChange={(e) => setProteinG(e.target.value)}
                    className="w-full px-3 py-2 border border-[#D5DEDA] rounded-md text-[13px]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#5B6B66] mb-1">
                    {t("mobile:addProduct.lipidsLabel", "Lipides (g pour 100 g)")}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={lipidsG}
                    onChange={(e) => setLipidsG(e.target.value)}
                    className="w-full px-3 py-2 border border-[#D5DEDA] rounded-md text-[13px]"
                  />
                </div>
                <div>
                  {/* eslint-disable-next-line i18next/no-literal-string */}
                  <label className="block text-[12px] font-bold text-[#5B6B66] mb-1">
                    Zinc (mg / 100g)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={zincMg}
                    onChange={(e) => setZincMg(e.target.value)}
                    className="w-full px-3 py-2 border border-[#D5DEDA] rounded-md text-[13px]"
                  />
                </div>
                <div>
                  {/* eslint-disable-next-line i18next/no-literal-string */}
                  <label className="block text-[12px] font-bold text-[#5B6B66] mb-1">
                    Fer (mg / 100g)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={ironMg}
                    onChange={(e) => setIronMg(e.target.value)}
                    className="w-full px-3 py-2 border border-[#D5DEDA] rounded-md text-[13px]"
                  />
                </div>
                <div>
                  {/* eslint-disable-next-line i18next/no-literal-string */}
                  <label className="block text-[12px] font-bold text-[#5B6B66] mb-1">
                    Calcium (mg / 100g)
                  </label>
                  <input
                    type="number"
                    value={calciumMg}
                    onChange={(e) => setCalciumMg(e.target.value)}
                    className="w-full px-3 py-2 border border-[#D5DEDA] rounded-md text-[13px]"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[#E5ECE9] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/nutrition/produits/plumpy-nut")}
                  className="px-4 py-2.5 text-[13px] font-bold text-[#5B6B66] hover:text-[#17302A]"
                >
                  {t("common:actions.cancel", "Annuler")}
                </button>
                <button
                  type="submit"
                  data-testid="save-custom-product-btn"
                  className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white text-[13px] font-bold rounded-lg shadow-sm transition-colors"
                >
                  {t("mobile:addProduct.saveBtn", "Enregistrer la recette")}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
};

export default CustomProductPage;
