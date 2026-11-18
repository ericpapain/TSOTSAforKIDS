/* eslint-disable i18next/no-literal-string */
import React from "react";

export interface BrandLogoProps {
  /** Height h of the symbol in px (default: 34) or named size */
  size?: number | "sm" | "md" | "lg";
  /** Variant: "light" (for light backgrounds) or "dark" (for dark backgrounds) */
  variant?: "light" | "dark";
  /** Display mode: full (default), symbol only, word only, or full image */
  mode?: "full" | "symbol" | "word" | "image";
  display?: "full" | "symbol" | "wordmark" | "word" | "image";
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

  const textColor = isDark ? "#FFFFFF" : "#17302A";

  // Proportions
  const symbolGap = Math.round(0.45 * h);
  const wordFontSize = Math.round(0.6 * h);
  const diskSize = Math.round(1.24 * h);

  const activeMode = display ? (display === "wordmark" ? "word" : display) : (mode || "full");
  const isImageMode = activeMode === "image";
  const showSymbol = activeMode === "full" || activeMode === "symbol";
  const showWord = activeMode === "full" || activeMode === "word";

  if (isImageMode) {
    return (
      <div data-testid={testID} className={`inline-flex items-center select-none ${className}`}>
        <img
          src="/logo.png"
          alt="TSOTSA for KIDS - Bien nourrir, bien suivre"
          style={{ height: h, width: "auto" }}
          className="object-contain"
        />
      </div>
    );
  }

  return (
    <div
      data-testid={testID}
      className={`inline-flex items-center select-none ${className}`}
      role="img"
      aria-label="TSOTSA for Kids Logo"
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
            viewBox="0 0 100 100"
            className="relative z-10"
            aria-hidden="true"
          >
            <image
              href="/logo_symbol.png"
              width="100"
              height="100"
              preserveAspectRatio="xMidYMid meet"
            />
          </svg>
        </div>
      )}

      {/* TSOTSA for Kids */}
      {showWord && (
        <div
          data-testid="brand-logo-wordmark"
          className="inline-flex items-baseline font-bold"
          style={{ marginLeft: showSymbol ? symbolGap : 0 }}
        >
          <span
            data-testid="brand-logo-text"
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
            data-testid="brand-logo-for"
            style={{
              fontSize: Math.round(wordFontSize * 0.88),
              color: isDark ? "#FFFFFF" : "#F26142",
              marginLeft: Math.round(0.24 * wordFontSize),
              marginRight: Math.round(0.24 * wordFontSize),
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            for
          </span>
          <span
            data-testid="brand-logo-kids"
            style={{
              fontSize: wordFontSize,
              color: textColor,
              letterSpacing: "0.02em",
              lineHeight: 1,
            }}
          >
            Kids
          </span>
        </div>
      )}
    </div>
  );
}

export default BrandLogo;
