/**
 * Scoring Configuration Types and Defaults
 * 
 * Defines the structure for custom scoring rules per league.
 */

/**
 * Yardage bonus configuration
 */
export interface YardageBonusConfig {
  enabled: boolean
  threshold: number // e.g., 100 for 100+ yards
  bonusPoints: number // e.g., 3 bonus points
}

/**
 * Scoring configuration for a league
 */
export interface ScoringConfig {
  // Passing
  passingYardsPerPoint: number // Default: 25 (1 pt per 25 yards)
  passingTdPoints: number // Default: 4
  interceptionPoints: number // Default: -2 (negative)

  // Rushing
  rushingYardsPerPoint: number // Default: 10 (1 pt per 10 yards)
  rushingTdPoints: number // Default: 6

  // Receiving
  receivingYardsPerPoint: number // Default: 10 (1 pt per 10 yards)
  receivingTdPoints: number // Default: 6
  receptionPoints: number // Default: 1 (PPR)

  // Bonuses (optional)
  rushingYardageBonus?: YardageBonusConfig
  receivingYardageBonus?: YardageBonusConfig
  passingYardageBonus?: YardageBonusConfig

  // Special
  // Note: kicking_points and defense_points are aggregated values from external API
  // They are used as-is, no per-yard/per-point calculation
}

/**
 * Default scoring configuration (Yahoo-style standard)
 */
export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  passingYardsPerPoint: 25,
  passingTdPoints: 4,
  interceptionPoints: -2,
  rushingYardsPerPoint: 10,
  rushingTdPoints: 6,
  receivingYardsPerPoint: 10,
  receivingTdPoints: 6,
  receptionPoints: 1, // PPR
  // Bonuses disabled by default
  rushingYardageBonus: { enabled: false, threshold: 100, bonusPoints: 3 },
  receivingYardageBonus: { enabled: false, threshold: 100, bonusPoints: 3 },
  passingYardageBonus: { enabled: false, threshold: 300, bonusPoints: 3 },
}

/**
 * Parse scoring config from JSONB database field
 * Returns default config if invalid or missing
 */
export function parseScoringConfig(configJson: any): ScoringConfig {
  if (!configJson || typeof configJson !== 'object') {
    return DEFAULT_SCORING_CONFIG
  }

  const config: ScoringConfig = {
    passingYardsPerPoint: configJson.passingYardsPerPoint ?? DEFAULT_SCORING_CONFIG.passingYardsPerPoint,
    passingTdPoints: configJson.passingTdPoints ?? DEFAULT_SCORING_CONFIG.passingTdPoints,
    interceptionPoints: configJson.interceptionPoints ?? DEFAULT_SCORING_CONFIG.interceptionPoints,
    rushingYardsPerPoint: configJson.rushingYardsPerPoint ?? DEFAULT_SCORING_CONFIG.rushingYardsPerPoint,
    rushingTdPoints: configJson.rushingTdPoints ?? DEFAULT_SCORING_CONFIG.rushingTdPoints,
    receivingYardsPerPoint: configJson.receivingYardsPerPoint ?? DEFAULT_SCORING_CONFIG.receivingYardsPerPoint,
    receivingTdPoints: configJson.receivingTdPoints ?? DEFAULT_SCORING_CONFIG.receivingTdPoints,
    receptionPoints: configJson.receptionPoints ?? DEFAULT_SCORING_CONFIG.receptionPoints,
  }

  // Parse bonus configs if present
  if (configJson.rushingYardageBonus) {
    config.rushingYardageBonus = {
      enabled: configJson.rushingYardageBonus.enabled ?? false,
      threshold: configJson.rushingYardageBonus.threshold ?? 100,
      bonusPoints: configJson.rushingYardageBonus.bonusPoints ?? 3,
    }
  } else {
    config.rushingYardageBonus = DEFAULT_SCORING_CONFIG.rushingYardageBonus
  }

  if (configJson.receivingYardageBonus) {
    config.receivingYardageBonus = {
      enabled: configJson.receivingYardageBonus.enabled ?? false,
      threshold: configJson.receivingYardageBonus.threshold ?? 100,
      bonusPoints: configJson.receivingYardageBonus.bonusPoints ?? 3,
    }
  } else {
    config.receivingYardageBonus = DEFAULT_SCORING_CONFIG.receivingYardageBonus
  }

  if (configJson.passingYardageBonus) {
    config.passingYardageBonus = {
      enabled: configJson.passingYardageBonus.enabled ?? false,
      threshold: configJson.passingYardageBonus.threshold ?? 300,
      bonusPoints: configJson.passingYardageBonus.bonusPoints ?? 3,
    }
  } else {
    config.passingYardageBonus = DEFAULT_SCORING_CONFIG.passingYardageBonus
  }

  return config
}

/**
 * Validate scoring config values
 * Returns array of error messages, empty if valid
 */
export function validateScoringConfig(config: ScoringConfig): string[] {
  const errors: string[] = []

  // Validate passing
  if (config.passingYardsPerPoint <= 0) {
    errors.push('Passing yards per point must be greater than 0')
  }
  if (config.passingTdPoints < 0) {
    errors.push('Passing TD points cannot be negative')
  }

  // Validate rushing
  if (config.rushingYardsPerPoint <= 0) {
    errors.push('Rushing yards per point must be greater than 0')
  }
  if (config.rushingTdPoints < 0) {
    errors.push('Rushing TD points cannot be negative')
  }

  // Validate receiving
  if (config.receivingYardsPerPoint <= 0) {
    errors.push('Receiving yards per point must be greater than 0')
  }
  if (config.receivingTdPoints < 0) {
    errors.push('Receiving TD points cannot be negative')
  }
  if (config.receptionPoints < 0) {
    errors.push('Reception points cannot be negative')
  }

  // Validate bonuses
  if (config.rushingYardageBonus?.enabled) {
    if (config.rushingYardageBonus.threshold <= 0) {
      errors.push('Rushing yardage bonus threshold must be greater than 0')
    }
    if (config.rushingYardageBonus.bonusPoints < 0) {
      errors.push('Rushing yardage bonus points cannot be negative')
    }
  }

  if (config.receivingYardageBonus?.enabled) {
    if (config.receivingYardageBonus.threshold <= 0) {
      errors.push('Receiving yardage bonus threshold must be greater than 0')
    }
    if (config.receivingYardageBonus.bonusPoints < 0) {
      errors.push('Receiving yardage bonus points cannot be negative')
    }
  }

  if (config.passingYardageBonus?.enabled) {
    if (config.passingYardageBonus.threshold <= 0) {
      errors.push('Passing yardage bonus threshold must be greater than 0')
    }
    if (config.passingYardageBonus.bonusPoints < 0) {
      errors.push('Passing yardage bonus points cannot be negative')
    }
  }

  return errors
}

/**
 * Scoring preset configurations
 */
export const SCORING_PRESETS = {
  standard: {
    name: 'Standard (Non-PPR)',
    config: {
      ...DEFAULT_SCORING_CONFIG,
      receptionPoints: 0,
    },
  },
  halfPPR: {
    name: 'Half PPR',
    config: {
      ...DEFAULT_SCORING_CONFIG,
      receptionPoints: 0.5,
    },
  },
  fullPPR: {
    name: 'Full PPR',
    config: DEFAULT_SCORING_CONFIG,
  },
} as const

