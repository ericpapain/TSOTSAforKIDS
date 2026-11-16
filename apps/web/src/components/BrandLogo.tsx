/* eslint-disable i18next/no-literal-string */
import React, { useId } from "react";

export interface BrandLogoProps {
  /** Height h of the symbol in px (default: 34) or named size */
  size?: number | "sm" | "md" | "lg";
  /** Variant: "light" (for light backgrounds) or "dark" (for dark backgrounds) */
  variant?: "light" | "dark";
  /** Display mode: full (default), symbol only, or word only */
  mode?: "full" | "symbol" | "word";
  display?: "full" | "symbol" | "wordmark" | "word";
  testID?: string;
  className?: string;
}

const sizeMap: Record<string, number> = {
  sm: 24,
  md: 34,
  lg: 48,
};

export function BrandLogo({
  size = 34,
  variant = "light",
  mode,
  display,
  testID = "brand-logo",
  className = "",
}: BrandLogoProps): React.JSX.Element {
  const numericSize = typeof size === "number" ? size : sizeMap[size] || 34;
  const h = numericSize;
  const isDark = variant === "dark";
  const uniqueId = useId().replace(/:/g, "_");
  const maskId = `tsotsa_web_mask_${uniqueId}`;

  const textColor = isDark ? "#FFFFFF" : "#17302A";
  const pillBg = isDark ? "#FFFFFF" : "#F26142";
  const pillTextColor = isDark ? "#F26142" : "#FFFFFF";

  // Proportions
  const symbolGap = Math.round(0.45 * h);
  const wordFontSize = Math.round(0.6 * h);
  const pillGap = Math.round(0.22 * h);
  const pillHeight = Math.round(0.72 * h);
  const pillFontSize = Math.round(0.42 * h);
  const diskSize = Math.round(1.24 * h);

  const activeMode = display ? (display === "wordmark" ? "word" : display) : (mode || "full");
  const showSymbol = activeMode === "full" || activeMode === "symbol";
  const showWord = activeMode === "full" || activeMode === "word";

  return (
    <div
      data-testid={testID}
      className={`inline-flex items-center select-none ${className}`}
      role="img"
      aria-label="TSOTSA4Kids Logo"
    >
      {/* Symbol */}
      {showSymbol && (
        <div
          data-testid="brand-logo-symbol"
          className="relative inline-flex items-center justify-center shrink-0"
          style={{ width: isDark ? diskSize : h, height: isDark ? diskSize : h }}
        >
          {isDark && (
            <div
              data-testid="brand-logo-dark-disk"
              className="absolute rounded-full"
              style={{
                width: diskSize,
                height: diskSize,
                backgroundColor: "#FFFFFF",
              }}
            />
          )}
          <svg
            width={h}
            height={h}
            viewBox="8 8 84 84"
            className="relative z-10"
            aria-hidden="true"
          >
            <defs>
              <mask id={maskId}>
                <rect width="100" height="100" fill="#fff" />
                <rect x="46.9" y="0" width="6.2" height="100" fill="#000" />
                <circle cx="50" cy="50" r="11.6" fill="#000" />
                <rect x="50" y="46.4" width="50" height="7.2" fill="#000" />
              </mask>
            </defs>
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="#F26142"
              mask={`url(#${maskId})`}
            />
          </svg>
        </div>
      )}

      {/* TSOTSA + KIDS */}
      {showWord && (
        <div
          className="inline-flex items-center font-bold"
          style={{ marginLeft: showSymbol ? symbolGap : 0 }}
        >
          <span
            style={{
              fontSize: wordFontSize,
              color: textColor,
              letterSpacing: "0.02em",
              lineHeight: 1,
            }}
          >
            TSOTSA
          </span>
          <span
            className="inline-flex items-center justify-center font-bold uppercase rounded-pill"
            style={{
              marginLeft: pillGap,
              height: pillHeight,
              paddingLeft: Math.round(0.28 * h),
              paddingRight: Math.round(0.28 * h),
              backgroundColor: pillBg,
              color: pillTextColor,
              fontSize: pillFontSize,
              lineHeight: 1,
            }}
          >
            4KIDS
          </span>
        </div>
      )}
    </div>
  );
}

export default BrandLogo;
