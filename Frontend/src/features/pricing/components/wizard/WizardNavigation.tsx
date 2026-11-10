'use client';

import { ArrowLeft, ArrowRight, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useWizardStore } from '../../stores/wizard-store';

interface WizardNavigationProps {
  isSubmitting?: boolean;
  canProceed?: boolean;
}

export function WizardNavigation({
  isSubmitting = false,
  canProceed = true,
}: WizardNavigationProps) {
  const { currentStep, goBack, goNext, selectedCategoryId, selectedServiceSlug, selectedItems } =
    useWizardStore();

  const isStep1 = currentStep === 1;
  const isStep4 = currentStep === 4;

  // Determine if user can proceed to next step
  const canGoNext = (): boolean => {
    if (!canProceed) return false;
    switch (currentStep) {
      case 1:
        return !!selectedCategoryId;
      case 2:
        return !!selectedServiceSlug;
      case 3:
        return selectedItems.length > 0;
      case 4:
        return true; // Form validation handles this
      default:
        return false;
    }
  };

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'bg-white/95 backdrop-blur-sm border-t border-sky-100',
        'py-4 px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]'
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Back button */}
        <Button
          type="button"
          variant="outline"
          onClick={goBack}
          disabled={isStep1 || isSubmitting}
          className={cn(
            'min-h-[48px] px-6 transition-all',
            'border-sky-200 text-sky-700 hover:bg-sky-50 hover:border-sky-300',
            'focus:ring-4 focus:ring-sky-200 focus:outline-none',
            isStep1 && 'invisible'
          )}
          aria-label="Quay lại bước trước"
        >
          <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
          <span className="hidden sm:inline">Quay lại</span>
          <span className="sm:hidden">Trở lại</span>
        </Button>

        {/* Step indicator for mobile */}
        <div className="flex-1 text-center md:hidden">
          <span className="text-sm text-slate-500">
            Bước {currentStep}/4
          </span>
        </div>

        {/* Next/Submit button */}
        {isStep4 ? (
          // Step 4: Use form attribute to connect to quote-form
          <Button
            type="submit"
            form="quote-form"
            disabled={!canGoNext() || isSubmitting}
            className={cn(
              'min-h-[48px] px-6 transition-all',
              'focus:ring-4 focus:ring-sky-200 focus:outline-none',
              'bg-orange-500 hover:bg-orange-600 text-white'
            )}
            aria-label="Gửi yêu cầu báo giá"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                Đang gửi...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" aria-hidden="true" />
                <span className="hidden sm:inline">Gửi yêu cầu báo giá</span>
                <span className="sm:hidden">Gửi</span>
              </>
            )}
          </Button>
        ) : (
          // Steps 1-3: Regular next button
          <Button
            type="button"
            onClick={goNext}
            disabled={!canGoNext() || isSubmitting}
            className={cn(
              'min-h-[48px] px-6 transition-all',
              'focus:ring-4 focus:ring-sky-200 focus:outline-none',
              'bg-sky-500 hover:bg-sky-600 text-white'
            )}
            aria-label="Tiếp tục bước tiếp theo"
          >
            <span className="hidden sm:inline">Tiếp tục</span>
            <span className="sm:hidden">Tiếp</span>
            <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
          </Button>
        )}
      </div>
    </div>
  );
}

