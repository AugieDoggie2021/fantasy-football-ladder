'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface DraftPick {
  id: string
  league_id: string
  round: number
  overall_pick: number
  team_id: string
  player_id: string | null
  pick_due_at: string | null
  pick_started_at?: string | null
  pick_duration_seconds?: number | null
  picked_at: string | null
  is_auto_pick?: boolean | null
  created_at: string
  teams?: {
    id: string
    name: string
  } | null
  players?: {
    id: string
    full_name: string
    position: string
  } | null
}

export type { DraftPick }

interface LeagueDraftState {
  id: string
  draft_status: string
  draft_started_at: string | null
  draft_completed_at: string | null
  current_pick_id: string | null
  draft_settings: {
    timer_seconds?: number
    auto_pick_enabled?: boolean
    rounds?: number
  } | null
}

export interface DraftFeedEvent {
  id: string
  league_id: string
  pick_id?: string | null
  event_type: string
  payload: Record<string, any> | null
  actor_user_id?: string | null
  is_auto_pick?: boolean | null
  created_at: string
  draft_picks?: {
    id: string
    overall_pick: number
    round: number
    team_id: string
    player_id: string | null
    teams?: { id: string; name: string } | null
    players?: { id: string; full_name: string; position: string; nfl_team?: string | null } | null
  } | null
}

interface UseDraftRealtimeOptions {
  leagueId: string
  enabled?: boolean
  onPickUpdate?: (pick: DraftPick) => void
  onDraftStatusChange?: (status: LeagueDraftState) => void
  onFeedUpdate?: (event: DraftFeedEvent) => void
  onError?: (error: Error) => void
}

interface UseDraftRealtimeReturn {
  picks: DraftPick[]
  draftState: LeagueDraftState | null
  feedEvents: DraftFeedEvent[]
  isConnected: boolean
  error: Error | null
  reconnect: () => void
}

/**
 * Custom hook for subscribing to realtime draft updates
 * 
 * Subscribes to:
 * - draft_picks table changes (INSERT, UPDATE, DELETE)
 * - leagues table changes (for draft_status updates)
 * 
 * Features:
 * - Auto-reconnect on connection loss
 * - Connection status tracking
 * - Error handling
 * - Callbacks for pick updates and status changes
 */
export function useDraftRealtime({
  leagueId,
  enabled = true,
  onPickUpdate,
  onDraftStatusChange,
  onFeedUpdate,
  onError,
}: UseDraftRealtimeOptions): UseDraftRealtimeReturn {
  const [picks, setPicks] = useState<DraftPick[]>([])
  const [draftState, setDraftState] = useState<LeagueDraftState | null>(null)
  const [feedEvents, setFeedEvents] = useState<DraftFeedEvent[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  
  const picksChannelRef = useRef<RealtimeChannel | null>(null)
  const leaguesChannelRef = useRef<RealtimeChannel | null>(null)
  const feedChannelRef = useRef<RealtimeChannel | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const maxReconnectAttempts = 5

  // Fetch initial data
  useEffect(() => {
    if (!enabled || !leagueId) return

    const fetchInitialData = async () => {
      try {
        // Fetch initial draft picks
        const { data: initialPicks, error: picksError } = await supabase
          .from('draft_picks')
          .select(`
            *,
            teams (
              id,
              name
            ),
            players (
              id,
              full_name,
              position
            )
          `)
          .eq('league_id', leagueId)
          .order('overall_pick', { ascending: true })

        if (picksError) throw picksError

        setPicks(initialPicks || [])

        // Fetch initial feed
        const { data: initialFeed, error: feedError } = await supabase
          .from('draft_feed_events')
          .select(`
            *,
            draft_picks (
              id,
              overall_pick,
              round,
              team_id,
              player_id,
              teams ( id, name ),
              players ( id, full_name, position, nfl_team )
            )
          `)
          .eq('league_id', leagueId)
          .order('created_at', { ascending: false })
          .limit(50)

        if (feedError) throw feedError
        setFeedEvents((initialFeed as DraftFeedEvent[]) || [])

        // Fetch initial league state
        const { data: league, error: leagueError } = await supabase
          .from('leagues')
          .select('id, draft_status, draft_started_at, draft_completed_at, current_pick_id, draft_settings')
          .eq('id', leagueId)
          .single()

        if (leagueError) throw leagueError

        if (league) {
          setDraftState({
            id: league.id,
            draft_status: league.draft_status || 'scheduled',
            draft_started_at: league.draft_started_at,
            draft_completed_at: league.draft_completed_at,
            current_pick_id: league.current_pick_id,
            draft_settings: league.draft_settings as any,
          })
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to fetch initial draft data')
        setError(error)
        onError?.(error)
      }
    }

    fetchInitialData()
  }, [leagueId, enabled, onError])

  // Set up realtime subscriptions
  useEffect(() => {
    if (!enabled || !leagueId) return

    // Subscribe to draft_picks changes
    const picksChannel = supabase
      .channel(`draft_picks:${leagueId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'draft_picks',
          filter: `league_id=eq.${leagueId}`,
        },
        async (payload) => {
          try {
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              // Fetch the updated pick with relations
              const { data: updatedPick, error: fetchError } = await supabase
                .from('draft_picks')
                .select(`
                  *,
                  teams (
                    id,
                    name
                  ),
                  players (
                    id,
                    full_name,
                    position
                  )
                `)
                .eq('id', payload.new.id)
                .single()

              if (fetchError) throw fetchError

              if (updatedPick) {
                setPicks((prev) => {
                  const existing = prev.findIndex(p => p.id === updatedPick.id)
                  if (existing >= 0) {
                    const updated = [...prev]
                    updated[existing] = updatedPick as DraftPick
                    return updated
                  } else {
                    return [...prev, updatedPick as DraftPick].sort((a, b) => a.overall_pick - b.overall_pick)
                  }
                })

                onPickUpdate?.(updatedPick as DraftPick)
              }
            } else if (payload.eventType === 'DELETE') {
              setPicks((prev) => prev.filter(p => p.id !== payload.old.id))
            }
          } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to process pick update')
            setError(error)
            onError?.(error)
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true)
          reconnectAttemptsRef.current = 0
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setIsConnected(false)
          handleReconnect()
        }
      })

    picksChannelRef.current = picksChannel

    // Subscribe to leagues table changes (for draft_status updates)
    const leaguesChannel = supabase
      .channel(`leagues:${leagueId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'leagues',
          filter: `id=eq.${leagueId}`,
        },
        async (payload) => {
          try {
            const updated = payload.new as LeagueDraftState
            setDraftState({
              id: updated.id,
              draft_status: updated.draft_status || 'scheduled',
              draft_started_at: updated.draft_started_at,
              draft_completed_at: updated.draft_completed_at,
              current_pick_id: updated.current_pick_id,
              draft_settings: updated.draft_settings,
            })

            onDraftStatusChange?.(updated)
          } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to process draft status update')
            setError(error)
            onError?.(error)
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true)
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setIsConnected(false)
          handleReconnect()
        }
      })

    leaguesChannelRef.current = leaguesChannel

    // Subscribe to feed events
    const feedChannel = supabase
      .channel(`draft_feed_events:${leagueId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'draft_feed_events',
          filter: `league_id=eq.${leagueId}`,
        },
        async (payload) => {
          try {
            const eventId = payload.new.id as string
            const { data: eventWithRelations, error } = await supabase
              .from('draft_feed_events')
              .select(`
                *,
                draft_picks (
                  id,
                  overall_pick,
                  round,
                  team_id,
                  player_id,
                  teams ( id, name ),
                  players ( id, full_name, position, nfl_team )
                )
              `)
              .eq('id', eventId)
              .single()

            if (error) {
              throw error
            }

            if (eventWithRelations) {
              setFeedEvents((prev) => {
                const next = [eventWithRelations as DraftFeedEvent, ...prev].slice(0, 50)
                return next
              })
              onFeedUpdate?.(eventWithRelations as DraftFeedEvent)
            }
          } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to process feed update')
            setError(error)
            onError?.(error)
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true)
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setIsConnected(false)
          handleReconnect()
        }
      })

    feedChannelRef.current = feedChannel

    // Cleanup function
    return () => {
      picksChannel.unsubscribe()
      leaguesChannel.unsubscribe()
      feedChannel.unsubscribe()
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [leagueId, enabled, onPickUpdate, onDraftStatusChange, onFeedUpdate, onError])

  const handleReconnect = () => {
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      const error = new Error('Max reconnection attempts reached')
      setError(error)
      onError?.(error)
      return
    }

    reconnectAttemptsRef.current++
    const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000) // Exponential backoff, max 30s

    reconnectTimeoutRef.current = setTimeout(() => {
      // Re-subscribe by triggering effect cleanup and re-run
      if (picksChannelRef.current) {
        picksChannelRef.current.unsubscribe()
      }
      if (leaguesChannelRef.current) {
        leaguesChannelRef.current.unsubscribe()
      }
      // The effect will re-run and re-subscribe
    }, delay)
  }

  const reconnect = () => {
    reconnectAttemptsRef.current = 0
    setError(null)
    handleReconnect()
  }

  return {
    picks,
    draftState,
    feedEvents,
    isConnected,
    error,
    reconnect,
  }
}
