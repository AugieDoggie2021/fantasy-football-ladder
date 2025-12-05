/**
 * Neon Theme Utilities
 * 
 * Helper functions and style objects for applying the neon design system
 */

import { colors, radii, glow } from "./design-tokens";

/**
 * Style object for a neon panel/card
 * Uses turf gradient background with soft green glow
 */
export const neonPanelStyle: React.CSSProperties = {
  background: `radial-gradient(circle at top, ${colors.turfMid}, ${colors.turfDark})`,
  borderRadius: radii.card,
  boxShadow: glow.softGreen,
  border: `1px solid rgba(0, 255, 102, 0.2)`,
};

/**
 * Style object for neon text
 */
export const neonTextStyle: React.CSSProperties = {
  color: colors.textOffWhite,
  textRendering: "optimizeLegibility" as const,
};

/**
 * Style object for strong neon green glow (Tier 1, promotion)
 */
export const strongGreenGlowStyle: React.CSSProperties = {
  filter: `drop-shadow(${glow.strongGreen})`,
};

/**
 * Style object for medium neon green glow (Tier 2-3, positions)
 */
export const mediumGreenGlowStyle: React.CSSProperties = {
  filter: `drop-shadow(${glow.softGreen})`,
};

/**
 * Style object for soft neon green glow (Tier 4, subtle accents)
 */
export const softGreenGlowStyle: React.CSSProperties = {
  filter: `drop-shadow(0 0 8px ${colors.kellyGreenSoft}40)`, // 40 = 25% opacity
};

/**
 * Style object for strong neon red glow (relegation)
 */
export const strongRedGlowStyle: React.CSSProperties = {
  filter: `drop-shadow(${glow.strongRed})`,
};

/**
 * Style object for soft neon red glow
 */
export const softRedGlowStyle: React.CSSProperties = {
  filter: `drop-shadow(${glow.softRed})`,
};

/**
 * Get glow strength based on tier
 * @param tier - Tier number (1-4)
 * @returns CSS filter string for appropriate glow strength
 */
export function getTierGlow(tier: 1 | 2 | 3 | 4): string {
  switch (tier) {
    case 1:
      return `drop-shadow(${glow.strongGreen})`;
    case 2:
    case 3:
      return `drop-shadow(${glow.softGreen})`;
    case 4:
      return `drop-shadow(0 0 8px ${colors.kellyGreenSoft}40)`;
    default:
      return `drop-shadow(${glow.softGreen})`;
  }
}

/**
 * Get background gradient for tier badge
 * @param tier - Tier number (1-4)
 * @returns CSS background string
 */
export function getTierBackground(tier: 1 | 2 | 3 | 4): string {
  const baseGradient = `radial-gradient(circle, ${colors.kellyGreenNeon}20, ${colors.turfDark})`;
  return baseGradient;
}

