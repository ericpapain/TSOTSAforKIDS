/**
 * TSOTSA Kids Mobile Design System - Typography
 * Police Carlito (400 Regular et 700 Bold), tailles exactes en px, interligne 1.2.
 */

export const fontFamilies = {
  regular: "Carlito_400Regular",
  bold: "Carlito_700Bold",
} as const;

export const fontSizes = {
  xs11: 11,
  sm13: 13,
  sm14: 14,
  base16: 16,
  md18: 18,
  md19: 19,
  lg21: 21,
  lg22: 22,
  xl24: 24,
  xl25: 25,
  h3_29: 29,
  h2_32: 32,
  h1_35: 35,
  hero38: 38,
  display76: 76,
} as const;

export const LINE_HEIGHT_MULTIPLIER = 1.2;

export function getLineHeight(fontSize: number): number {
  return Math.round(fontSize * LINE_HEIGHT_MULTIPLIER);
}

export const typography = {
  // Styles typographiques prêts à l'emploi
  caption11: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.xs11,
    lineHeight: getLineHeight(fontSizes.xs11),
  },
  caption13: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.sm13,
    lineHeight: getLineHeight(fontSizes.sm13),
  },
  body14: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.sm14,
    lineHeight: getLineHeight(fontSizes.sm14),
  },
  body14Bold: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.sm14,
    lineHeight: getLineHeight(fontSizes.sm14),
  },
  body16: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.base16,
    lineHeight: getLineHeight(fontSizes.base16),
  },
  body18: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.md18,
    lineHeight: getLineHeight(fontSizes.md18),
  },
  body18Bold: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.md18,
    lineHeight: getLineHeight(fontSizes.md18),
  },
  title22Bold: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.lg22,
    lineHeight: getLineHeight(fontSizes.lg22),
  },
} as const;

