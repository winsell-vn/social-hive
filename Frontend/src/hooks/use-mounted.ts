"use client";
import { useState, useEffect } from "react";

/**
 * Hook to track component mount state for hydration mismatch prevention.
 * Use this when rendering client-only UI elements (dropdowns, modals, etc.)
 * that may cause hydration mismatches between server and client.
 */
export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return mounted;
}

