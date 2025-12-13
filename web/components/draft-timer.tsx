'use client'

import { useState, useEffect } from 'react'

interface DraftTimerProps {
  pickDueAt: string | null
  pickStartedAt?: string | null
  pickDurationSeconds?: number | null
  isPaused?: boolean
  pausedSeconds?: number | null
  label?: string
  onExpired?: () => void
  size?: 'sm' | 'md' | 'lg'
}

/**
 * DraftTimer component displays a countdown timer for the current draft pick
 * 
 * Features:
 * - Real-time countdown from pick_due_at timestamp
 * - Visual progress indicator (circular or bar)
 * - Warning states at 30s and 10s remaining
 * - Expired state handling
 * - Pause support
 */
export function DraftTimer({
  pickDueAt,
  pickStartedAt = null,
  pickDurationSeconds = null,
  isPaused = false,
  pausedSeconds = null,
  label,
  onExpired,
  size = 'md',
}: DraftTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [isExpired, setIsExpired] = useState(false)

  const deriveDueAt = () => {
    if (pickDueAt) return pickDueAt
    if (pickStartedAt && pickDurationSeconds) {
      const start = new Date(pickStartedAt)
      const due = new Date(start.getTime() + pickDurationSeconds * 1000)
      return due.toISOString()
    }
    return null
  }

  useEffect(() => {
    if (isPaused) {
      // Freeze timer when paused; use provided pausedSeconds when available
      if (typeof pausedSeconds === 'number') {
        setTimeRemaining(pausedSeconds)
      }
      setIsExpired(false)
      return
    }

    const derivedDueAt = deriveDueAt()
    if (!derivedDueAt) {
      setTimeRemaining(null)
      setIsExpired(false)
      return
    }

    const calculateTimeRemaining = () => {
      try {
        const dueAt = new Date(derivedDueAt)
        const now = new Date()
        
        // Handle invalid dates
        if (isNaN(dueAt.getTime())) {
          console.error('Invalid pickDueAt timestamp:', pickDueAt)
          setTimeRemaining(null)
          return
        }
        
        // Handle clock drift - if dueAt is in the past by more than 5 seconds, consider expired
        const timeDiff = dueAt.getTime() - now.getTime()
        const remaining = Math.max(0, Math.floor(timeDiff / 1000))
        
        // If timer is significantly in the past (more than 5 seconds), mark as expired
        if (timeDiff < -5000) {
          setTimeRemaining(0)
          if (!isExpired) {
            setIsExpired(true)
            onExpired?.()
          }
          return
        }
        
        setTimeRemaining(remaining)
        
        if (remaining === 0 && !isExpired) {
          setIsExpired(true)
          onExpired?.()
        } else if (remaining > 0) {
          setIsExpired(false)
        }
      } catch (error) {
        console.error('Error calculating time remaining:', error)
        setTimeRemaining(null)
      }
    }

    // Calculate immediately
    calculateTimeRemaining()

    // Update every second
    const interval = setInterval(calculateTimeRemaining, 1000)

    return () => clearInterval(interval)
  }, [pickDueAt, pickStartedAt, pickDurationSeconds, isPaused, pausedSeconds, onExpired, isExpired])

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const effectiveRemaining = timeRemaining

  // If expired
  if (!isPaused && (isExpired || (effectiveRemaining !== null && effectiveRemaining === 0))) {
    return (
      <div className={`flex items-center gap-2 ${size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-lg' : ''}`}>
        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        <span className="text-red-600 dark:text-red-400 font-semibold">Time expired</span>
      </div>
    )
  }

  // Handle paused display
  if (isPaused) {
    return (
      <div className={`flex items-center justify-between gap-3 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3 ${size === 'lg' ? 'text-xl' : ''}`}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-gray-400" />
          <span className="text-gray-700 dark:text-gray-300 font-medium">
            {label || 'Draft Paused'}
          </span>
        </div>
        {typeof effectiveRemaining === 'number' && (
          <span className="font-mono font-semibold text-gray-900 dark:text-white">
            {formatTime(Math.max(0, effectiveRemaining))}
          </span>
        )}
      </div>
    )
  }

  // Determine warning state
  const getWarningState = (): 'normal' | 'warning' | 'critical' => {
    if (effectiveRemaining === null) return 'normal'
    if (effectiveRemaining <= 10) return 'critical'
    if (effectiveRemaining <= 30) return 'warning'
    return 'normal'
  }

  const warningState = getWarningState()
  const derivedDueAt = deriveDueAt()
  const totalSeconds = derivedDueAt ? Math.max(0, Math.floor((new Date(derivedDueAt).getTime() - new Date().getTime()) / 1000)) : effectiveRemaining ?? 0
  const initialSeconds = totalSeconds > 0 ? totalSeconds : effectiveRemaining ?? 90 // Default to 90 if we can't calculate
  const progress = effectiveRemaining !== null && initialSeconds > 0 
    ? (effectiveRemaining / initialSeconds) * 100 
    : 100

  // Color based on warning state
  const getColorClasses = () => {
    switch (warningState) {
      case 'critical':
        return {
          text: 'text-red-600 dark:text-red-400',
          bg: 'bg-red-100 dark:bg-red-900/20',
          border: 'border-red-300 dark:border-red-700',
          progress: 'bg-red-500',
          dot: 'bg-red-500',
        }
      case 'warning':
        return {
          text: 'text-yellow-600 dark:text-yellow-400',
          bg: 'bg-yellow-50 dark:bg-yellow-900/20',
          border: 'border-yellow-300 dark:border-yellow-700',
          progress: 'bg-yellow-500',
          dot: 'bg-yellow-500',
        }
      default:
        return {
          text: 'text-gray-900 dark:text-white',
          bg: 'bg-gray-50 dark:bg-gray-800',
          border: 'border-gray-200 dark:border-gray-700',
          progress: 'bg-indigo-500',
          dot: 'bg-green-500',
        }
    }
  }

  const colors = getColorClasses()

  if (size === 'sm') {
    return (
      <div className={`flex items-center gap-2 ${colors.text}`}>
        <div className={`w-2 h-2 rounded-full ${colors.dot}`} />
        <span className="font-mono font-semibold">
          {timeRemaining !== null ? formatTime(timeRemaining) : '--:--'}
        </span>
      </div>
    )
  }

  return (
    <div className={`p-4 rounded-lg border ${colors.bg} ${colors.border}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${colors.dot} ${warningState === 'critical' ? 'animate-pulse' : ''}`} />
        <span className={`text-sm font-medium ${colors.text}`}>
            {label || 'Time Remaining'}
        </span>
      </div>
      <span className={`font-mono font-bold text-2xl ${colors.text}`}>
          {effectiveRemaining !== null ? formatTime(effectiveRemaining) : '--:--'}
      </span>
    </div>
    
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full ${colors.progress} transition-all duration-1000 ease-linear`}
          style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
        />
      </div>
      
      {/* Warning Messages */}
      {warningState === 'critical' && (
        <p className="text-xs text-red-600 dark:text-red-400 mt-2 font-medium">
          ⚠️ Time running out!
        </p>
      )}
      {warningState === 'warning' && (
        <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
          Less than 30 seconds remaining
        </p>
      )}
    </div>
  )
}
