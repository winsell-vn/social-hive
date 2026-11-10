'use client';

import { Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useWizardStore } from '../../stores/wizard-store';
import { ICON_MAP, DEFAULT_ICON } from '../../constants';
import type { PublicCategory } from '@/types/pricing';

interface CategoryCardProps {
  category: PublicCategory;
  isSelected?: boolean;
  onClick?: () => void;
}

export function CategoryCard({
  category,
  isSelected = false,
  onClick,
}: CategoryCardProps) {
  const IconComponent = ICON_MAP[category.icon || ''] || DEFAULT_ICON;
  const serviceCount = category._count?.services ?? 0;
  const aiHighlightedIds = useWizardStore((s) => s.aiHighlightedIds);
  const clearAIHighlights = useWizardStore((s) => s.clearAIHighlights);
  const isAIRecommended = aiHighlightedIds.includes(category.id);

  // Detect combo card by slug
  const isComboCard =
    category.slug?.startsWith('combo-') ||
    category.slug === 'combo-tiet-kiem-cat';

  const handleClick = () => {
    clearAIHighlights();
    onClick?.();
  };

  // Border class priority: selected > AI recommended > combo > default
  const getBorderClass = () => {
    if (isSelected) {
      return 'border-sky-500 ring-4 ring-sky-100 bg-sky-50';
    }
    if (isAIRecommended) {
      return 'border-[3px] border-amber-500 shadow-[0_0_0_4px_rgba(245,158,11,0.15)] animate-ai-pulse';
    }
    if (isComboCard) {
      return 'border-[3px] border-amber-600 animate-golden-shimmer bg-white';
    }
    return 'border-sky-100 hover:border-sky-400 bg-white';
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'relative p-6 text-left cursor-pointer transition-all duration-300',
        'rounded-lg border-2 hover:shadow-xl hover:scale-[1.02]',
        'focus:outline-none focus:ring-4 focus:ring-sky-200',
        'flex flex-col w-full min-h-[180px]',
        getBorderClass()
      )}
      role="option"
      aria-selected={isSelected}
    >
      {/* AI Recommendation Badge */}
      {isAIRecommended && (
        <div className="absolute top-3 left-3 z-20">
          <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center shadow-md">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
        </div>
      )}

      {/* Icon */}
      <div
        className={cn(
          'w-16 h-16 rounded-xl flex items-center justify-center mb-4 transition-colors',
          isSelected ? 'bg-sky-500 text-white' : 'bg-sky-100 text-sky-600'
        )}
      >
        <IconComponent className="w-8 h-8" aria-hidden="true" />
      </div>

      {/* Content */}
      <div className="flex-1">
        <h3 className="text-lg font-bold text-sky-950 mb-2">{category.name}</h3>
        <p className="text-sm text-slate-500 line-clamp-2">
          {category.description || ''}
        </p>
      </div>

      {/* Service count badge */}
      <Badge
        variant="secondary"
        className={cn(
          'absolute top-4 right-4 transition-colors',
          isSelected ? 'bg-sky-500 text-white' : 'bg-sky-100 text-sky-700'
        )}
      >
        {serviceCount} dịch vụ
      </Badge>

      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute bottom-4 right-4">
          <div className="w-6 h-6 rounded-full bg-sky-500 flex items-center justify-center">
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>
      )}
    </button>
  );
}

