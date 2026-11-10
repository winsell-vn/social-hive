'use client'

import Script from 'next/script'
import { Suspense, useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

function NavigationTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (typeof window.gtag !== 'function') return
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '')
    window.gtag('event', 'page_view', {
      page_path: url,
      page_location: window.location.origin + url,
      page_title: document.title,
    })
  }, [pathname, searchParams])

  return null
}

export function GoogleAnalytics() {
  if (!GA_MEASUREMENT_ID) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          // Default consent to 'denied' - a cookie consent banner should call window.__grantAnalyticsConsent() to update
          gtag('consent', 'default', {
            'analytics_storage': 'denied',
            'ad_storage': 'denied'
          });
          // Function for cookie consent banner to grant analytics consent
          window.__grantAnalyticsConsent = function() {
            gtag('consent', 'update', {
              'analytics_storage': 'granted'
            });
          };
          gtag('config', '${GA_MEASUREMENT_ID}', {
            page_path: window.location.pathname,
          });
        `}
      </Script>
      <Suspense fallback={null}>
        <NavigationTracker />
      </Suspense>
    </>
  )
}

