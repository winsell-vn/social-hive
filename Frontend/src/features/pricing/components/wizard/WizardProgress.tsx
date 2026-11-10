'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWizardStore } from '../../stores/wizard-store';

const STEPS = [
  { number: 1, label: 'Danh mục' },
  { number: 2, label: 'Dịch vụ' },
  { number: 3, label: 'Gói giá' },
  { number: 4, label: 'Báo giá' },
];

export function WizardProgress() {
  const { currentStep, goToStep, selectedCategoryId, selectedServiceSlug } = useWizardStore();

  const canNavigateToStep = (step: number): boolean => {
    if (step === 1) return true;
    if (step === 2) return !!selectedCategoryId;
    if (step === 3) return !!selectedServiceSlug;
    if (step === 4) return !!selectedServiceSlug;
    return false;
  };

  return (
    <nav
      className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-sky-100 py-4 px-4"
      aria-label="Tiến trình wizard"
    >
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => {
            const isCompleted = currentStep > step.number;
            const isActive = currentStep === step.number;
            const canNavigate = canNavigateToStep(step.number);

            return (
              <div key={step.number} className="flex items-center flex-1">
                {/* Step circle */}
                <button
                  type="button"
                  onClick={() => canNavigate && goToStep(step.number)}
                  disabled={!canNavigate}
                  className={cn(
                    'relative flex items-center justify-center w-11 h-11 rounded-full text-sm font-semibold transition-all duration-300',
                    'focus:outline-none focus:ring-4 focus:ring-sky-200',
                    isCompleted && 'bg-emerald-500 text-white',
                    isActive && 'bg-sky-500 text-white ring-4 ring-sky-100',
                    !isCompleted && !isActive && 'bg-gray-200 text-gray-500',
                    canNavigate && !isActive && 'cursor-pointer hover:scale-105',
                    !canNavigate && 'cursor-not-allowed'
                  )}
                  aria-label={`${step.label} - Bước ${step.number}`}
                  aria-current={isActive ? 'step' : undefined}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" aria-hidden="true" />
                  ) : (
                    step.number
                  )}
                </button>

                {/* Step label - hidden on mobile */}
                <span
                  className={cn(
                    'hidden md:block ml-3 text-sm font-medium transition-colors',
                    isActive && 'text-sky-700',
                    isCompleted && 'text-emerald-600',
                    !isActive && !isCompleted && 'text-gray-500'
                  )}
                >
                  {step.label}
                </span>

                {/* Connector line between steps */}
                {index < STEPS.length - 1 && (
                  <div className="relative h-1 flex-1 mx-2 md:mx-4">
                    {/* Background line */}
                    <div className="absolute inset-0 bg-gray-200 rounded-full" />
                    {/* Progress line */}
                    <div
                      className="absolute inset-y-0 left-0 bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: currentStep > step.number ? '100%' : '0%' }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

