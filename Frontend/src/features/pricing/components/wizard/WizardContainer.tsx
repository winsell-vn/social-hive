'use client';

import { useEffect, useReducer, useRef } from 'react';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { usePublicPricing, usePublicCategories } from '../../api/pricing';
import { useWizardStore } from '../../stores/wizard-store';
import { WizardProgress } from './WizardProgress';
import { WizardNavigation } from './WizardNavigation';
import { QuoteSummary } from './QuoteSummary';
import { Step1Category } from './Step1Category';
import { Step2Service } from './Step2Service';
import { Step3Tier } from './Step3Tier';
import { Step4Quote } from './Step4Quote';

// Hash helpers for browser back/forward navigation
const STEP_HASH_PREFIX = 'buoc-';
const getStepFromHash = (): number | null => {
  const hash = window.location.hash.replace('#', '');
  if (hash.startsWith(STEP_HASH_PREFIX)) {
    const step = parseInt(hash.replace(STEP_HASH_PREFIX, ''), 10);
    if (step >= 1 && step <= 4) return step;
  }
  return null;
};
const setStepHash = (step: number) => {
  const newHash = `#${STEP_HASH_PREFIX}${step}`;
  if (window.location.hash !== newHash) {
    window.location.hash = newHash;
  }
};

// Animation variants for step transitions
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
};

const transition = {
  duration: 0.3,
  ease: 'easeInOut',
};

export function WizardContainer() {
  const { data: pricingData, isLoading: isPricingLoading, error: pricingError, refetch: refetchPricing } = usePublicPricing();
  const { data: categoriesData, isLoading: isCategoriesLoading, error: categoriesError, refetch: refetchCategories } = usePublicCategories();
  const { currentStep, direction, selectedItems, isQuoteSubmitted, isSubmitting, aiHighlightedIds, clearAIHighlights } = useWizardStore();

  // Flag to prevent infinite loop: hash change → store update → hash change
  const isHandlingHashChange = useRef(false);

  // Force re-render on hydration to sync with sessionStorage
  const [, forceUpdate] = useReducer((x) => x + 1, 0);
  useEffect(() => {
    forceUpdate();
  }, []);

  // Auto-dismiss AI highlights after 10 seconds
  useEffect(() => {
    if (aiHighlightedIds.length > 0) {
      const timer = setTimeout(() => {
        clearAIHighlights();
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [aiHighlightedIds, clearAIHighlights]);

  // Initialize hash on mount and listen for hash changes (browser back/forward)
  useEffect(() => {
    // Set initial hash based on current step
    const hashStep = getStepFromHash();
    if (hashStep === null) {
      // No hash yet — set it to current step without triggering navigation
      window.history.replaceState(null, '', `#${STEP_HASH_PREFIX}${currentStep}`);
    } else if (hashStep !== currentStep) {
      // Hash exists but doesn't match store — sync store to hash
      useWizardStore.getState().goToStep(hashStep);
    }

    const handleHashChange = () => {
      if (isHandlingHashChange.current) return;
      const step = getStepFromHash();
      if (step !== null) {
        const { currentStep } = useWizardStore.getState();
        if (step !== currentStep) {
          isHandlingHashChange.current = true;
          useWizardStore.getState().goToStep(step);
          isHandlingHashChange.current = false;
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update hash when step changes (from wizard UI navigation)
  useEffect(() => {
    if (!isHandlingHashChange.current) {
      isHandlingHashChange.current = true;
      setStepHash(currentStep);
      isHandlingHashChange.current = false;
    }
  }, [currentStep]);

  const services = pricingData?.services || [];
  const categories = categoriesData || [];

  // Combined loading state
  const isLoading = isPricingLoading || isCategoriesLoading;
  const hasError = pricingError || categoriesError;

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-sky-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-sky-500 mx-auto mb-4" />
          <p className="text-slate-500">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (hasError) {
    return (
      <div className="min-h-screen bg-sky-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-sky-950 mb-2">Không thể tải dữ liệu</h2>
          <p className="text-slate-500 mb-6">
            Đã xảy ra lỗi khi tải thông tin bảng giá. Vui lòng thử lại.
          </p>
          <Button onClick={() => { refetchPricing(); refetchCategories(); }} className="bg-sky-500 hover:bg-sky-600">
            <RefreshCw className="w-4 h-4 mr-2" />
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  // Render current step
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1Category categories={categories} services={services} />;
      case 2:
        return <Step2Service services={services} categories={categories} />;
      case 3:
        return <Step3Tier services={services} />;
      case 4:
        return <Step4Quote />;
      default:
        return <Step1Category categories={categories} services={services} />;
    }
  };

  return (
    <div className="min-h-screen bg-sky-50">
      {/* Progress indicator */}
      <WizardProgress />

      {/* Main content area */}
      <div className="flex">
        {/* Step content */}
        <div className={cn(
          "flex-1",
          selectedItems.length > 0 ? "pb-[200px]" : "pb-[120px]",
          "lg:pb-24"
        )}>
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={transition}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Quote summary sidebar - Desktop only (hidden on Step 4 which has its own) */}
        {currentStep !== 4 && (
          <div className="hidden lg:block w-96 p-6">
            <QuoteSummary />
          </div>
        )}
      </div>

      {/* Mobile quote summary */}
      {selectedItems.length > 0 && !isQuoteSubmitted && <QuoteSummary compact />}

      {/* Bottom navigation */}
      {!isQuoteSubmitted && <WizardNavigation isSubmitting={isSubmitting} />}
    </div>
  );
}

