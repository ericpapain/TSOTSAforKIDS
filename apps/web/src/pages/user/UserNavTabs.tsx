import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaUtensils, FaUsers, FaHistory, FaPlusCircle, FaCog, FaChevronDown } from "react-icons/fa";
import { useUserStore } from "../../features/user/useUserStore";

export interface UserNavTabsProps {
  onOpenAddChild?: () => void;
}

export const UserNavTabs: React.FC<UserNavTabsProps> = ({ onOpenAddChild }) => {
  const location = useLocation();
  const { t } = useTranslation(["common", "nutrition", "mobile"]);
  const { children, activeChild, setActiveChild } = useUserStore();
  const [isChildDropdownOpen, setIsChildDropdownOpen] = React.useState(false);

  const tabs = [
    {
      id: "nutrition",
      path: "/nutrition/produits/plumpy-nut",
      label: t("mobile:modules.nutrition", "Nutrition"),
      icon: <FaUtensils className="shrink-0" />,
    },
    {
      id: "family",
      path: "/famille",
      label: t("mobile:persons.title", "Mes enfants & Famille"),
      icon: <FaUsers className="shrink-0" />,
      badge: children.length,
    },
    {
      id: "history",
      path: "/historique",
      label: t("mobile:history.title", "Historique des prises"),
      icon: <FaHistory className="shrink-0" />,
    },
    {
      id: "custom-product",
      path: "/mes-produits/nouveau",
      label: t("mobile:products.addCustom", "+ Nouveau produit"),
      icon: <FaPlusCircle className="shrink-0" />,
    },
    {
      id: "settings",
      path: "/parametres",
      label: t("common:header.settings", "Réglages"),
      icon: <FaCog className="shrink-0" />,
    },
  ];

  return (
    <nav
      data-testid="user-nav-tabs"
      aria-label="Navigation espace utilisateur"
      className="w-full bg-white border-b border-[#D5DEDA] px-7 py-2.5 flex flex-wrap items-center justify-between gap-4 select-none sticky top-[63px] z-40 shadow-xs"
    >
      <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto py-1">
        {tabs.map((tab) => {
          const isActive =
            tab.path === "/nutrition/produits/plumpy-nut"
              ? location.pathname.startsWith("/nutrition")
              : location.pathname === tab.path;

          return (
            <Link
              key={tab.id}
              to={tab.path}
              data-testid={`user-nav-tab-${tab.id}`}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[13px] font-bold transition-colors shrink-0 ${
                isActive
                  ? "bg-primary text-white shadow-xs"
                  : "text-[#5B6B66] hover:text-[#17302A] hover:bg-[#F1F3F2]"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {typeof tab.badge === "number" && (
                <span
                  className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? "bg-white/25 text-white" : "bg-[#E5ECE9] text-[#17302A]"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Active child quick selector */}
      {activeChild && (
        <div className="relative shrink-0">
          <button
            type="button"
            data-testid="active-child-selector-btn"
            onClick={() => setIsChildDropdownOpen((prev) => !prev)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#D5DEDA] bg-[#F7F9F8] hover:bg-[#EDF5F2] transition-colors text-[13px] font-bold text-[#17302A]"
          >
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span>
              {activeChild.firstName} ({activeChild.code})
            </span>
            <FaChevronDown size={11} className="text-[#5B6B66]" />
          </button>

          {isChildDropdownOpen && (
            <div
              data-testid="active-child-dropdown"
              className="absolute right-0 top-[38px] z-50 w-[240px] rounded-lg border border-[#D5DEDA] bg-white shadow-lg overflow-hidden py-1"
            >
              <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#5B6B66] border-b border-[#E5ECE9]">
                {t("mobile:persons.selectChild", "Choisir l'enfant actif")}
              </div>
              {children.map((child) => (
                <button
                  key={child.id}
                  type="button"
                  onClick={() => {
                    setActiveChild(child.id);
                    setIsChildDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-[#F1F3F2] transition-colors text-[13px] ${
                    child.id === activeChild.id ? "bg-[#EDF5F2] font-bold text-primary" : "text-[#17302A]"
                  }`}
                >
                  <span>{child.firstName}</span>
                  <span className="text-[11px] text-[#5B6B66]">{child.code}</span>
                </button>
              ))}
              {onOpenAddChild && (
                <div className="border-t border-[#E5ECE9] mt-1 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsChildDropdownOpen(false);
                      onOpenAddChild();
                    }}
                    className="w-full text-left px-3 py-1.5 text-[12px] font-bold text-primary hover:bg-[#EDF5F2] flex items-center gap-1.5"
                  >
                    <FaPlusCircle size={12} />
                    <span>{t("mobile:persons.addPerson", "Ajouter un enfant")}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </nav>
  );
};
