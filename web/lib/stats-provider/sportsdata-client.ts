/**
 * SportsData.io implementation of ExternalStatsProvider
 * 
 * This client handles communication with SportsData.io API and maps
 * their response format to our provider-agnostic types.
 */

import type { ExternalStatsProvider } from './provider';
import type { ExternalPlayer, ExternalPlayerWeekStats } from './types';

const BASE_URL = process.env.EXTERNAL_STATS_API_BASE_URL || 'https://api.sportsdata.io/v3/nfl';
const API_KEY = process.env.EXTERNAL_STATS_API_KEY || '';

if (!API_KEY) {
  console.warn('EXTERNAL_STATS_API_KEY is not set. SportsData.io API calls will fail.');
}

export class SportsDataProvider implements ExternalStatsProvider {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl?: string, apiKey?: string) {
    this.baseUrl = baseUrl || BASE_URL;
    this.apiKey = apiKey || API_KEY;
  }

  /**
   * Fetch all NFL players from SportsData.io
   * 
   * TODO: Verify the exact endpoint and response format from SportsData.io docs
   * Expected endpoint: GET /Players
   */
  async fetchAllPlayers(): Promise<ExternalPlayer[]> {
    const url = `${this.baseUrl}/Players`;
    
    const response = await fetch(url, {
      headers: {
        'Ocp-Apim-Subscription-Key': this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`SportsData.io API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // TODO: Map SportsData.io player format to ExternalPlayer
    // This is a placeholder mapping - adjust based on actual API response
    return data.map((player: any): ExternalPlayer => ({
      externalSource: 'sportsdata',
      externalId: String(player.PlayerID || player.playerID || player.id),
      fullName: player.Name || player.FullName || player.fullName || '',
      firstName: player.FirstName || player.firstName,
      lastName: player.LastName || player.lastName,
      position: player.Position || player.position,
      team: player.Team || player.team,
      byeWeek: player.ByeWeek || player.byeWeek || null,
      status: player.Status || player.status || null,
    }));
  }

  /**
   * Fetch weekly player stats from SportsData.io
   * 
   * TODO: Verify the exact endpoint and response format from SportsData.io docs
   * Expected endpoint: GET /PlayerGameStatsByWeek/{season}/{week}
   * or similar endpoint for weekly stats
   * 
   * @param seasonYear - The NFL season year (e.g., 2024)
   * @param week - The NFL week number (1-18)
   * @param options - Optional configuration including mode for API replay
   */
  async fetchWeeklyPlayerStats(
    seasonYear: number,
    week: number,
    options?: { mode?: 'live' | 'replay' }
  ): Promise<ExternalPlayerWeekStats[]> {
    // Log mode for future API replay support
    if (options?.mode === 'replay') {
      console.log(`[SportsData] Replay mode requested for ${seasonYear} Week ${week}`);
      // TODO: Implement replay logic (e.g., use cached data or different endpoint)
    }

    // TODO: Verify the exact endpoint format from SportsData.io docs
    // This is a placeholder - adjust based on actual API structure
    const url = `${this.baseUrl}/PlayerGameStatsByWeek/${seasonYear}/${week}`;
    
    const response = await fetch(url, {
      headers: {
        'Ocp-Apim-Subscription-Key': this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`SportsData.io API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // TODO: Map SportsData.io stats format to ExternalPlayerWeekStats
    // This is a placeholder mapping - adjust based on actual API response
    return data.map((stat: any): ExternalPlayerWeekStats => {
      const playerId = String(stat.PlayerID || stat.playerID || stat.id);
      const statKey = `${playerId}-${seasonYear}-${week}`;

      return {
        externalSource: 'sportsdata',
        externalPlayerId: playerId,
        externalStatKey: statKey,
        seasonYear,
        week,
        passingYards: stat.PassingYards || stat.passingYards || 0,
        passingTds: stat.PassingTouchdowns || stat.passingTouchdowns || stat.passingTds || 0,
        interceptions: stat.Interceptions || stat.interceptions || 0,
        rushingYards: stat.RushingYards || stat.rushingYards || 0,
        rushingTds: stat.RushingTouchdowns || stat.rushingTouchdowns || stat.rushingTds || 0,
        receivingYards: stat.ReceivingYards || stat.receivingYards || 0,
        receivingTds: stat.ReceivingTouchdowns || stat.receivingTouchdowns || stat.receivingTds || 0,
        receptions: stat.Receptions || stat.receptions || 0,
        kickingPoints: stat.FantasyPoints || stat.fantasyPoints || stat.kickingPoints || 0, // TODO: Verify field name
        defensePoints: stat.DefenseFantasyPoints || stat.defenseFantasyPoints || stat.defensePoints || 0, // TODO: Verify field name
      };
    });
  }
}

/**
 * Factory function to get the configured external stats provider
 * For now, always returns SportsData.io provider
 */
export function getExternalStatsProvider(): ExternalStatsProvider {
  return new SportsDataProvider();
}

