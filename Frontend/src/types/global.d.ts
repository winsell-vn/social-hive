/**
 * Global type declarations for window extensions
 */

interface Window {
  /**
   * Google Analytics gtag function
   * @see https://developers.google.com/analytics/devguides/collection/gtagjs
   */
  gtag?: (
    command: 'config' | 'event' | 'consent' | 'js' | 'set',
    targetIdOrAction: string | Date,
    params?: Record<string, unknown>
  ) => void

  /**
   * Function to grant analytics consent after user accepts cookie banner
   * Called by cookie consent banner to update GA consent state
   */
  __grantAnalyticsConsent?: () => void
}

