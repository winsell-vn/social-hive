'use client';

import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWizardStore } from '../../stores/wizard-store';
import { ServiceCard } from './ServiceCard';
import type { Service, PricingTier, PublicCategory } from '@/types/pricing';

interface Step2ServiceProps {
  services: Array<Service & { pricingTiers: PricingTier[] }>;
  categories: PublicCategory[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.2,
      ease: 'easeOut',
    },
  },
};

export function Step2Service({ services, categories }: Step2ServiceProps) {
  const { selectedCategoryId, selectedServiceSlug, selectService, goBack } = useWizardStore();

  // Find the selected category from the categories array
  const category = selectedCategoryId
    ? categories.find((cat) => cat.id === selectedCategoryId)
    : null;

  // Filter services by categoryId
  const filteredServices = services.filter(
    (service) => service.categoryId === selectedCategoryId
  );

  if (!category) {
    return (
      <div className="py-8 px-4 text-center">
        <p className="text-slate-500">Vui lòng chọn danh mục trước</p>
        <Button onClick={goBack} variant="outline" className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại chọn danh mục
        </Button>
      </div>
    );
  }

  return (
    <div className="py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <button
            type="button"
            onClick={goBack}
            className="inline-flex items-center text-sm text-sky-600 hover:text-sky-700 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Đổi danh mục
          </button>
          <h2 className="text-3xl md:text-4xl font-bold text-sky-950 mb-3">
            Chọn dịch vụ
          </h2>
          <p className="text-lg text-slate-500">
            {filteredServices.length} dịch vụ trong danh mục{' '}
            <span className="font-semibold text-sky-600">{category.name}</span>
          </p>
        </div>

        {/* Service List */}
        {filteredServices.length > 0 ? (
          <motion.div
            className="space-y-3"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            role="listbox"
            aria-label="Danh sách dịch vụ"
          >
            {filteredServices.map((service) => (
              <motion.div key={service.id} variants={itemVariants}>
                <ServiceCard
                  service={service}
                  isSelected={selectedServiceSlug === service.slug}
                  onClick={() => selectService(service.slug)}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-12">
            <p className="text-slate-500 mb-4">
              Chưa có dịch vụ nào trong danh mục này
            </p>
            <Button onClick={goBack} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Chọn danh mục khác
            </Button>
          </div>
        )}

        {/* Help text */}
        {filteredServices.length > 0 && (
          <p className="text-center text-sm text-slate-400 mt-6">
            Nhấp vào dịch vụ để xem các gói giá
          </p>
        )}
      </div>
    </div>
  );
}

