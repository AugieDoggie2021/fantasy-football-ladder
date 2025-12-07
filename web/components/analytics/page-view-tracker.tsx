'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { trackPageView } from '@/lib/analytics/track'

export function PageViewTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!pathname) return

    // Build full path with search params
    const fullPath = searchParams.toString()
      ? `${pathname}?${searchParams.toString()}`
      : pathname

    // Track page view
    trackPageView(fullPath, document.title)
  }, [pathname, searchParams])

  return null
}

