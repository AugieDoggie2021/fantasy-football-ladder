'use client'

import { useUserIdentification } from '@/lib/hooks/use-user-identification'

/**
 * Client component that identifies users in PostHog when authenticated
 * This component uses the useUserIdentification hook to automatically
 * identify users and set their properties when they log in
 */
export function UserIdentification() {
  useUserIdentification()
  return null
}

