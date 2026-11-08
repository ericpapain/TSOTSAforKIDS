import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "../../components/AppHeader";
import {
  PLUMPY_NUT_REFERENCE,
  EQUIVALENT_LOCAL_FOODS,
} from "../../features/nutrition/nutritionData";
import type {
  EquivalentLocalFood,
  RegionFilter,
} from "../../features/nutrition/types";
import { FoodDetailModal } from "./FoodDetailModal";

export const NutritionPage: React.FC = () => {
  const navigate = useNavigate();
  const [regionFilter, setRegionFilter] = useState<RegionFilter>("all");
  const [selectedFood, setSelectedFood] = useState<EquivalentLocalFood | null>(null);
  const [mobileMessage, setMobileMessage] = useState<string | null>(null);

  const displayedFoods = useMemo(() => {
    if (regionFilter === "west") {
      return EQUIVALENT_LOCAL_FOODS.filter((food) => food.availableInWestRegion);
    }
    return EQUIVALENT_LOCAL_FOODS;
  }, [regionFilter]);

  const toggleRegionFilter = () => {
    setRegionFilter((prev) => (prev === "all" ? "west" : "all"));
  };

  const handleMobileClick = () => {
    setMobileMessage("Redirection vers la version mobile...");
    setTimeout(() => {
      setMobileMessage(null);
      navigate("/dev/catalog");
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#F1F3F2] font-sans">
      <AppHeader
        space="user"
        spaceTitle="Espace utilisateur (web)"
        userName="Compte démo · Amina"
      />

      <main className="mx-auto max-w-[1440px] px-7 py-6">
        {mobileMessage && (
          <div
            data-testid="mobile-toast"
            className="mb-4 rounded-lg bg-primary-50 border border-primary/20 p-3 text-sm font-semibold text-primary"
          >
            {mobileMessage}
          </div>
        )}

        <div className="flex flex-col gap-6 lg:flex-row items-start justify-between">
          {/* Card 1: Produit de référence (Plumpy'Nut) */}
          <section
            data-testid="product-card"
            className="w-full lg:w-[524px] min-h-[570px] rounded-[9px] border border-[#D5DEDA] bg-white p-5 flex flex-col justify-between shadow-sm"
          >
            <div>
              <h2 className="text-[16px] font-bold text-[#5B6B66] mb-2">Produit</h2>
              <div
                data-testid="product-selector"
                className="h-[51px] w-full rounded-[7px] border border-[#0F7B5F] bg-white px-4 flex items-center justify-between"
              >
                <span className="text-[21px] font-bold text-[#17302A]">
                  {PLUMPY_NUT_REFERENCE.name} &nbsp;▾
                </span>
              </div>

              <p className="mt-3 text-[14px] text-[#5B6B66]">
                {PLUMPY_NUT_REFERENCE.specification}
              </p>

              {/* Composition table rows */}
              <div className="mt-2 divide-y divide-[#E5ECE9] rounded-md overflow-hidden text-[16px]">
                {PLUMPY_NUT_REFERENCE.nutrients.map((n, idx) => (
                  <div
                    key={n.name}
                    className={`flex h-[41px] items-center justify-between px-3 ${
                      idx % 2 === 0 ? "bg-[#F7F9F8]" : "bg-white"
                    }`}
                  >
                    <span
                      className={`text-[#17302A] ${
                        n.isKey ? "font-bold" : "font-normal"
                      }`}
                    >
                      {n.name}
                    </span>
                    <span className="text-right text-[#17302A] font-normal">
                      {n.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 mt-4">
              <div className="h-[51px] rounded-[7px] bg-[#F1F3F2] px-4 flex items-center text-[16px] text-[#5B6B66]">
                {PLUMPY_NUT_REFERENCE.costInfo}
              </div>

              <div className="min-h-[80px] rounded-[7px] bg-[#FFF4D6] p-4 flex items-center text-[14px] text-[#7A5300] leading-snug">
                {PLUMPY_NUT_REFERENCE.notice}
              </div>
            </div>
          </section>

          {/* Card 2: Aliments locaux équivalents */}
          <section
            data-testid="equivalents-card"
            className="w-full lg:w-[838px] min-h-[570px] rounded-[9px] border border-[#D5DEDA] bg-white p-5 flex flex-col justify-between shadow-sm"
          >
            <div>
              {/* Header: Title and Mobile link */}
              <div className="flex items-center justify-between mb-3">
                <h1 className="text-[22px] font-bold text-[#17302A]">
                  Aliments locaux équivalents
                </h1>
                <button
                  type="button"
                  data-testid="mobile-version-btn"
                  onClick={handleMobileClick}
                  className="text-[17px] font-bold text-[#0F7B5F] hover:underline"
                >
                  ← Version mobile
                </button>
              </div>

              {/* Filter Pills */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span
                  data-testid="nutrients-pill"
                  className="inline-flex items-center rounded-full bg-[#E7F4EE] px-4 py-1.5 text-[13px] font-bold text-[#0F7B5F]"
                >
                  Nutriments : protéines, lipides, fer
                </span>

                <button
                  type="button"
                  data-testid="region-filter-btn"
                  onClick={toggleRegionFilter}
                  className="inline-flex items-center rounded-full bg-[#F1F3F2] px-4 py-1.5 text-[13px] font-bold text-[#17302A] hover:bg-[#E5ECE9] transition-colors"
                >
                  {regionFilter === "all" ? "Toutes régions ▾" : "Région Ouest ▾"}
                </button>
              </div>

              {/* Table of equivalents */}
              <div className="overflow-x-auto rounded-md">
                <table className="w-full text-left text-[14px] border-collapse">
                  <thead>
                    <tr className="h-[39px] bg-[#0F7B5F] text-white font-bold">
                      <th className="px-3 w-[40px]">#</th>
                      <th className="px-3">Aliment local</th>
                      <th className="px-2 w-[70px]">Commun</th>
                      <th className="px-2 w-[90px]">En plus</th>
                      <th className="px-2 w-[85px]">Protéines</th>
                      <th className="px-2 w-[85px]">Lipides</th>
                      <th className="px-2 w-[75px]">Fer</th>
                      <th className="px-3 w-[100px]">Région Ouest</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedFoods.map((food, idx) => (
                      <tr
                        key={food.id}
                        data-testid={`food-row-${food.id}`}
                        onClick={() => setSelectedFood(food)}
                        className={`h-[50px] cursor-pointer transition-colors hover:bg-[#EDF5F2] ${
                          idx % 2 === 0 ? "bg-[#F7F9F8]" : "bg-white"
                        }`}
                      >
                        <td className="px-3 text-[#17302A] text-[16px]">{food.rank}</td>
                        <td className="px-3 font-bold text-[16px]">
                          <span
                            className={
                              food.id === "arachide"
                                ? "text-[#0F7B5F] underline"
                                : "text-[#17302A]"
                            }
                          >
                            {food.name}
                          </span>
                        </td>
                        <td className="px-2 text-[#17302A] text-[16px]">{food.commonNutrientsCount}</td>
                        <td className="px-2 text-[#17302A] text-[16px]">{food.extraNutrient}</td>
                        <td className="px-2 text-[#17302A] text-[16px]">{food.proteins}</td>
                        <td className="px-2 text-[#17302A] text-[16px]">{food.lipids}</td>
                        <td className="px-2 text-[#17302A] text-[16px]">{food.iron}</td>
                        <td className="px-3 text-[#17302A] text-[16px]">
                          {food.availableInWestRegion ? "✓" : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <p className="mt-4 text-[13px] italic text-[#5B6B66]">
              Valeurs pour 100 g. Démo : USDA indicatives ; en production : base aliments extraite d'ORKG et validée.
            </p>
          </section>
        </div>
      </main>

      <FoodDetailModal food={selectedFood} onClose={() => setSelectedFood(null)} />
    </div>
  );
};

export default NutritionPage;
