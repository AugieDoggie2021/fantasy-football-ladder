// Shared design tokens for Fantasy Football Ladder (web + mobile friendly)
export const colors = {
  brand: {
    surface: "#F8FAFC",
    surfaceAlt: "#FFFFFF",
    nav: "#0F172A",
    text: "#0F172A",
    primary: {
      50: "#ECFDF5",
      100: "#D1FAE5",
      200: "#A7F3D0",
      300: "#6EE7B7",
      400: "#34D399",
      500: "#10B981",
      600: "#059669",
    },
    navy: {
      50: "#F8FAFC",
      100: "#F1F5F9",
      200: "#E2E8F0",
      300: "#CBD5E1",
      400: "#94A3B8",
      500: "#64748B",
      600: "#475569",
      700: "#334155",
      800: "#1E293B",
      900: "#0F172A",
    },
    accent: {
      gold: {
        50: "#FEFCE8",
        100: "#FEF9C3",
        200: "#FEF08A",
        300: "#FDE047",
        400: "#FACC15",
        500: "#EAB308",
        600: "#CA8A04",
      },
    },
  },
  status: {
    success: "#10B981",
    warning: "#F59E0B",
    info: "#3B82F6",
    error: "#EF4444",
  },
};

export const radii = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  pill: 9999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const shadows = {
  sm: "0 1px 2px rgba(15, 23, 42, 0.08)",
  md: "0 4px 10px rgba(15, 23, 42, 0.12)",
  lg: "0 12px 30px rgba(15, 23, 42, 0.18)",
  xl: "0 18px 44px rgba(15, 23, 42, 0.22)",
};

export const typography = {
  family: {
    heading: "Inter, system-ui, sans-serif",
    body: "Inter, system-ui, sans-serif",
  },
  weight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  scale: {
    displayLg: { size: "48px", lineHeight: "56px", weight: 700 },
    displayMd: { size: "40px", lineHeight: "48px", weight: 700 },
    h1: { size: "32px", lineHeight: "40px", weight: 700 },
    h2: { size: "24px", lineHeight: "32px", weight: 700 },
    h3: { size: "20px", lineHeight: "28px", weight: 600 },
    bodyLg: { size: "18px", lineHeight: "28px", weight: 500 },
    body: { size: "16px", lineHeight: "24px", weight: 500 },
    bodySm: { size: "14px", lineHeight: "20px", weight: 500 },
    caption: { size: "12px", lineHeight: "16px", weight: 600 },
  },
};

export type DesignTokens = {
  colors: typeof colors;
  radii: typeof radii;
  spacing: typeof spacing;
  shadows: typeof shadows;
  typography: typeof typography;
};
