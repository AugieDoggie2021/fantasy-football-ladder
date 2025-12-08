/**
 * Draft validation utilities
 * Provides comprehensive validation for draft actions
 */

export interface ValidationResult {
  valid: boolean
  error?: string
}

/**
 * Validate UUID format
 */
export function validateUUID(id: string | null | undefined, fieldName: string): ValidationResult {
  if (!id) {
    return { valid: false, error: `${fieldName} is required` }
  }
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    return { valid: false, error: `${fieldName} must be a valid UUID` }
  }
  
  return { valid: true }
}

/**
 * Validate draft pick ID, player ID, and league ID
 */
export function validateDraftPickInputs(
  draftPickId: string | null | undefined,
  playerId: string | null | undefined,
  leagueId: string | null | undefined
): ValidationResult {
  const pickIdValidation = validateUUID(draftPickId, 'Draft pick ID')
  if (!pickIdValidation.valid) return pickIdValidation

  const playerIdValidation = validateUUID(playerId, 'Player ID')
  if (!playerIdValidation.valid) return playerIdValidation

  const leagueIdValidation = validateUUID(leagueId, 'League ID')
  if (!leagueIdValidation.valid) return leagueIdValidation

  return { valid: true }
}

/**
 * Validate draft status
 */
export function validateDraftStatus(status: string | null | undefined): ValidationResult {
  const validStatuses = ['not_started', 'scheduled', 'in_progress', 'paused', 'completed']
  
  if (!status) {
    return { valid: false, error: 'Draft status is required' }
  }
  
  if (!validStatuses.includes(status)) {
    return { valid: false, error: `Invalid draft status: ${status}. Must be one of: ${validStatuses.join(', ')}` }
  }
  
  return { valid: true }
}

/**
 * Validate timer extension amount (in seconds)
 */
export function validateTimerExtension(seconds: number): ValidationResult {
  if (typeof seconds !== 'number' || isNaN(seconds)) {
    return { valid: false, error: 'Timer extension must be a valid number' }
  }
  
  if (seconds <= 0) {
    return { valid: false, error: 'Timer extension must be greater than 0' }
  }
  
  if (seconds > 300) { // Max 5 minutes
    return { valid: false, error: 'Timer extension cannot exceed 300 seconds (5 minutes)' }
  }
  
  return { valid: true }
}

/**
 * Validate draft rounds
 */
export function validateDraftRounds(rounds: number): ValidationResult {
  if (typeof rounds !== 'number' || isNaN(rounds)) {
    return { valid: false, error: 'Rounds must be a valid number' }
  }
  
  if (rounds < 1) {
    return { valid: false, error: 'Rounds must be at least 1' }
  }
  
  if (rounds > 20) {
    return { valid: false, error: 'Rounds cannot exceed 20' }
  }
  
  return { valid: true }
}

