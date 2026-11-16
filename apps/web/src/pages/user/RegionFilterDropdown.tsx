import React from "react";
import { useTranslation } from "react-i18next";
import "../../i18n/setup";
import { CAMEROON_REGIONS } from "../../features/nutrition/nutritionData";
import type { RegionFilter } from "../../features/nutrition/types";

export interface RegionFilterDropdownProps {
  regionFilter: RegionFilter;
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (region: RegionFilter) => void;
}

export const RegionFilterDropdown: React.FC<RegionFilterDropdownProps> = ({
  regionFilter,
  isOpen,
  onToggle,
  onSelect,
}) => {
  const { t } = useTranslation("nutrition");
  const activeOption =
    CAMEROON_REGIONS.find((r) => r.code === regionFilter) ?? CAMEROON_REGIONS[0];

  const getRegionLabel = (code: RegionFilter): string => t(`regions.${code}.label`);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        data-testid="region-filter-btn"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={onToggle}
        className="inline-flex items-center rounded-full bg-[#F1F3F2] px-4 py-1.5 text-[13px] font-bold text-[#17302A] hover:bg-[#E5ECE9] transition-colors cursor-pointer"
      >
        {`${getRegionLabel(activeOption.code)} ${isOpen ? "▴" : "▾"}`}
      </button>

      {isOpen && (
        <div
          role="listbox"
          data-testid="region-dropdown-menu"
          className="absolute left-0 top-[38px] z-30 w-[230px] max-h-[320px] overflow-y-auto rounded-[9px] border border-[#D5DEDA] bg-white shadow-lg divide-y divide-[#E5ECE9]"
        >
          {CAMEROON_REGIONS.map((reg) => {
            const isSelected = reg.code === regionFilter;
            return (
              <button
                key={reg.code}
                type="button"
                role="option"
                aria-selected={isSelected}
                data-testid={`region-option-${reg.code}`}
                onClick={() => onSelect(reg.code)}
                className={`w-full px-4 py-2.5 text-left text-[14px] flex items-center justify-between transition-colors hover:bg-[#EDF5F2] ${
                  isSelected
                    ? "bg-[#E7F4EE] font-bold text-[#0F7B5F]"
                    : "bg-white font-normal text-[#17302A]"
                }`}
              >
                <span>{getRegionLabel(reg.code)}</span>
                {isSelected && <span className="font-bold">{"✓"}</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
