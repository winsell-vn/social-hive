'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X, Star, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PricingTier } from '@/types/pricing';
import { formatVNDPrice } from '../utils';

interface PricingCardProps {
  tier: PricingTier;
  onSelect?: (tier: PricingTier) => void;
}

export function PricingCard({ tier, onSelect }: PricingCardProps) {
  const isHighlighted = tier.isPopular || tier.isRecommended;

  return (
    <Card
      className={cn(
        'relative flex flex-col h-full transition-all duration-300 hover:shadow-xl',
        isHighlighted && 'border-rose-500 shadow-lg scale-105 z-10',
        tier.isPopular && 'ring-2 ring-rose-500'
      )}
    >
      {/* Badges */}
      {tier.isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-rose-500 text-white px-4 py-1">
            <Star className="w-3 h-3 mr-1" />
            Phổ biến nhất
          </Badge>
        </div>
      )}
      {tier.isRecommended && !tier.isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-emerald-500 text-white px-4 py-1">
            <Sparkles className="w-3 h-3 mr-1" />
            Được đề xuất
          </Badge>
        </div>
      )}

      <CardHeader className="text-center pt-8 pb-4">
        <h3 className="text-xl font-bold mb-2">{tier.name}</h3>
        {tier.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {tier.description}
          </p>
        )}
        <div className="mt-4">
          <span className="text-4xl font-bold">
            {formatVNDPrice(tier.price)}
          </span>
          {tier.priceNote && (
            <span className="text-sm text-gray-500 ml-1">
              {tier.priceNote}
            </span>
          )}
          <div className="text-sm text-gray-500 mt-1">
            {tier.billingType === 'monthly' && '/ tháng'}
            {tier.billingType === 'yearly' && '/ năm'}
            {tier.billingType === 'one-time' && '(một lần)'}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 px-6">
        <ul className="space-y-3">
          {tier.features.map((feature, index) => {
            const isExcluded = feature.startsWith('!');
            const featureText = isExcluded ? feature.slice(1) : feature;
            
            return (
              <li key={index} className="flex items-start gap-3">
                {isExcluded ? (
                  <X className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
                ) : (
                  <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                )}
                <span className={cn(
                  'text-sm',
                  isExcluded && 'text-gray-400 line-through'
                )}>
                  {featureText}
                </span>
              </li>
            );
          })}
        </ul>
      </CardContent>

      <CardFooter className="p-6 pt-4">
        <Button
          className={cn(
            'w-full',
            isHighlighted 
              ? 'bg-rose-500 hover:bg-rose-600 text-white' 
              : 'bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100'
          )}
          onClick={() => onSelect?.(tier)}
        >
          {tier.ctaText}
        </Button>
      </CardFooter>
    </Card>
  );
}

