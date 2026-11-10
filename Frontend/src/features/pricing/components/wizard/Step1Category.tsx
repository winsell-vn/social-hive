'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, ImageDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWizardStore } from '../../stores/wizard-store';
import { CategoryCard } from './CategoryCard';
import { PricingImageExportDialog } from '../export';
import type { PublicCategory, Service } from '@/types/pricing';

interface Step1CategoryProps {
  categories: PublicCategory[];
  services: Service[];
  isLoading?: boolean;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
};

export function Step1Category({ categories, services, isLoading }: Step1CategoryProps) {
  const { selectedCategoryId, selectCategory } = useWizardStore();
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  // Loading state
  if (isLoading) {
    return (
      <div className="py-8 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <Loader2 className="w-8 h-8 animate-spin text-sky-500 mx-auto mb-4" />
          <p className="text-slate-500">Đang tải danh mục...</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (!categories || categories.length === 0) {
    return (
      <div className="py-8 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-slate-500">Chưa có danh mục dịch vụ nào</p>
        </div>
      </div>
    );
  }

  // Split categories: regular vs combo
  const regularCategories = categories.filter(
    (cat) => !cat.slug?.startsWith('combo-')
  );
  const comboCategories = categories.filter((cat) =>
    cat.slug?.startsWith('combo-')
  );

  return (
    <div className="py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-sky-950 mb-3">
            Bạn cần dịch vụ gì?
          </h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Chọn danh mục phù hợp với nhu cầu của bạn
          </p>
          {/* Export button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExportDialogOpen(true)}
            className="mt-4 text-sky-600 border-sky-200 hover:bg-sky-50 hover:border-sky-300"
          >
            <ImageDown className="w-4 h-4 mr-2" />
            Xuất ảnh bảng giá
          </Button>
        </div>

        {/* Layout: Left grid + Right combo card */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Left: 3x2 grid of regular categories */}
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 flex-1"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            role="listbox"
            aria-label="Danh sách danh mục dịch vụ"
          >
            {regularCategories.map((category) => (
              <motion.div key={category.id} variants={itemVariants}>
                <CategoryCard
                  category={category}
                  isSelected={selectedCategoryId === category.id}
                  onClick={() => selectCategory(category.id)}
                />
              </motion.div>
            ))}
          </motion.div>

          {/* Right: Combo card(s) - normal size */}
          {comboCategories.length > 0 && (
            <div className="w-full lg:w-auto lg:min-w-[280px] lg:max-w-[320px]">
              {comboCategories.map((category) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                >
                  <CategoryCard
                    category={category}
                    isSelected={selectedCategoryId === category.id}
                    onClick={() => selectCategory(category.id)}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Help text */}
        <p className="text-center text-sm text-slate-400 mt-8">
          Nhấp vào danh mục để xem các dịch vụ chi tiết
        </p>
      </div>

      {/* Export Dialog */}
      <PricingImageExportDialog
        open={isExportDialogOpen}
        onOpenChange={setIsExportDialogOpen}
        categories={categories}
        services={services || []}
      />
    </div>
  );
}

