import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { formatNumber, normalizeLocale, DEFAULT_LOCALE } from "@tsotsa/i18n";
import "../../i18n/setup";
import { AppHeader } from "../../components/AppHeader";
import { useOptionalAuth } from "../../api/authContext";
import { getLocalizedProducts, getLocalizedEquivalentFoods } from "../../features/nutrition/nutritionI18n";
import type { ReferenceProduct, EquivalentLocalFood, RegionFilter } from "../../features/nutrition/types";
import { FoodDetailModal } from "./FoodDetailModal";
import { ProductSelectorDropdown } from "./ProductSelectorDropdown";
import { RegionFilterDropdown } from "./RegionFilterDropdown";
import { ConfirmIntakeModal } from "./ConfirmIntakeModal";

export const NutritionPage: React.FC = () => {
  const { t, i18n } = useTranslation("nutrition");
  const { t: tMedical } = useTranslation("medical");
  const locale = normalizeLocale(i18n.resolvedLanguage ?? i18n.language) ?? DEFAULT_LOCALE;
  const navigate = useNavigate();

  const [selectedProductId, setSelectedProductId] = useState<string>("plumpy-nut");
  const [isProductMenuOpen, setIsProductMenuOpen] = useState(false);
  const [regionFilter, setRegionFilter] = useState<RegionFilter>("all");
  const [isRegionMenuOpen, setIsRegionMenuOpen] = useState(false);
  const [selectedFoodId, setSelectedFoodId] = useState<string | null>(null);
  const [giveModalItem, setGiveModalItem] = useState<{ name: string; unit: string } | null>(null);
  const [mobileMessage, setMobileMessage] = useState<string | null>(null);

  useEffect(() => {
    document.title = t("pageTitle");
  }, [t]);

  const allProducts = useMemo(() => getLocalizedProducts(t, tMedical, locale), [t, tMedical, locale]);
  const selectedProduct = useMemo(
    () => allProducts.find((p) => p.id === selectedProductId) ?? allProducts[0],
    [allProducts, selectedProductId]
  );
  const refProducts = useMemo(() => allProducts.filter((p) => p.category !== "custom"), [allProducts]);
  const customProducts = useMemo(() => allProducts.filter((p) => p.category === "custom"), [allProducts]);
  const allFoods = useMemo(() => getLocalizedEquivalentFoods(t, locale), [t, locale]);
  const selectedFood = useMemo(
    () => (selectedFoodId ? allFoods.find((f) => f.id === selectedFoodId) ?? null : null),
    [allFoods, selectedFoodId]
  );

  const displayedFoods = useMemo(() => {
    if (regionFilter === "all") return allFoods;
    if (regionFilter === "west") return allFoods.filter((food) => food.availableInWestRegion);
    return allFoods.filter((food) =>
      food.regions ? food.regions.includes(regionFilter) : food.availableInWestRegion
    );
  }, [allFoods, regionFilter]);

  const activeRegionColumnHeader = useMemo(() => t(`regions.${regionFilter}.shortName`), [t, regionFilter]);

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
    setSelectedProductId(product.id);
    setIsProductMenuOpen(false);
  };

  const handleMobileClick = () => {
    setMobileMessage(t("equivalentsCard.mobileRedirectToast"));
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
      { id: "usr-care-demo", name: "Prof. Félicité Ngeufack", role: "caregiver", isVerifiedCaregiver: true },
      "token-session",
      "refresh-session"
    );
    navigate("/soignant/personnes/A-014");
  };

  return (
    <div className="min-h-screen bg-[#F1F3F2] font-sans">
      <AppHeader space="user" onLogout={handleLogout} />

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
          {/* Card 1: Produit de référence */}
          <section
            data-testid="product-card"
            className="w-full lg:w-[524px] min-h-[570px] rounded-[9px] border border-[#D5DEDA] bg-white p-5 flex flex-col justify-between shadow-sm"
          >
            <div>
              <h2 className="text-[16px] font-bold text-[#5B6B66] mb-2">
                {t("productCard.title")}
              </h2>
              <ProductSelectorDropdown
                selectedProduct={selectedProduct}
                isOpen={isProductMenuOpen}
                onToggle={() => setIsProductMenuOpen((prev) => !prev)}
                onSelect={handleSelectProduct}
                refProducts={refProducts}
                customProducts={customProducts}
              />

              <p className="mt-3 text-[14px] text-[#5B6B66]">{selectedProduct.specification}</p>

              <div className="mt-2 divide-y divide-[#E5ECE9] rounded-md overflow-hidden text-[16px]">
                {selectedProduct.nutrients.map((n, idx) => (
                  <div
                    key={n.name}
                    className={`flex h-[41px] items-center justify-between px-3 ${idx % 2 === 0 ? "bg-[#F7F9F8]" : "bg-white"}`}
                  >
                    <span className={`text-[#17302A] ${n.isKey ? "font-bold" : "font-normal"}`}>
                      {n.name}
                    </span>
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
                {t("productCard.giveButton", { name: "Hamadou" })}
              </button>
            </div>
          </section>

          {/* Card 2: Aliments locaux équivalents */}
          <section
            data-testid="equivalents-card"
            className="w-full lg:w-[838px] min-h-[570px] rounded-[9px] border border-[#D5DEDA] bg-white p-5 flex flex-col justify-between shadow-sm"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <h1 className="text-[22px] font-bold text-[#17302A]">
                  {t("equivalentsCard.title")}
                </h1>
                <button
                  type="button"
                  data-testid="mobile-version-btn"
                  onClick={handleMobileClick}
                  className="text-[17px] font-bold text-[#0F7B5F] hover:underline"
                >
                  {t("equivalentsCard.mobileVersion")}
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span
                  data-testid="nutrients-pill"
                  className="inline-flex items-center rounded-full bg-[#E7F4EE] px-4 py-1.5 text-[13px] font-bold text-[#0F7B5F]"
                >
                  {selectedProduct.keyNutrientsSummary ?? t("equivalentsCard.defaultNutrientsSummary")}
                </span>

                <RegionFilterDropdown
                  regionFilter={regionFilter}
                  isOpen={isRegionMenuOpen}
                  onToggle={() => setIsRegionMenuOpen((prev) => !prev)}
                  onSelect={handleSelectRegion}
                />
              </div>

              <div className="overflow-x-auto rounded-md" data-testid="ranked-foods-table">
                <table className="w-full text-left text-[14px] border-collapse">
                  <thead>
                    <tr className="h-[39px] bg-[#0F7B5F] text-white font-bold">
                      <th className="px-3 w-[40px]">{t("table.rank")}</th>
                      <th className="px-3">{t("table.localFood")}</th>
                      <th className="px-2 w-[70px]">{t("table.common")}</th>
                      <th className="px-2 w-[90px]">{t("table.extra")}</th>
                      <th className="px-2 w-[85px]">{t("table.proteins")}</th>
                      <th className="px-2 w-[85px]">{t("table.lipids")}</th>
                      <th className="px-2 w-[75px]">{t("table.iron")}</th>
                      <th className="px-3 w-[120px]">{activeRegionColumnHeader}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedFoods.map((food, idx) => (
                      <tr
                        key={food.id}
                        data-testid={`food-row-${food.id}`}
                        onClick={() => setSelectedFoodId(food.id)}
                        className={`h-[50px] cursor-pointer transition-colors hover:bg-[#EDF5F2] ${
                          idx % 2 === 0 ? "bg-[#F7F9F8]" : "bg-white"
                        }`}
                      >
                        <td className="px-3 text-[#17302A] text-[16px]">
                          {formatNumber(food.rank, locale)}
                        </td>
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
                {t("equivalentsCard.footnote")}
              </p>
              <button
                type="button"
                data-testid="give-equivalent-btn"
                onClick={() =>
                  setGiveModalItem({
                    name: displayedFoods[0]?.name ?? selectedProduct.name,
                    unit: "portion",
                  })
                }
                className="shrink-0 h-[44px] px-5 rounded-[9px] bg-[#0F7B5F] hover:bg-[#0c634c] text-white text-[15px] font-bold transition-colors cursor-pointer"
              >
                {t("equivalentsCard.confirmIntakeBtn")}
              </button>
            </div>
          </section>
        </div>
      </main>

      <FoodDetailModal
        food={selectedFood}
        onClose={() => setSelectedFoodId(null)}
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
