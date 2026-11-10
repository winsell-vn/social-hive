'use client'

import { useEffect, useState } from 'react'

/**
 * Client-side analytics provider that wraps WebVitals and GoogleAnalytics.
 * Uses lazy loading to ensure components only render on the client side,
 * avoiding prerender issues with hooks like useReportWebVitals, usePathname,
 * and useSearchParams.
 *
 * This is a Client Component wrapper to avoid using dynamic() with ssr:false
 * directly in Server Components (which is not allowed in Next.js 16 App Router).
 */
export function AnalyticsProvider() {
  const [mounted, setMounted] = useState(false)
  const [WebVitals, setWebVitals] = useState<React.ComponentType | null>(null)
  const [GoogleAnalytics, setGoogleAnalytics] = useState<React.ComponentType | null>(null)

  useEffect(() => {
    setMounted(true)
    // Dynamically import components only on client side
    import('@/components/analytics/WebVitals').then((mod) => {
      setWebVitals(() => mod.WebVitals)
    })
    import('@/components/analytics/GoogleAnalytics').then((mod) => {
      setGoogleAnalytics(() => mod.GoogleAnalytics)
    })
  }, [])

  // Don't render anything during SSR/SSG
  if (!mounted) {
    return null
  }

  return (
    <>
      {WebVitals && <WebVitals />}
      {GoogleAnalytics && <GoogleAnalytics />}
    </>
  )
}

