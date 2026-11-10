'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface SelectedItem {
  serviceId: string;
  serviceName: string;
  serviceSlug: string;
  tierId: string;
  tierName: string;
  price: number;
  priceNote: string | null;
}

interface WizardState {
  currentStep: number;
  selectedCategoryId: string | null;
  selectedServiceSlug: string | null;
  selectedItems: SelectedItem[];
  direction: number; // 1 for forward, -1 for backward (for animations)
  isQuoteSubmitted: boolean;
  isSubmitting: boolean;
  aiHighlightedIds: string[]; // IDs of cards highlighted by AI recommendation
  isQuoteSummaryExpanded: boolean; // Mobile QuoteSummary expansion state

  // Actions
  setStep: (step: number) => void;
  selectCategory: (categoryId: string) => void;
  selectService: (serviceSlug: string) => void;
  addItem: (item: SelectedItem) => void;
  removeItem: (tierId: string) => void;
  clearItems: () => void;
  reset: () => void;
  goBack: () => void;
  goNext: () => void;
  goToStep: (step: number) => void;
  setQuoteSubmitted: (submitted: boolean) => void;
  setSubmitting: (submitting: boolean) => void;
  setAIHighlightedIds: (ids: string[]) => void;
  clearAIHighlights: () => void;
  setQuoteSummaryExpanded: (expanded: boolean) => void;
}

const initialState = {
  currentStep: 1,
  selectedCategoryId: null,
  selectedServiceSlug: null,
  selectedItems: [],
  direction: 1,
  isQuoteSubmitted: false,
  isSubmitting: false,
  aiHighlightedIds: [] as string[],
  isQuoteSummaryExpanded: false,
};

export const useWizardStore = create<WizardState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setStep: (step) =>
        set((state) => ({
          currentStep: Math.max(1, Math.min(4, step)),
          direction: step > state.currentStep ? 1 : -1,
          aiHighlightedIds: [],
        })),

      selectCategory: (categoryId) =>
        set({
          selectedCategoryId: categoryId,
          selectedServiceSlug: null,
          currentStep: 2,
          direction: 1,
          aiHighlightedIds: [],
        }),

      selectService: (serviceSlug) =>
        set({
          selectedServiceSlug: serviceSlug,
          currentStep: 3,
          direction: 1,
          aiHighlightedIds: [],
        }),

      addItem: (item) =>
        set((state) => ({
          selectedItems: [
            ...state.selectedItems.filter((i) => i.tierId !== item.tierId),
            item,
          ],
        })),

      removeItem: (tierId) =>
        set((state) => ({
          selectedItems: state.selectedItems.filter((i) => i.tierId !== tierId),
        })),

      clearItems: () => set({ selectedItems: [] }),

      reset: () => set(initialState),

      goBack: () => {
        const { currentStep } = get();
        if (currentStep > 1) {
          set({ currentStep: currentStep - 1, direction: -1, aiHighlightedIds: [] });
        }
      },

      goNext: () => {
        const { currentStep } = get();
        if (currentStep < 4) {
          set({ currentStep: currentStep + 1, direction: 1, aiHighlightedIds: [] });
        }
      },

      goToStep: (step) => {
        const { currentStep } = get();
        const newStep = Math.max(1, Math.min(4, step));
        set({
          currentStep: newStep,
          direction: newStep > currentStep ? 1 : -1,
          aiHighlightedIds: [],
        });
      },

      setQuoteSubmitted: (submitted) => set({ isQuoteSubmitted: submitted }),

      setSubmitting: (submitting) => set({ isSubmitting: submitting }),

      setAIHighlightedIds: (ids) => set({ aiHighlightedIds: ids }),

      clearAIHighlights: () => set({ aiHighlightedIds: [] }),

      setQuoteSummaryExpanded: (expanded) => set({ isQuoteSummaryExpanded: expanded }),
    }),
    {
      name: 'pricing-wizard',
      storage: createJSONStorage(() => sessionStorage),
      skipHydration: true, // Skip hydration during SSR to avoid prerender issues
      partialize: (state) => {
        // Exclude aiHighlightedIds, isSubmitting, and isQuoteSummaryExpanded from persistence
        const { aiHighlightedIds, isSubmitting, isQuoteSummaryExpanded, ...rest } = state;
        return rest;
      },
    }
  )
);

/**
 * Calculate total price from selected items
 */
export function calculateTotal(items: SelectedItem[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

