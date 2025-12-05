/**
 * Design Tokens for Fantasy Football Ladder
 * 
 * Premium "Apple Sports" style visual language:
 * - Neon Kelly green on deep turf-dark backgrounds
 * - Soft gradients and glow, not harsh shadows
 * - Simple geometry (stadium ovals, rounded rects, clean arrows)
 * - Athletic, modern typography
 * - Clean, UI-first iconography
 */

export const colors = {
  kellyGreenBase: "#00FF66",      // primary electric Kelly green
  kellyGreenNeon: "#6BFFB3",      // lighter edge/highlight green
  kellyGreenSoft: "#00CC55",      // midtone for gradients
  turfDark: "#020812",            // almost-black turf background
  turfMid: "#04191A",             // slightly lighter turf
  whitePure: "#FFFFFF",
  textOffWhite: "#E6F7EE",        // soft off-white for typography
  relegationRed: "#FF1744",       // primary neon red for relegation
  relegationRedNeon: "#FF4F7B",   // lighter red edge/highlight
  neutralGrey: "#4C5A60",         // subtle UI borders, dividers
} as const;

export const radii = {
  card: 16,
  badge: 20,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const;

export const glow = {
  softGreen: `0 0 12px ${colors.kellyGreenSoft}`,
  strongGreen: `0 0 20px ${colors.kellyGreenBase}`,
  softRed: `0 0 12px ${colors.relegationRed}`,
  strongRed: `0 0 20px ${colors.relegationRedNeon}`,
} as const;

