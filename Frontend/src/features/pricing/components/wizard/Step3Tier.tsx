'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWizardStore, type SelectedItem } from '../../stores/wizard-store';
import { TierCard } from './TierCard';
import type { Service, PricingTier } from '@/types/pricing';

interface Step3TierProps {
  services: Array<Service & { pricingTiers: PricingTier[] }>;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export function Step3Tier({ services }: Step3TierProps) {
  const { selectedServiceSlug, addItem, selectedItems, goBack, goNext, aiHighlightedIds, clearAIHighlights } = useWizardStore();

  const selectedService = services.find((s) => s.slug === selectedServiceSlug);
  const tiers = selectedService?.pricingTiers || [];
  const sortedTiers = [...tiers].sort((a, b) => a.displayOrder - b.displayOrder);

  // Check if a tier is already selected
  const isSelected = (tierId: string) => selectedItems.some((item) => item.tierId === tierId);

  // Check if a tier is AI recommended
  const isAIRecommended = (tier: PricingTier) =>
    aiHighlightedIds.includes(tier.id) || aiHighlightedIds.includes(tier.name);

  const handleSelectTier = (tier: PricingTier) => {
    if (!selectedService) return;
    clearAIHighlights();
    const item: SelectedItem = {
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      serviceSlug: selectedService.slug,
      tierId: tier.id,
      tierName: tier.name,
      price: parseFloat(tier.price),
      priceNote: tier.priceNote,
    };
    addItem(item);
  };

  if (!selectedService) {
    return (
      <div className="py-8 px-4 text-center">
        <p className="text-slate-500">Vui lòng chọn dịch vụ trước</p>
        <Button onClick={goBack} variant="outline" className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại chọn dịch vụ
        </Button>
      </div>
    );
  }

  return (
    <div className="py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <button
            type="button"
            onClick={goBack}
            className="inline-flex items-center text-sm text-sky-600 hover:text-sky-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Đổi dịch vụ
          </button>
          <h2 className="text-3xl md:text-4xl font-bold text-sky-950 mb-3">
            Chọn gói phù hợp
          </h2>
          <p className="text-lg text-slate-500">
            Dịch vụ: <span className="font-semibold text-sky-600">{selectedService.name}</span>
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          role="listbox"
          aria-label="Danh sách gói giá"
        >
          {sortedTiers.map((tier) => (
            <motion.div key={tier.id} variants={itemVariants} className="overflow-visible">
              <TierCard
                tier={tier}
                isSelected={isSelected(tier.id)}
                isAIRecommended={isAIRecommended(tier)}
                onSelect={() => handleSelectTier(tier)}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <Button
            variant="outline"
            onClick={() => {
              useWizardStore.getState().goToStep(1);
            }}
            className="border-sky-300 text-sky-600 hover:bg-sky-50 hover:border-sky-400 px-6 py-3 text-base font-medium gap-2"
          >
            <Plus className="w-4 h-4" />
            Thêm dịch vụ khác
          </Button>
        </div>

        {/* FAQ removed — displayed at bottom of page.tsx instead */}
      </div>
    </div>
  );
}
