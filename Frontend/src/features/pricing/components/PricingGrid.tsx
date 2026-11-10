'use client';

import type { PricingTier } from '@/types/pricing';
import { PricingCard } from './PricingCard';

interface PricingGridProps {
  tiers: PricingTier[];
  onSelectTier?: (tier: PricingTier) => void;
}

export function PricingGrid({ tiers, onSelectTier }: PricingGridProps) {
  if (!tiers || tiers.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        Chưa có gói giá nào được cấu hình cho dịch vụ này.
      </div>
    );
  }

  // Sort by displayOrder
  const sortedTiers = [...tiers].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4">
      {sortedTiers.map((tier) => (
        <PricingCard
          key={tier.id}
          tier={tier}
          onSelect={onSelectTier}
        />
      ))}
    </div>
  );
}

