import { create } from 'zustand';
import type { UserSettings, SettingsTab } from '../types/settings';

interface SettingsState {
  settings: UserSettings | null;
  activeTab: SettingsTab;
  isLoading: boolean;
  error: string | null;
  isSaving: boolean;

  // Actions
  setSettings: (settings: UserSettings) => void;
  setActiveTab: (tab: SettingsTab) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSaving: (saving: boolean) => void;
  updateSettings: (updates: Partial<UserSettings>) => void;
  reset: () => void;
}

const initialState = {
  settings: null,
  activeTab: 'account' as SettingsTab,
  isLoading: false,
  error: null,
  isSaving: false,
};

export const useSettingsStore = create<SettingsState>((set) => ({
  ...initialState,

  setSettings: (settings) => set({ settings }),

  setActiveTab: (activeTab) => set({ activeTab }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  setSaving: (isSaving) => set({ isSaving }),

  updateSettings: (updates) =>
    set((state) => ({
      settings: state.settings ? { ...state.settings, ...updates } : null,
    })),

  reset: () => set(initialState),
}));

