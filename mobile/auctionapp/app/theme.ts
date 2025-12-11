// app/theme.ts
const theme = {
  // Brand colors - Orange palette (#FFA239)
  brand50: "#FFF5EB",
  brand100: "#FFE5CC",
  brand200: "#FFD6AD",
  brand300: "#FFC68F",
  brand400: "#FFB464",
  brand500: "#FFA239",
  brand600: "#FFA239",
  brand700: "#E68A1F",
  brand800: "#CC7100",
  brand900: "#995500",

  // Secondary colors - Blue palette (#8CE4FF)
  secondary50: "#E6F9FF",
  secondary100: "#CCF3FF",
  secondary200: "#B3EDFF",
  secondary300: "#9AE7FF",
  secondary400: "#8CE4FF",
  secondary500: "#8CE4FF",
  secondary600: "#66D4F7",
  secondary700: "#40C4EE",
  secondary800: "#1AB4E6",
  secondary900: "#00A4DD",

  // Warning colors - Yellow palette (#FEEE91)
  warning50: "#FFFEF5",
  warning100: "#FFFDE0",
  warning200: "#FFFBCC",
  warning300: "#FFF9B8",
  warning400: "#FFF3A4",
  warning500: "#FEEE91",
  warning600: "#FEEE91",
  warning700: "#F5E370",
  warning800: "#ECD74F",
  warning900: "#E3CB2E",

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
  brand: "#FFA239",
  background: "#FFFFFF",
  text: "#0F172A",
  accent: "#8CE4FF",
  warning: "#FEEE91",
  danger: "#FF5656",
  surface: "#F8FAFC",
  border: "#E2E8F0",
};

const carTheme = {
  brand: "#8CE4FF",
  background: "#FFFFFF",
  text: "#0F172A",
  accent: "#FFA239",
  warning: "#FEEE91",
  danger: "#FF5656",
  surface: "#F8FAFC",
  border: "#E2E8F0",
};

export const themes = {
  marketplace: marketplaceTheme,
  car: carTheme,
};

export type ThemeType = typeof marketplaceTheme;

