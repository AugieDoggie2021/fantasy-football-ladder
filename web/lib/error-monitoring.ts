/**
 * Error Monitoring Utilities
 * Provides centralized error tracking and monitoring
 */

import { track } from './analytics/track'
import { trackError } from './analytics/server-track'
import { AnalyticsEvents } from './analytics/events'

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical'

export interface ErrorContext {
  userId?: string
  leagueId?: string
  teamId?: string
  pagePath?: string
  userAgent?: string
  [key: string]: unknown
}

/**
 * Track an error on the client side
 */
export function trackClientError(
  error: Error | string,
  severity: ErrorSeverity = 'medium',
  context?: ErrorContext
) {
  const errorMessage = typeof error === 'string' ? error : error.message
  const errorStack = typeof error === 'string' ? undefined : error.stack
  const errorType = typeof error === 'string' ? 'Unknown' : error.name

  // Track in PostHog (client-side)
  if (typeof window !== 'undefined') {
    try {
      track(AnalyticsEvents.ERROR_OCCURRED, {
        error_message: errorMessage,
        error_type: errorType,
        error_stack: errorStack,
        severity,
        ...context,
      })
    } catch (e) {
      console.error('Failed to track error in PostHog:', e)
    }
  }

  // Also log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error(`[${severity.toUpperCase()}] Error:`, errorMessage, context)
    if (errorStack) {
      console.error('Stack:', errorStack)
    }
  }
}

/**
 * Track an error on the server side
 */
export async function trackServerError(
  error: Error | string,
  severity: ErrorSeverity = 'medium',
  context?: ErrorContext
) {
  const errorMessage = typeof error === 'string' ? error : error.message
  const errorStack = typeof error === 'string' ? undefined : error.stack
  const errorType = typeof error === 'string' ? 'Unknown' : error.name

  // Track in Supabase analytics_events table
  try {
    await trackError(
      errorMessage,
      errorType,
      errorStack,
      context?.pagePath,
      context?.userId
    )
  } catch (e) {
    console.error('Failed to track server error:', e)
  }

  // Log to console
  console.error(`[${severity.toUpperCase()}] Server Error:`, errorMessage, context)
  if (errorStack) {
    console.error('Stack:', errorStack)
  }
}

/**
 * Wrap an async function with error tracking
 */
export function withErrorTracking<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  errorContext?: ErrorContext
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args)
    } catch (error) {
      trackClientError(
        error instanceof Error ? error : new Error(String(error)),
        'medium',
        errorContext
      )
      throw error
    }
  }) as T
}

