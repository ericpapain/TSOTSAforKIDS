import React from "react";
import { useTranslation } from "react-i18next";
import "../../i18n/setup";
import type { ReferenceProduct } from "../../features/nutrition/types";

export interface ProductSelectorDropdownProps {
  selectedProduct: ReferenceProduct;
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (product: ReferenceProduct) => void;
  refProducts: ReferenceProduct[];
  customProducts: ReferenceProduct[];
}

export const ProductSelectorDropdown: React.FC<ProductSelectorDropdownProps> = ({
  selectedProduct,
  isOpen,
  onToggle,
  onSelect,
  refProducts,
  customProducts,
}) => {
  const { t } = useTranslation("nutrition");

  return (
    <div className="relative">
      <button
        type="button"
        data-testid="product-selector"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={onToggle}
        className="h-[51px] w-full rounded-[7px] border border-[#0F7B5F] bg-white px-4 flex items-center justify-between cursor-pointer hover:bg-[#F7F9F8] transition-colors text-left"
      >
        <span className="text-[21px] font-bold text-[#17302A]">
          {`${selectedProduct.name} \u00a0${isOpen ? "▴" : "▾"}`}
        </span>
      </button>

      {isOpen && (
        <div
          role="listbox"
          data-testid="product-dropdown-menu"
          className="absolute left-0 right-0 top-[56px] z-30 rounded-[9px] border border-[#D5DEDA] bg-white shadow-lg overflow-hidden"
        >
          <div className="px-4 py-2 bg-[#F7F9F8] text-[12px] font-bold uppercase tracking-wider text-[#5B6B66]">
            {t("productCard.referenceSection")}
          </div>
          <div className="divide-y divide-[#E5ECE9]">
            {refProducts.map((prod) => {
              const isSelected = prod.id === selectedProduct.id;
              return (
                <button
                  key={prod.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  data-testid={`product-option-${prod.id}`}
                  onClick={() => onSelect(prod)}
                  className={`w-full px-4 py-3 text-left flex items-center justify-between transition-colors hover:bg-[#EDF5F2] ${
                    isSelected ? "bg-[#E7F4EE]" : "bg-white"
                  }`}
                >
                  <div>
                    <div className="text-[16px] font-bold text-[#17302A]">{prod.name}</div>
                    {prod.usage && <div className="text-[13px] text-[#5B6B66]">{prod.usage}</div>}
                  </div>
                  {isSelected && <span className="text-[#0F7B5F] font-bold text-[16px]">{"✓"}</span>}
                </button>
              );
            })}
          </div>

          {customProducts.length > 0 && (
            <>
              <div className="px-4 py-2 bg-[#F7F9F8] border-t border-[#E5ECE9] text-[12px] font-bold uppercase tracking-wider text-[#5B6B66]">
                {t("productCard.customSection")}
              </div>
              <div className="divide-y divide-[#E5ECE9]">
                {customProducts.map((prod) => {
                  const isSelected = prod.id === selectedProduct.id;
                  return (
                    <button
                      key={prod.id}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      data-testid={`product-option-${prod.id}`}
                      onClick={() => onSelect(prod)}
                      className={`w-full px-4 py-3 text-left flex items-center justify-between transition-colors hover:bg-[#EDF5F2] ${
                        isSelected ? "bg-[#E7F4EE]" : "bg-white"
                      }`}
                    >
                      <div>
                        <div className="text-[16px] font-bold text-[#17302A]">{prod.name}</div>
                        {prod.usage && <div className="text-[13px] text-[#5B6B66]">{prod.usage}</div>}
                      </div>
                      {prod.statusBadge && (
                        <span className="rounded-full bg-[#FFF4D6] px-2.5 py-0.5 text-[12px] font-bold text-[#B7791F]">
                          {prod.statusBadge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
