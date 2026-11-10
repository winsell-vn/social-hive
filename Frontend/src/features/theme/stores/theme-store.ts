import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "light" | "dark" | "system";

interface ThemeState {
  /** Theme used across the public site / user-facing pages. */
  theme: Theme;
  /** Theme used inside the admin panel. Defaults to light because admin
   * screens are built with light-mode styling. */
  adminTheme: Theme;
  setTheme: (theme: Theme) => void;
  setAdminTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "dark", // Default to dark theme
      adminTheme: "light", // Admin panel defaults to light theme
      setTheme: (theme) => set({ theme }),
      setAdminTheme: (adminTheme) => set({ adminTheme }),
    }),
    {
      name: "theme-storage",
      skipHydration: true, // Skip hydration during SSR to avoid prerender issues
    },
  ),
);
