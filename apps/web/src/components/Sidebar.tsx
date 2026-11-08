import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FaTachometerAlt,
  FaUsers,
  FaExclamationTriangle,
  FaBell,
  FaClipboardList,
  FaCog,
  FaCheckCircle,
  FaUserCog,
  FaDatabase,
  FaPlus,
  FaFileUpload,
  FaBoxOpen,
  FaTag,
  FaChartLine,
  FaThLarge,
  FaUtensils,
  FaUserCheck,
  FaFlask,
  FaMoneyBillWave,
  FaCalculator,
  FaToggleOn,
} from "react-icons/fa";
import type { NavItem, SpaceTheme } from "../types";

export type { NavItem };

export interface SidebarProps {
  items: NavItem[];
  spaceTheme?: SpaceTheme;
  space?: SpaceTheme;
  testID?: string;
  className?: string;
  activePath?: string;
  onNavigate?: (path: string) => void;
}

const themeActiveStyles: Record<string, { bg: string; text: string }> = {
  primary: { bg: "bg-primary-50", text: "text-primary" },
  care: { bg: "bg-care-50", text: "text-care" },
  admin: { bg: "bg-admin-50", text: "text-admin" },
  user: { bg: "bg-primary-50", text: "text-primary" },
  caregiver: { bg: "bg-care-50", text: "text-care" },
};

export const ICON_MAP: Record<string, React.JSX.Element> = {
  "tachometer-alt": <FaTachometerAlt size={23} />,
  dashboard: <FaTachometerAlt size={23} />,
  "user-check": <FaUserCheck size={23} />,
  users: <FaUsers size={23} />,
  patients: <FaUsers size={23} />,
  "exclamation-triangle": <FaExclamationTriangle size={23} />,
  bell: <FaBell size={23} />,
  notifications: <FaBell size={23} />,
  "clipboard-list": <FaClipboardList size={23} />,
  cog: <FaCog size={23} />,
  settings: <FaCog size={23} />,
  "check-circle": <FaCheckCircle size={23} />,
  verify: <FaCheckCircle size={23} />,
  "user-cog": <FaUserCog size={23} />,
  accounts: <FaUserCog size={23} />,
  database: <FaDatabase size={23} />,
  foods: <FaDatabase size={23} />,
  flask: <FaFlask size={23} />,
  "money-bill-wave": <FaMoneyBillWave size={23} />,
  calculator: <FaCalculator size={23} />,
  "toggle-on": <FaToggleOn size={23} />,
  plus: <FaPlus size={23} />,
  "file-upload": <FaFileUpload size={23} />,
  "box-open": <FaBoxOpen size={23} />,
  products: <FaBoxOpen size={23} />,
  tag: <FaTag size={23} />,
  prices: <FaTag size={23} />,
  "chart-line": <FaChartLine size={23} />,
  optimize: <FaChartLine size={23} />,
  "th-large": <FaThLarge size={23} />,
  modules: <FaThLarge size={23} />,
  utensils: <FaUtensils size={23} />,
};

export function Sidebar({
  items,
  spaceTheme,
  space = "primary",
  testID = "sidebar-nav",
  className = "",
  activePath,
  onNavigate,
}: SidebarProps): React.JSX.Element {
  let locationPath = "";
  try {
    const location = useLocation();
    locationPath = location.pathname;
  } catch {
    // outside router
  }

  const currentPath = activePath ?? locationPath;
  const currentSpace = spaceTheme ?? space;
  const activeStyle = themeActiveStyles[currentSpace] || themeActiveStyles.primary;

  return (
    <aside
      data-testid={testID}
      className={`w-[72px] xl:w-[262px] min-h-[calc(100vh-63px)] bg-sidebar select-none shrink-0 border-r border-border py-[19px] px-[11px] transition-all duration-150 ${className}`}
    >
      <nav className="flex flex-col space-y-[7px]">
        {items.map((item, idx) => {
          const itemKey = item.key || item.path || `nav-${idx}`;
          const isActive =
            currentPath === item.path ||
            (item.path !== "/" && currentPath.startsWith(item.path));
          const iconKey = item.icon || item.iconName || "";
          const iconElem = ICON_MAP[iconKey] ?? <FaThLarge size={23} />;

          return (
            <Link
              key={itemKey}
              to={item.path}
              data-testid={`sidebar-item-${itemKey}`}
              onClick={(e) => {
                if (onNavigate) {
                  e.preventDefault();
                  onNavigate(item.path);
                }
              }}
              aria-current={isActive ? "page" : undefined}
              className={`w-full xl:w-[239px] h-[50px] rounded-field flex items-center px-3.5 transition-colors duration-100 ${
                isActive
                  ? `${activeStyle.bg} ${activeStyle.text} font-bold`
                  : "text-text hover:bg-neutral-100 font-normal"
              }`}
            >
              <span
                data-testid={`sidebar-icon-${itemKey}`}
                className={`flex items-center justify-center shrink-0 ${
                  isActive ? activeStyle.text : "text-text-subtle"
                }`}
              >
                {iconElem}
              </span>
              <span
                data-testid={`sidebar-label-${itemKey}`}
                className="hidden xl:inline-block ml-4 text-17 truncate"
              >
                {item.label}
              </span>
              {item.badge !== undefined && (
                <span
                  data-testid={`sidebar-badge-${itemKey}`}
                  className="hidden xl:inline-flex ml-auto bg-badge text-white font-bold text-11 px-2 py-0.5 rounded-full"
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export default Sidebar;
