import React, { type ReactNode } from "react";
import type { SpaceTheme } from "../types";

export type KpiColor = "care" | "primary" | "danger" | "warning" | "admin" | "user" | "caregiver";

export interface KpiCardProps {
  value: string | number;
  label?: string;
  title?: string;
  subtitle?: string;
  color?: KpiColor;
  space?: SpaceTheme;
  icon?: ReactNode;
  onClick?: () => void;
  testID?: string;
  className?: string;
}

const colorMap: Record<string, { bar: string; value: string }> = {
  care: { bar: "bg-care", value: "text-care" },
  caregiver: { bar: "bg-care", value: "text-care" },
  primary: { bar: "bg-primary", value: "text-primary" },
  user: { bar: "bg-primary", value: "text-primary" },
  admin: { bar: "bg-admin", value: "text-admin" },
  danger: { bar: "bg-danger", value: "text-danger" },
  warning: { bar: "bg-warning", value: "text-warning" },
};

export function KpiCard({
  value,
  label,
  title,
  subtitle,
  color,
  space = "primary",
  icon,
  onClick,
  testID = "kpi-card",
  className = "",
}: KpiCardProps): React.JSX.Element {
  const chosenColor = color ?? space;
  const config = colorMap[chosenColor] || colorMap.primary;
  const isClickable = !!onClick;
  const displayLabel = title ?? label ?? "";

  return (
    <div
      data-testid={testID}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (isClickable && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick();
        }
      }}
      className={`relative flex items-center bg-white border border-border rounded-card h-[114px] overflow-hidden select-none transition-opacity duration-100 ${
        isClickable ? "cursor-pointer active:opacity-85" : ""
      } ${className}`}
    >
      {/* 9px colored left vertical bar */}
      <div
        data-testid="kpi-left-bar"
        className={`w-[9px] h-full ${config.bar} shrink-0`}
      />

      {/* Content area */}
      <div className="flex-1 flex flex-col justify-center px-5 min-w-0">
        <span
          data-testid="kpi-value"
          className={`text-38 font-bold leading-none ${config.value} tracking-tight`}
        >
          {value}
        </span>
        <span
          data-testid="kpi-label"
          className="text-16 text-text-muted mt-2 truncate font-normal"
        >
          {displayLabel}
        </span>
        {subtitle && (
          <span className="text-11 text-text-subtle mt-0.5 truncate">
            {subtitle}
          </span>
        )}
      </div>

      {/* Optional icon */}
      {icon && (
        <div
          data-testid="kpi-icon"
          className="pr-6 text-text-subtle shrink-0 flex items-center justify-center opacity-60"
        >
          {icon}
        </div>
      )}
    </div>
  );
}

export default KpiCard;
