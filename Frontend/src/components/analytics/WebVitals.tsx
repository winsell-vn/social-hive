'use client'

import { useReportWebVitals } from 'next/web-vitals'

type WebVitalsMetric = {
  id: string
  name: 'CLS' | 'FCP' | 'FID' | 'INP' | 'LCP' | 'TTFB'
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta: number
  entries: PerformanceEntry[]
  navigationType: 'navigate' | 'reload' | 'back-forward' | 'back-forward-cache' | 'prerender'
}

// Thresholds based on Google's Core Web Vitals guidelines
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },   // Largest Contentful Paint
  FID: { good: 100, poor: 300 },     // First Input Delay (deprecated, use INP)
  CLS: { good: 0.1, poor: 0.25 },    // Cumulative Layout Shift
  FCP: { good: 1800, poor: 3000 },   // First Contentful Paint
  TTFB: { good: 800, poor: 1800 },   // Time to First Byte
  INP: { good: 200, poor: 500 },     // Interaction to Next Paint
}

function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name as keyof typeof THRESHOLDS]
  if (!threshold) return 'good'
  
  if (value <= threshold.good) return 'good'
  if (value <= threshold.poor) return 'needs-improvement'
  return 'poor'
}

function formatValue(name: string, value: number): string {
  if (name === 'CLS') return value.toFixed(3)
  return `${Math.round(value)}ms`
}

/**
 * Send metrics to Google Analytics in production
 * Uses gtag event tracking for Core Web Vitals
 */
function sendToAnalytics(metric: WebVitalsMetric) {
  // Only send if Google Analytics (gtag) is loaded
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', metric.name, {
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      event_category: 'Web Vitals',
      event_label: metric.id,
      non_interaction: true,
    })
  }
  // If gtag is not available, silently skip - no fallback to non-existent endpoint
}

/**
 * WebVitals component for Real User Monitoring (RUM)
 * Tracks Core Web Vitals: LCP, FID, CLS, FCP, TTFB, INP
 * 
 * - Development: Logs metrics to console with color-coded ratings
 * - Production: Sends metrics to analytics endpoint (if configured)
 * 
 * This component renders nothing and is non-blocking.
 */
export function WebVitals() {
  useReportWebVitals((metric) => {
    const rating = getRating(metric.name, metric.value)
    const formattedValue = formatValue(metric.name, metric.value)
    
    // Development: Log to console with color coding
    if (process.env.NODE_ENV === 'development') {
      const colors = {
        good: 'color: #0cce6b',
        'needs-improvement': 'color: #ffa400',
        poor: 'color: #ff4e42',
      }
      
      console.log(
        `%c[Web Vitals] ${metric.name}: ${formattedValue} (${rating})`,
        colors[rating]
      )
    }
    
    // Production: Send to analytics endpoint
    if (process.env.NODE_ENV === 'production') {
      sendToAnalytics({
        ...metric,
        rating,
      } as WebVitalsMetric)
    }
  })

  // This component renders nothing
  return null
}

