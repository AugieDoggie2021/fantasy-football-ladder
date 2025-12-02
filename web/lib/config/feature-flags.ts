/**
 * Feature Flags Configuration
 * 
 * Control experimental features and functionality based on environment
 * or explicit toggles. This allows safe rollout of new features.
 */

export interface FeatureFlags {
  impersonation: boolean
  dryRunMode: boolean
  advancedAnalytics: boolean
  realtimeUpdates: boolean
}

const getDefaultFlags = (): FeatureFlags => {
  const env = process.env.NEXT_PUBLIC_APP_ENV || 'dev'
  
  return {
    // Impersonation is available in dev and staging
    impersonation: env === 'dev' || env === 'staging',
    // Dry run mode available in all environments
    dryRunMode: true,
    // Advanced analytics deferred to post-MVP
    advancedAnalytics: false,
    // Realtime updates for MVP
    realtimeUpdates: true,
  }
}

export const featureFlags: FeatureFlags = getDefaultFlags()

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(flag: keyof FeatureFlags): boolean {
  return featureFlags[flag]
}

