'use client'

import { track } from './track'

/**
 * Track API performance metrics
 */
export function trackAPIPerformance(
  endpoint: string,
  duration: number,
  success: boolean,
  error?: string
) {
  track('api_performance', {
    endpoint,
    duration_ms: duration,
    success,
    error,
  })
}

/**
 * Wrapper for tracking server action performance
 */
export async function withPerformanceTracking<T>(
  actionName: string,
  fn: () => Promise<T>
): Promise<T> {
  const startTime = performance.now()
  
  try {
    const result = await fn()
    const duration = performance.now() - startTime
    
    trackAPIPerformance(actionName, duration, true)
    
    return result
  } catch (error: any) {
    const duration = performance.now() - startTime
    
    trackAPIPerformance(
      actionName,
      duration,
      false,
      error?.message || 'Unknown error'
    )
    
    throw error
  }
}

/**
 * Track web vitals
 */
export function trackWebVital(
  name: string,
  value: number,
  id: string,
  delta?: number
) {
  track('web_vital', {
    name,
    value,
    id,
    delta,
  })
}

