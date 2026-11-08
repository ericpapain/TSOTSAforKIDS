import React, { type ButtonHTMLAttributes, type ReactNode } from "react";
import type { SpaceTheme } from "../types";

export type ButtonVariant =
  | "solid"
  | "outline"
  | "ghost"
  | "primary"
  | "care"
  | "caregiver"
  | "admin"
  | "danger"
  | "user";
export type ButtonColor = "primary" | "care" | "admin" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "color"> {
  variant?: ButtonVariant;
  color?: ButtonColor;
  outline?: boolean;
  size?: ButtonSize;
  space?: SpaceTheme;
  children: ReactNode;
  testID?: string;
}

const colorClasses: Record<ButtonColor, { solid: string; outline: string; ghost: string }> = {
  primary: {
    solid: "bg-primary text-white border-primary hover:bg-opacity-95 active:opacity-85",
    outline: "bg-transparent text-primary border-primary hover:bg-primary-50 active:opacity-85",
    ghost: "bg-transparent text-primary border-transparent hover:bg-primary-50 active:opacity-85",
  },
  care: {
    solid: "bg-care text-white border-care hover:bg-opacity-95 active:opacity-85",
    outline: "bg-transparent text-care border-care hover:bg-care-50 active:opacity-85",
    ghost: "bg-transparent text-care border-transparent hover:bg-care-50 active:opacity-85",
  },
  admin: {
    solid: "bg-admin text-white border-admin hover:bg-opacity-95 active:opacity-85",
    outline: "bg-transparent text-admin border-admin hover:bg-admin-50 active:opacity-85",
    ghost: "bg-transparent text-admin border-transparent hover:bg-admin-50 active:opacity-85",
  },
  danger: {
    solid: "bg-danger text-white border-danger hover:bg-opacity-95 active:opacity-85",
    outline: "bg-transparent text-danger border-danger hover:bg-danger-50 active:opacity-85",
    ghost: "bg-transparent text-danger border-transparent hover:bg-danger-50 active:opacity-85",
  },
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "text-13 px-3 py-1.5",
  md: "text-16 px-4 py-2.5",
  lg: "text-19 px-6 py-3",
};

export function Button({
  variant = "solid",
  color,
  outline,
  size = "md",
  space,
  children,
  testID = "btn-action",
  className = "",
  disabled,
  ...props
}: ButtonProps): React.JSX.Element {
  let resolvedColor: ButtonColor = "primary";
  let mode: "solid" | "outline" | "ghost" = "solid";

  if (space === "care" || space === "caregiver") {
    resolvedColor = "care";
  } else if (space === "admin") {
    resolvedColor = "admin";
  }

  if (variant === "outline" || outline) {
    mode = "outline";
    if (color) resolvedColor = color;
  } else if (variant === "ghost") {
    mode = "ghost";
    if (color) resolvedColor = color;
  } else if (variant === "care" || variant === "caregiver") {
    resolvedColor = "care";
  } else if (variant === "admin") {
    resolvedColor = "admin";
  } else if (variant === "danger") {
    resolvedColor = "danger";
  } else if (variant === "primary" || variant === "user") {
    if (!space) resolvedColor = "primary";
  } else if (color) {
    resolvedColor = color;
  }

  const baseClasses =
    "inline-flex items-center justify-center font-bold rounded-button border transition-opacity duration-100 shadow-none cursor-pointer select-none";

  const disabledClasses = disabled
    ? "opacity-50 cursor-not-allowed pointer-events-none"
    : "";

  const themeClasses = colorClasses[resolvedColor][mode];
  const sizeClass = sizeClasses[size];

  return (
    <button
      type="button"
      data-testid={testID}
      disabled={disabled}
      className={`${baseClasses} ${themeClasses} ${sizeClass} ${disabledClasses} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
