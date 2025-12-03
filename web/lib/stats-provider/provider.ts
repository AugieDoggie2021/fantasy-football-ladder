/**
 * Provider-agnostic interface for external stats providers
 * 
 * This interface allows the app to work with any stats provider implementation
 * without being tightly coupled to a specific provider's API.
 */

import type { ExternalPlayer, ExternalPlayerWeekStats } from './types';

export interface ExternalStatsProvider {
  /**
   * Fetch all players from the external provider
   * @returns Array of external player data
   */
  fetchAllPlayers(): Promise<ExternalPlayer[]>;

  /**
   * Fetch weekly player stats for a given season and week
   * @param seasonYear - The NFL season year (e.g., 2024)
   * @param week - The NFL week number (1-18)
   * @param options - Optional configuration including mode for API replay
   * @returns Array of external player week stats
   */
  fetchWeeklyPlayerStats(
    seasonYear: number,
    week: number,
    options?: { mode?: 'live' | 'replay' }
  ): Promise<ExternalPlayerWeekStats[]>;
}

