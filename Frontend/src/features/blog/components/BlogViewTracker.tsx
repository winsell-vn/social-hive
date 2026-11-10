'use client'

import { useEffect, useRef } from 'react'

interface BlogViewTrackerProps {
  slug: string
}

export function BlogViewTracker({ slug }: BlogViewTrackerProps) {
  const tracked = useRef(false)

  useEffect(() => {
    if (tracked.current) return
    tracked.current = true

    const timer = setTimeout(async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'
        await fetch(`${API_URL}/blog/posts/${slug}/view`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      } catch {
        // Silently fail - view tracking is not critical
      }
    }, 5000) // 5 second delay

    return () => clearTimeout(timer)
  }, [slug])

  return null // This component renders nothing
}

