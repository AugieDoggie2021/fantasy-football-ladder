/**
 * Provider-agnostic types for external stats providers
 * 
 * These types define the interface between the app and external stats providers
 * like SportsData.io, allowing for easy swapping of providers in the future.
 */

export type ExternalStatsProviderName = 'sportsdata'; // extensible later

/**
 * External player data structure
 * Maps to the players table in Supabase
 */
export type ExternalPlayer = {
  externalSource: ExternalStatsProviderName;
  externalId: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  position?: string; // e.g., 'QB', 'RB', 'WR', 'TE', 'K', 'DEF'
  team?: string; // NFL team code (e.g., 'DAL', 'NYG')
  byeWeek?: number | null;
  status?: string | null; // e.g., 'Active', 'Injured Reserve', etc.
};

/**
 * External player week stats structure
 * Maps to the player_week_stats table in Supabase
 */
export type ExternalPlayerWeekStats = {
  externalSource: ExternalStatsProviderName;
  externalPlayerId: string;
  externalStatKey?: string | null; // Composite key for debugging/traceability
  seasonYear: number;
  week: number;
  passingYards?: number;
  passingTds?: number;
  interceptions?: number;
  rushingYards?: number;
  rushingTds?: number;
  receivingYards?: number;
  receivingTds?: number;
  receptions?: number;
  kickingPoints?: number;
  defensePoints?: number;
};

