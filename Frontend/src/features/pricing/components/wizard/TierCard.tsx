'use client';

import { useState } from 'react';
import { Check, Star, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatVNDPrice } from '../../utils';
import type { PricingTier } from '@/types/pricing';

/** Maximum number of features to show before "show more" button */
export const MAX_VISIBLE_FEATURES = 6;

export interface TierCardProps {
  tier: PricingTier;
  isSelected: boolean;
  isAIRecommended?: boolean;
  onSelect: () => void;
  /** 'interactive' (default) = hover/click effects, 'export' = static for image export */
  variant?: 'interactive' | 'export';
}

export function TierCard({
  tier,
  isSelected,
  isAIRecommended = false,
  onSelect,
  variant = 'interactive',
}: TierCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isHighlighted = tier.isPopular || tier.isRecommended;
  const isExport = variant === 'export';

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isExport) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect();
    }
  };

  const handleClick = () => {
    if (isExport) return;
    onSelect();
  };

  return (
    <div
      data-tier-name={tier.name}
      data-tier-id={tier.id}
      role={isExport ? undefined : 'option'}
      aria-selected={isExport ? undefined : isSelected}
      aria-label={
        isExport
          ? undefined
          : `${tier.name} - ${formatVNDPrice(tier.price)}${tier.priceNote ? ` ${tier.priceNote}` : ''}`
      }
      tabIndex={isExport ? undefined : 0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        'relative flex flex-col h-full transition-all duration-300 rounded-lg border bg-white text-gray-900',
        !isExport && 'hover:shadow-xl hover:scale-[1.02]',
        !isExport && 'cursor-pointer focus:outline-none focus:ring-4 focus:ring-sky-200',
        isHighlighted ? 'border-sky-500 shadow-lg' : 'border-gray-200',
        tier.isPopular && 'ring-2 ring-sky-500',
        isSelected && !isExport && 'ring-4 ring-emerald-200 border-emerald-500',
        isAIRecommended &&
          !isExport &&
          'border-[3px] border-amber-500 shadow-[0_0_0_4px_rgba(245,158,11,0.15)] animate-ai-pulse'
      )}
    >
      {/* AI Recommendation Badge */}
      {isAIRecommended && !isExport && (
        <div className="absolute top-3 right-3 z-20">
          <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center shadow-md">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
        </div>
      )}

      {/* Badges */}
      {tier.isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <Badge className="bg-sky-500 text-white px-4 py-1">
            <Star className="w-3 h-3 mr-1" />
            Phổ biến nhất
          </Badge>
        </div>
      )}
      {tier.isRecommended && !tier.isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <Badge className="bg-emerald-500 text-white px-4 py-1">
            <Sparkles className="w-3 h-3 mr-1" />
            Được đề xuất
          </Badge>
        </div>
      )}

      <div className="flex flex-col space-y-1.5 p-4 text-center pt-8 pb-4">
        <h3 className="text-xl font-bold text-sky-950 mb-2">{tier.name}</h3>
        {tier.description && (
          <p className="text-sm text-slate-500">{tier.description}</p>
        )}
        <div className="mt-4">
          <span className="text-3xl font-bold text-sky-600">
            {formatVNDPrice(tier.price)}
          </span>
          {tier.priceNote && (
            <span className="text-sm text-slate-500 ml-1">{tier.priceNote}</span>
          )}
          <div className="text-sm text-slate-500 mt-1">
            {tier.billingType === 'monthly' && '/ tháng'}
            {tier.billingType === 'yearly' && '/ năm'}
            {tier.billingType === 'one-time' && '(một lần)'}
          </div>
        </div>
      </div>

      <div className="flex-1 px-6 p-4 pt-0">
        <ul className="space-y-2">
          {(isExpanded ? tier.features : tier.features.slice(0, MAX_VISIBLE_FEATURES)).map(
            (feature, index) => {
              const isExcluded = feature.startsWith('!');
              const featureText = isExcluded ? feature.slice(1) : feature;
              return (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                  {isExcluded ? (
                    <span className="w-4 h-4 text-gray-300 flex-shrink-0">✕</span>
                  ) : (
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  )}
                  <span className={cn(isExcluded && 'text-gray-400 line-through')}>
                    {featureText}
                  </span>
                </li>
              );
            }
          )}
        </ul>
        {tier.features.length > MAX_VISIBLE_FEATURES && !isExport && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.stopPropagation();
              }
            }}
            className="mt-2 flex items-center gap-1 text-sm text-sky-500 hover:text-sky-600 transition-colors cursor-pointer font-medium"
          >
            {isExpanded ? (
              <>
                Thu gọn
                <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                +{tier.features.length - MAX_VISIBLE_FEATURES} tính năng khác
                <ChevronDown className="w-4 h-4" />
              </>
            )}
          </button>
        )}
      </div>

      {/* CTA Button - only show for interactive variant */}
      {!isExport && (
        <div className="flex items-center p-6 pt-4">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.stopPropagation();
              }
            }}
            className={cn(
              'w-full min-h-[48px] transition-all',
              isSelected
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                : isHighlighted
                  ? 'bg-sky-500 hover:bg-sky-600 text-white'
                  : 'bg-sky-100 hover:bg-sky-200 text-sky-700'
            )}
          >
            {isSelected ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Đã chọn
              </>
            ) : (
              tier.ctaText || 'Chọn gói này'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
