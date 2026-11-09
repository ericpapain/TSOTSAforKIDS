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
      aria-label="TSOTSA Kids Logo"
    >
      {/* Symbol */}
      {showSymbol && (
        <div
          data-testid="brand-logo-symbol"
          className="relative inline-flex items-center justify-center shrink-0"
          style={{ width: diskSize, height: diskSize }}
        >
          <div
            className="absolute rounded-full"
            style={{
              width: diskSize,
              height: diskSize,
              backgroundColor: isDark ? "#FFFFFF" : "#17302A",
            }}
          />
          <svg
            width={h}
            height={h}
            viewBox="0 0 100 100"
            className="relative z-10"
            aria-hidden="true"
          >
            <defs>
              <mask id={maskId}>
                <rect width="100" height="100" fill="white" />
                <path
                  d="M 50 15 C 38 15 28 25 28 37 C 28 47 35 55 45 58 C 30 63 20 75 20 90 L 80 90 C 80 75 70 63 55 58 C 65 55 72 47 72 37 C 72 25 62 15 50 15 Z"
                  fill="black"
                />
              </mask>
            </defs>
            <circle
              cx="50"
              cy="50"
              r="48"
              fill={isDark ? "#FFFFFF" : "#17302A"}
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
            KIDS
          </span>
        </div>
      )}
    </div>
  );
}

export default BrandLogo;
