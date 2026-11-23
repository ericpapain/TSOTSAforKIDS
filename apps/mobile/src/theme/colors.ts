/**
 * TSOTSA Kids Mobile Design System - Color Palette
 * Exactly matches specification from prompt M00 and TSOTSA_Kids_Prompts_Interfaces.md.
 */

export const colors = {
  // Primary (Utilisateur - Vert)
  primary: "#0F7B5F",
  "primary-50": "#E7F4EE",
  "primary-100": "#CFE9DE",
  "primary-200": "#BFE3D3",
  primary50: "#E7F4EE",
  primary100: "#CFE9DE",
  primary200: "#BFE3D3",

  // Accent (Mises en évidence - Orange)
  accent: "#F08A24",
  "accent-50": "#FFF1E2",
  "accent-700": "#B4610C",
  accent50: "#FFF1E2",
  accent700: "#B4610C",

  // Typography & Content
  text: "#17302A",
  "text-muted": "#5B6B66",
  "text-subtle": "#8A9893",
  textMuted: "#5B6B66",
  textSubtle: "#8A9893",

  // Structure & Backgrounds
  border: "#D5DEDA",
  canvas: "#EEF2F0",
  "surface-2": "#F7F9F8",
  "surface-3": "#F4F7F6",
  surface2: "#F7F9F8",
  surface3: "#F4F7F6",
  "neutral-100": "#F1F3F2",
  "neutral-200": "#DDE2E0",
  neutral100: "#F1F3F2",
  neutral200: "#DDE2E0",
  "toggle-off": "#C9D1CE",
  toggleOff: "#C9D1CE",

  // Semantic: Danger
  danger: "#C93C3C",
  "danger-50": "#FDECEC",
  "danger-200": "#F1B5B5",
  danger50: "#FDECEC",
  danger200: "#F1B5B5",

  // Semantic: Warning
  warning: "#B7791F",
  "warning-50": "#FFF4D6",
  "warning-900": "#7A5300",
  warning50: "#FFF4D6",
  warning900: "#7A5300",

  // Domain Roles: Caregiver (Bleu soignant)
  care: "#1F5FA8",
  "care-50": "#E8F0FA",
  care50: "#E8F0FA",

  // Domain Roles: Admin (Ardoise)
  admin: "#334155",
  "admin-50": "#EEF1F5",
  admin50: "#EEF1F5",

  // Brand: Reserved for TSOTSA Logo (Bleu Nuit #092D73 & Orange #F38B1F)
  brand: "#F38B1F",
  bleuNuit: "#092D73",

  // Specific contexts
  lockscreen: "#1E3A33",
  "lockscreen-2": "#3A544D",
  lockscreen2: "#3A544D",
  overlay: "#5B6662",
  white: "#FFFFFF",
} as const;

export type ColorName = keyof typeof colors;

