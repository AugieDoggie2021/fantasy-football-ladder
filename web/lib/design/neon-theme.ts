/**
 * Brand-aligned visual accents (replaces legacy neon helpers)
 * Uses the updated brand palette (Ladder Green, Dark Navy, Trophy Gold).
 */

import { colors, radii } from "./design-tokens";

export const neonPanelStyle: React.CSSProperties = {
  background: `linear-gradient(180deg, ${colors.brand.primary[50]}, ${colors.brand.navy[50]})`,
  borderRadius: radii.md,
  boxShadow: "0 8px 30px rgba(15, 23, 42, 0.08)",
  border: `1px solid ${colors.brand.primary[100]}`,
};

export const neonTextStyle: React.CSSProperties = {
  color: colors.brand.text,
  textRendering: "optimizeLegibility" as const,
};

export const strongGreenGlowStyle: React.CSSProperties = {
  filter: `drop-shadow(0 0 18px ${colors.brand.primary[400]}90)`,
};

export const mediumGreenGlowStyle: React.CSSProperties = {
  filter: `drop-shadow(0 0 12px ${colors.brand.primary[300]}70)`,
};

export const softGreenGlowStyle: React.CSSProperties = {
  filter: `drop-shadow(0 0 8px ${colors.brand.primary[200]}60)`,
};

export const strongRedGlowStyle: React.CSSProperties = {
  filter: `drop-shadow(0 0 18px ${colors.status.error}90)`,
};

export const softRedGlowStyle: React.CSSProperties = {
  filter: `drop-shadow(0 0 10px ${colors.status.error}60)`,
};

export function getTierGlow(tier: 1 | 2 | 3 | 4): string {
  switch (tier) {
    case 1:
      return `drop-shadow(0 0 18px ${colors.brand.primary[400]}90)`;
    case 2:
    case 3:
      return `drop-shadow(0 0 12px ${colors.brand.primary[300]}70)`;
    case 4:
      return `drop-shadow(0 0 8px ${colors.brand.primary[200]}60)`;
    default:
      return `drop-shadow(0 0 12px ${colors.brand.primary[300]}70)`;
  }
}

export function getTierBackground(tier: 1 | 2 | 3 | 4): string {
  const greens = colors.brand.primary;
  const start = greens[50];
  const end = greens[200];
  return `radial-gradient(circle, ${start}, ${end})`;
}

