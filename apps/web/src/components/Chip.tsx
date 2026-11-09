import React, { type HTMLAttributes, type ReactNode } from "react";

export type ChipVariant = "primary" | "care" | "admin" | "warning" | "danger";

export interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  children?: ReactNode;
  label?: string;
  variant?: ChipVariant;
  backgroundColor?: string;
  textColor?: string;
  testID?: string;
}

const variantStyles: Record<ChipVariant, { bg: string; text: string }> = {
  primary: { bg: "#E7F4EE", text: "#0F7B5F" },
  care: { bg: "#E8F0FA", text: "#1F5FA8" },
  admin: { bg: "#EEF1F5", text: "#334155" },
  warning: { bg: "#FFF4D6", text: "#7A5300" },
  danger: { bg: "#FDECEC", text: "#C93C3C" },
};

export function Chip({
  children,
  label,
  variant,
  backgroundColor,
  textColor,
  testID = "chip-pill",
  className = "",
  style,
  ...props
}: ChipProps): React.JSX.Element {
  let resolvedBg = backgroundColor ?? "#E7F4EE";
  let resolvedText = textColor ?? "#0F7B5F";

  if (variant && variantStyles[variant]) {
    resolvedBg = variantStyles[variant].bg;
    resolvedText = variantStyles[variant].text;
  }

  return (
    <span
      data-testid={testID}
      className={`inline-flex items-center justify-center font-bold text-13 px-3 py-1 rounded-pill ${className}`}
      style={{
        backgroundColor: resolvedBg,
        color: resolvedText,
        ...style,
      }}
      {...props}
    >
      {label ?? children}
    </span>
  );
}

export default Chip;
