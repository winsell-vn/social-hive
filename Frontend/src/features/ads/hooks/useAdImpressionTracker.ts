"use client";

import { useCallback, useEffect, useRef } from "react";
import { trackAdImpression } from "../api/ads";

// Global set to track already-impressed ad IDs per page load
const impressedAdIds = new Set<string>();

/**
 * Hook to track ad impressions using Intersection Observer
 * Only fires ONCE per ad per page load when 50% of the ad is visible
 */
export function useAdImpressionTracker(adId: string) {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const hasTracked = useRef(false);

  const setRef = useCallback((node: HTMLDivElement | null) => {
    elementRef.current = node;
  }, []);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || hasTracked.current || impressedAdIds.has(adId)) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !hasTracked.current && !impressedAdIds.has(adId)) {
          hasTracked.current = true;
          impressedAdIds.add(adId);
          trackAdImpression(adId);
        }
      },
      {
        threshold: 0.5, // 50% visible
        rootMargin: "0px",
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [adId]);

  return setRef;
}

