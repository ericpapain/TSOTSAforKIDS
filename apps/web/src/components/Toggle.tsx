import React from "react";
import type { SpaceTheme } from "../types";

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  color?: "primary" | "care" | "admin";
  space?: SpaceTheme;
  spaceTheme?: SpaceTheme;
  disabled?: boolean;
  testID?: string;
  ariaLabel?: string;
}

const colorBgs: Record<string, string> = {
  primary: "bg-primary",
  user: "bg-primary",
  care: "bg-care",
  caregiver: "bg-care",
  admin: "bg-admin",
};

export function Toggle({
  checked,
  onChange,
  color,
  space,
  spaceTheme,
  disabled = false,
  testID = "toggle-switch",
  ariaLabel = "Interrupteur",
}: ToggleProps): React.JSX.Element {
  const resolved = color || space || spaceTheme || "primary";
  const activeBg = colorBgs[resolved] || colorBgs.primary;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      data-testid={testID}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex items-center w-[60px] h-[32px] rounded-full p-1 transition-colors duration-150 cursor-pointer ${
        checked ? activeBg : "bg-toggle-off"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <span
        data-testid="toggle-thumb"
        className={`inline-block w-[24px] h-[24px] bg-white rounded-full shadow-none transition-transform duration-150 ${
          checked ? "translate-x-[28px]" : "translate-x-[2px]"
        }`}
      />
    </button>
  );
}

export default Toggle;
