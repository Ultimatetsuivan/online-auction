// app/theme.ts
const theme = {
  // Brand colors - Indigo palette (#4F46E5)
  brand50: "#EEF2FF",
  brand100: "#E0E7FF",
  brand200: "#C7D2FE",
  brand300: "#A5B4FC",
  brand400: "#818CF8",
  brand500: "#6366F1",
  brand600: "#4F46E5",
  brand700: "#4338CA",
  brand800: "#3730A3",
  brand900: "#312E81",

  // Accent colors - Amber palette (#F59E0B) — used for prices & timers only
  secondary50: "#FFFBEB",
  secondary100: "#FEF3C7",
  secondary200: "#FDE68A",
  secondary300: "#FCD34D",
  secondary400: "#FBBF24",
  secondary500: "#F59E0B",
  secondary600: "#D97706",
  secondary700: "#B45309",
  secondary800: "#92400E",
  secondary900: "#78350F",

  // Warning colors - Amber (reuse accent scale)
  warning50: "#FFFBEB",
  warning100: "#FEF3C7",
  warning200: "#FDE68A",
  warning300: "#FCD34D",
  warning400: "#FBBF24",
  warning500: "#F59E0B",
  warning600: "#D97706",
  warning700: "#B45309",
  warning800: "#92400E",
  warning900: "#78350F",

  // Danger colors - Red palette (#FF5656)
  danger50: "#FFEBEB",
  danger100: "#FFD6D6",
  danger200: "#FFC2C2",
  danger300: "#FFADAD",
  danger400: "#FF8181",
  danger500: "#FF5656",
  danger600: "#FF5656",
  danger700: "#F73838",
  danger800: "#EE1A1A",
  danger900: "#CC0000",

  // Success colors - Green palette (#10B981)
  success50: "#ECFDF5",
  success100: "#D1FAE5",
  success200: "#A7F3D0",
  success300: "#6EE7B7",
  success400: "#34D399",
  success500: "#10B981",
  success600: "#059669",
  success700: "#047857",
  success800: "#065F46",
  success900: "#064E3B",

  // Info colors - Blue palette (#3B82F6)
  info50: "#EFF6FF",
  info100: "#DBEAFE",
  info200: "#BFDBFE",
  info300: "#93C5FD",
  info400: "#60A5FA",
  info500: "#3B82F6",
  info600: "#2563EB",
  info700: "#1D4ED8",
  info800: "#1E40AF",
  info900: "#1E3A8A",

  // Gray colors - Light theme
  gray50: "#F8FAFC",
  gray100: "#F1F5F9",
  gray200: "#E2E8F0",
  gray300: "#CBD5E1",
  gray400: "#94A3B8",
  gray500: "#64748B",
  gray600: "#475569",
  gray700: "#334155",
  gray800: "#1E293B",
  gray900: "#0F172A",

  // Semantic colors
  white: "#FFFFFF",
  black: "#000000",
};


export default theme;

const marketplaceTheme = {
  brand: "#4F46E5",
  background: "#F9FAFB",
  text: "#111827",
  accent: "#F59E0B",
  warning: "#F59E0B",
  danger: "#EF4444",
  surface: "#FFFFFF",
  border: "#E5E7EB",
};

const carTheme = {
  brand: "#4F46E5",
  background: "#F9FAFB",
  text: "#111827",
  accent: "#F59E0B",
  warning: "#F59E0B",
  danger: "#EF4444",
  surface: "#FFFFFF",
  border: "#E5E7EB",
};

export const themes = {
  marketplace: marketplaceTheme,
  car: carTheme,
};

export type ThemeType = typeof marketplaceTheme;

