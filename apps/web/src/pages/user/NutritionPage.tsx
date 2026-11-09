import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "../../components/AppHeader";
import { useOptionalAuth } from "../../api/authContext";
import {
  PLUMPY_NUT_REFERENCE,
  REFERENCE_PRODUCTS_LIST,
  EQUIVALENT_LOCAL_FOODS,
  CAMEROON_REGIONS,
} from "../../features/nutrition/nutritionData";
import type { ReferenceProduct, EquivalentLocalFood, RegionFilter } from "../../features/nutrition/types";
import { FoodDetailModal } from "./FoodDetailModal";
import { ProductSelectorDropdown } from "./ProductSelectorDropdown";
import { RegionFilterDropdown } from "./RegionFilterDropdown";
import { ConfirmIntakeModal } from "./ConfirmIntakeModal";

export const NutritionPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedProduct, setSelectedProduct] = useState<ReferenceProduct>(PLUMPY_NUT_REFERENCE);
  const [isProductMenuOpen, setIsProductMenuOpen] = useState(false);
  const [regionFilter, setRegionFilter] = useState<RegionFilter>("all");
  const [isRegionMenuOpen, setIsRegionMenuOpen] = useState(false);
  const [selectedFood, setSelectedFood] = useState<EquivalentLocalFood | null>(null);
  const [giveModalItem, setGiveModalItem] = useState<{ name: string; unit: string } | null>(null);
  const [mobileMessage, setMobileMessage] = useState<string | null>(null);

  const refProducts = useMemo(() => REFERENCE_PRODUCTS_LIST.filter((p) => p.category !== "custom"), []);
  const customProducts = useMemo(() => REFERENCE_PRODUCTS_LIST.filter((p) => p.category === "custom"), []);

  const displayedFoods = useMemo(() => {
    if (regionFilter === "all") return EQUIVALENT_LOCAL_FOODS;
    if (regionFilter === "west") return EQUIVALENT_LOCAL_FOODS.filter((food) => food.availableInWestRegion);
    return EQUIVALENT_LOCAL_FOODS.filter((food) =>
      food.regions ? food.regions.includes(regionFilter) : food.availableInWestRegion
    );
  }, [regionFilter]);

  const activeRegionColumnHeader = useMemo(() => {
    const found = CAMEROON_REGIONS.find((r) => r.code === regionFilter);
    return found ? found.shortName : "Région Ouest";
  }, [regionFilter]);

  const isFoodAvailableInCurrentColumn = (food: EquivalentLocalFood): boolean => {
    const targetRegion = regionFilter === "all" ? "west" : regionFilter;
    if (targetRegion === "west") return food.availableInWestRegion;
    return food.regions ? food.regions.includes(targetRegion) : food.availableInWestRegion;
  };

  const handleSelectRegion = (region: RegionFilter) => {
    setRegionFilter(region);
    setIsRegionMenuOpen(false);
  };

  const handleSelectProduct = (product: ReferenceProduct) => {
    setSelectedProduct(product);
    setIsProductMenuOpen(false);
  };

  const handleMobileClick = () => {
    setMobileMessage("Redirection vers la version mobile...");
    setTimeout(() => {
      setMobileMessage(null);
      navigate("/dev/catalog");
    }, 800);
  };

  const authContext = useOptionalAuth();

  const handleLogout = () => {
    authContext?.logout();
    navigate("/connexion");
  };

  const handleViewCaregiverSide = () => {
    authContext?.setSession(
      {
        id: "usr-care-demo",
        name: "Prof. Félicité Ngeufack",
        role: "caregiver",
        isVerifiedCaregiver: true,
      },
      "token-session",
      "refresh-session"
    );
    navigate("/soignant/personnes/A-014");
  };

  return (
    <div className="min-h-screen bg-[#F1F3F2] font-sans">
      <AppHeader space="user" spaceTitle="Espace utilisateur (web)" userName="Compte démo · Hamadou" onLogout={handleLogout} />

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
              <ProductSelectorDropdown
                selectedProduct={selectedProduct}
                isOpen={isProductMenuOpen}
                onToggle={() => setIsProductMenuOpen((prev) => !prev)}
                onSelect={handleSelectProduct}
                refProducts={refProducts}
                customProducts={customProducts}
              />

              <p className="mt-3 text-[14px] text-[#5B6B66]">{selectedProduct.specification}</p>

              {/* Composition table rows */}
              <div className="mt-2 divide-y divide-[#E5ECE9] rounded-md overflow-hidden text-[16px]">
                {selectedProduct.nutrients.map((n, idx) => (
                  <div
                    key={n.name}
                    className={`flex h-[41px] items-center justify-between px-3 ${idx % 2 === 0 ? "bg-[#F7F9F8]" : "bg-white"}`}
                  >
                    <span className={`text-[#17302A] ${n.isKey ? "font-bold" : "font-normal"}`}>{n.name}</span>
                    <span className="text-right text-[#17302A] font-normal">{n.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 mt-4">
              <div className="h-[51px] rounded-[7px] bg-[#F1F3F2] px-4 flex items-center text-[16px] text-[#5B6B66]">
                {selectedProduct.costInfo}
              </div>
              <div className="min-h-[80px] rounded-[7px] bg-[#FFF4D6] p-4 flex items-center text-[14px] text-[#7A5300] leading-snug">
                {selectedProduct.notice}
              </div>
              <button
                type="button"
                data-testid="give-product-btn"
                onClick={() =>
                  setGiveModalItem({
                    name: selectedProduct.name,
                    unit: selectedProduct.id.startsWith("f-") ? "repas (100 ml)" : "sachet",
                  })
                }
                className="w-full h-[48px] rounded-[9px] bg-[#0F7B5F] hover:bg-[#0c634c] text-white text-[17px] font-bold transition-colors cursor-pointer shadow-sm"
              >
                Donner à Hamadou
              </button>
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
                  {selectedProduct.keyNutrientsSummary ?? "Nutriments : protéines, lipides, fer"}
                </span>

                <RegionFilterDropdown
                  regionFilter={regionFilter}
                  isOpen={isRegionMenuOpen}
                  onToggle={() => setIsRegionMenuOpen((prev) => !prev)}
                  onSelect={handleSelectRegion}
                />
              </div>

              {/* Table of equivalents */}
              <div className="overflow-x-auto rounded-md" data-testid="ranked-foods-table">
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
                      <th className="px-3 w-[120px]">{activeRegionColumnHeader}</th>
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
                          {isFoodAvailableInCurrentColumn(food) ? "✓" : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-[13px] italic text-[#5B6B66]">
                Valeurs pour 100 g. Démo : USDA indicatives ; en production : base aliments extraite d'ORKG et validée.
              </p>
              <button
                type="button"
                data-testid="give-equivalent-btn"
                onClick={() =>
                  setGiveModalItem({
                    name: displayedFoods[0]?.name ?? "Arachide",
                    unit: "portion",
                  })
                }
                className="shrink-0 h-[44px] px-5 rounded-[9px] bg-[#0F7B5F] hover:bg-[#0c634c] text-white text-[15px] font-bold transition-colors cursor-pointer"
              >
                Confirmer une prise ›
              </button>
            </div>
          </section>
        </div>
      </main>

      <FoodDetailModal
        food={selectedFood}
        onClose={() => setSelectedFood(null)}
        onGiveFood={(food) => setGiveModalItem({ name: food.name, unit: "portion" })}
      />

      <ConfirmIntakeModal
        isOpen={!!giveModalItem}
        personName="Hamadou"
        itemName={giveModalItem?.name ?? selectedProduct.name}
        defaultUnit={giveModalItem?.unit ?? "sachet"}
        onClose={() => setGiveModalItem(null)}
        onViewCaregiverSide={handleViewCaregiverSide}
      />
    </div>
  );
};

export default NutritionPage;

