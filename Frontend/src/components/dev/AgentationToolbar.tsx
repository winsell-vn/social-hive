'use client';

import { useEffect, useState, type ComponentType } from 'react';
import type { AgentationProps } from 'agentation';

/**
 * Dev-only Agentation toolbar.
 *
 * Agentation lets you click any element on the page, attach a note, and copy
 * structured markdown (CSS selector, source file path, component tree) that an
 * AI agent can act on directly.
 *
 * The package is a devDependency and is loaded with a lazy dynamic import so
 * it is never part of the server render, never ships in the production bundle,
 * and never touches the production DOM. `NODE_ENV` is inlined by Next.js at
 * build time, so the production build drops this branch entirely.
 *
 * Mirrors the lazy-loading pattern already used by AnalyticsProvider.
 */
export function AgentationToolbar() {
  const [Toolbar, setToolbar] = useState<ComponentType<AgentationProps> | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    let cancelled = false;

    import('agentation').then((mod) => {
      if (!cancelled) {
        setToolbar(() => mod.Agentation);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!Toolbar) {
    return null;
  }

  return (
    <Toolbar
      appName="ChungToiXayWeb"
      // Lift the toolbar above the blog "scroll to top" button (fixed bottom-6 right-6)
      // so the two do not overlap.
      className="!bottom-24"
    />
  );
}
