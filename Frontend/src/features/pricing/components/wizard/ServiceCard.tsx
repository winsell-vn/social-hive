'use client';

import { Check, Star, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useWizardStore } from '../../stores/wizard-store';
import type { Service, PricingTier } from '@/types/pricing';

interface ServiceCardProps {
  service: Service & { pricingTiers?: PricingTier[] };
  isSelected?: boolean;
  onClick?: () => void;
}

export function ServiceCard({ service, isSelected = false, onClick }: ServiceCardProps) {
  const hasPopularTier = service.pricingTiers?.some((tier) => tier.isPopular);
  const tierCount = service.pricingTiers?.length || 0;
  const aiHighlightedIds = useWizardStore((s) => s.aiHighlightedIds);
  const clearAIHighlights = useWizardStore((s) => s.clearAIHighlights);
  const isAIRecommended = aiHighlightedIds.includes(service.slug);

  const handleClick = () => {
    clearAIHighlights();
    onClick?.();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'relative w-full p-4 text-left cursor-pointer transition-all duration-200',
        'rounded-lg border-2 hover:shadow-md',
        'focus:outline-none focus:ring-4 focus:ring-sky-200',
        'flex items-center gap-4',
        isSelected
          ? 'border-sky-500 bg-sky-50'
          : 'border-sky-100 hover:border-sky-300 bg-white',
        isAIRecommended && 'border-[3px] border-amber-500 shadow-[0_0_0_4px_rgba(245,158,11,0.15)] animate-ai-pulse'
      )}
      role="option"
      aria-selected={isSelected}
    >
      {/* AI Recommendation Badge */}
      {isAIRecommended && (
        <div className="absolute -top-2 -left-2 z-20">
          <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center shadow-md">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
        </div>
      )}

      {/* Radio indicator */}
      <div
        className={cn(
          'w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors',
          isSelected
            ? 'border-sky-500 bg-sky-500'
            : 'border-gray-300 bg-white'
        )}
        aria-hidden="true"
      >
        {isSelected && <Check className="w-4 h-4 text-white" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold text-sky-950 truncate">{service.name}</h3>
          {hasPopularTier && (
            <Badge className="bg-amber-100 text-amber-700 text-xs flex-shrink-0">
              <Star className="w-3 h-3 mr-1" />
              Phổ biến
            </Badge>
          )}
        </div>
        {service.description && (
          <p className="text-sm text-slate-500 line-clamp-1">{service.description}</p>
        )}
      </div>

      {/* Tier count */}
      <div className="flex-shrink-0 text-right">
        <span className="text-sm text-slate-400">{tierCount} gói</span>
      </div>
    </button>
  );
}

