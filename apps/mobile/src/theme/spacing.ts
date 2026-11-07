/**
 * TSOTSA Kids Mobile Design System - Layout and Spacing
 * Screen 390 px reference, fixed 17 px lateral margins, exact border radii and bar dimensions.
 */

export const layout = {
  screenReferenceWidth: 390,
  screenLateralMargin: 17,
  borderWidth: 1,
  appBarHeight: 67,
  bottomNavHeight: 57,
} as const;

export const radii = {
  button: 11,
  card: 9,
  listItem: 9,
  field: 7,
  notice: 7,
  chip: 9999, // Pill shape
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 14,
  base: 16,
  lateral: 17,
  lg: 20,
  xl: 24,
  xxl: 32,
} as const;

