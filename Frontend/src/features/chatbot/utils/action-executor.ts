/**
 * Action Executor for Chatbot Page Control
 *
 * Executes parsed actions by controlling the pricing wizard store.
 * Actions are executed with small delays for smooth UX.
 */

import { useWizardStore, type SelectedItem } from '@/features/pricing/stores/wizard-store';
import { useChatStore } from '../stores/chat-store';
import {
  getCategoryByServiceSlug,
  getAllServiceSlugs,
} from '@/features/pricing/constants/categories';
import type { ChatAction } from './action-parser';

/**
 * Find the closest matching service slug using fuzzy matching.
 * Handles cases where AI generates shortened or slightly wrong slugs.
 */
function findClosestServiceSlug(inputSlug: string): string | null {
  const allSlugs = getAllServiceSlugs();
  const inputLower = inputSlug.toLowerCase();

  // 1. Exact match
  const exact = allSlugs.find((s) => s === inputSlug);
  if (exact) return exact;

  // 2. Contains match - input is substring of valid slug
  const containsMatch = allSlugs.find((s) => s.includes(inputLower));
  if (containsMatch) return containsMatch;

  // 3. Reverse contains - valid slug is substring of input
  const reverseMatch = allSlugs.find((s) => inputLower.includes(s));
  if (reverseMatch) return reverseMatch;

  // 4. Starts-with match
  const startsMatch = allSlugs.find((s) => s.startsWith(inputLower));
  if (startsMatch) return startsMatch;

  return null;
}

/**
 * Auto-minimize chat panel on mobile after AI navigation
 */
function autoMinimizeChatOnMobile() {
  if (typeof window !== 'undefined' && window.innerWidth < 768) {
    setTimeout(() => {
      useChatStore.getState().setOpen(false);
    }, 1200); // 1.2s delay so user can read AI message
  }
}

/**
 * Execute multiple actions with delays between them for smooth UX
 */
export function executeActions(actions: ChatAction[]): void {
  actions.forEach((action, index) => {
    setTimeout(() => {
      try {
        executeAction(action);
      } catch (error) {
        console.error('Failed to execute chatbot action:', action, error);
      }
    }, index * 500); // 500ms between actions
  });
}

/**
 * Focus on a specific tier card by scrolling to it and highlighting it
 */
function focusOnTier(tierName: string): void {
  // Find tier card by exact data attribute match
  let tierCard = document.querySelector(`[data-tier-name="${tierName}"]`);

  // If not found, try partial match
  if (!tierCard) {
    tierCard = findTierCardByPartialMatch(tierName);
  }

  if (tierCard) {
    // Scroll into view
    tierCard.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Add highlight animation
    tierCard.classList.add('tier-highlight');

    // Remove highlight after 3 seconds
    setTimeout(() => {
      tierCard?.classList.remove('tier-highlight');
    }, 3000);
  }
}

/**
 * Find tier card by partial match when exact match fails
 */
function findTierCardByPartialMatch(tierName: string): Element | null {
  const allTierCards = document.querySelectorAll('[data-tier-name]');
  const searchLower = tierName.toLowerCase();

  for (const card of allTierCards) {
    const name = card.getAttribute('data-tier-name') || '';
    const nameLower = name.toLowerCase();

    // Check if either contains the other
    if (nameLower.includes(searchLower) || searchLower.includes(nameLower)) {
      return card;
    }
  }
  return null;
}

/**
 * Execute a single action
 */
export function executeAction(action: ChatAction): void {
  const wizardStore = useWizardStore.getState();

  switch (action.type) {
    case 'NAVIGATE': {
      const step = parseInt(action.params.step, 10);
      if (step >= 1 && step <= 4) {
        wizardStore.goToStep(step);
        autoMinimizeChatOnMobile();
      }
      break;
    }

    case 'SHOW_SERVICE': {
      let slug = action.params.slug;
      const tierName = action.params.tier; // Optional tier to focus

      if (slug) {
        // Try fuzzy matching if slug doesn't match exactly
        let category = getCategoryByServiceSlug(slug);
        if (!category) {
          const correctedSlug = findClosestServiceSlug(slug);
          if (correctedSlug) {
            console.warn(`[Chatbot] Corrected slug "${slug}" → "${correctedSlug}"`);
            slug = correctedSlug;
            category = getCategoryByServiceSlug(slug);
          }
        }

        // CHECK: Are we already showing this service? Skip navigation to avoid annoying flash/reset
        const currentState = useWizardStore.getState();
        if (currentState.currentStep === 3 && currentState.selectedServiceSlug === slug) {
          // Already on the correct service — skip navigation
          // Set AI highlight for the service and tier
          const highlightIds = [slug];
          if (tierName) highlightIds.push(tierName);
          wizardStore.setAIHighlightedIds(highlightIds);

          // If tier specified, focus on it
          if (tierName) {
            setTimeout(() => {
              focusOnTier(tierName);
            }, 300);
          } else {
            // Optionally scroll to top of tier section for better UX
            const tierSection = document.querySelector('[data-tier-section]');
            if (tierSection) {
              tierSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }
          autoMinimizeChatOnMobile();
          break;
        }

        // Find the category that contains this service
        if (category) {
          // IMPORTANT: Reset to step 1 first to clear any existing selection
          // This fixes the bug where switching services while already on step 3
          // would not update the displayed service
          wizardStore.goToStep(1);

          // Then select the category after a short delay (navigates to step 2)
          setTimeout(() => {
            wizardStore.selectCategory(category!.id);
            // Then select the service after another delay (navigates to step 3)
            setTimeout(() => {
              wizardStore.selectService(slug);

              // Set AI highlight for the service and tier
              const highlightIds = [slug];
              if (tierName) highlightIds.push(tierName);
              wizardStore.setAIHighlightedIds(highlightIds);

              // After navigation completes, focus on specific tier if provided
              if (tierName) {
                setTimeout(() => {
                  focusOnTier(tierName);
                }, 800); // Wait for navigation + render
              }
              autoMinimizeChatOnMobile();
            }, 300);
          }, 100);
        } else {
          // If no category found even after fuzzy matching, log warning
          console.warn(`[Chatbot] No service found for slug: "${slug}"`);
          // Still try to select the service directly as fallback
          wizardStore.selectService(slug);
          wizardStore.setAIHighlightedIds([slug]);

          // Still try to focus on tier if provided
          if (tierName) {
            setTimeout(() => {
              focusOnTier(tierName);
            }, 800);
          }
          autoMinimizeChatOnMobile();
        }
      }
      break;
    }

    case 'SELECT_SERVICE': {
      let slug = action.params.slug;
      if (slug) {
        // Try fuzzy matching if slug doesn't match exactly
        if (!getCategoryByServiceSlug(slug)) {
          const correctedSlug = findClosestServiceSlug(slug);
          if (correctedSlug) {
            console.warn(`[Chatbot] Corrected slug "${slug}" → "${correctedSlug}"`);
            slug = correctedSlug;
          }
        }
        wizardStore.selectService(slug);
        wizardStore.setAIHighlightedIds([slug]);
        autoMinimizeChatOnMobile();
      }
      break;
    }

    case 'SELECT_TIER': {
      let slug = action.params.slug;
      const tierName = action.params.tier;
      if (slug && tierName) {
        // Try fuzzy matching if slug doesn't match exactly
        let category = getCategoryByServiceSlug(slug);
        if (!category) {
          const correctedSlug = findClosestServiceSlug(slug);
          if (correctedSlug) {
            console.warn(`[Chatbot] Corrected slug "${slug}" → "${correctedSlug}"`);
            slug = correctedSlug;
            category = getCategoryByServiceSlug(slug);
          }
        }

        if (category) {
          wizardStore.selectCategory(category.id);
          setTimeout(() => {
            wizardStore.selectService(slug);
            // Set AI highlight for the tier
            wizardStore.setAIHighlightedIds([tierName]);
            // Focus on the tier after navigation
            setTimeout(() => {
              focusOnTier(tierName);
            }, 800);
            autoMinimizeChatOnMobile();
          }, 300);
        } else {
          console.warn(`[Chatbot] No service found for slug: "${slug}"`);
        }
      }
      break;
    }

    default:
      console.warn('Unknown chatbot action type:', action.type);
  }
}

