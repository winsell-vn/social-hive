'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ICON_MAP, DEFAULT_ICON } from '../constants';
import type { Service, PricingTier } from '@/types/pricing';
import { PricingGrid } from './PricingGrid';

interface ServiceTabsProps {
  services: Array<Service & { pricingTiers: PricingTier[] }>;
}

export function ServiceTabs({ services }: ServiceTabsProps) {
  if (!services || services.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        Chưa có dịch vụ nào được cấu hình.
      </div>
    );
  }

  const defaultService = services[0]?.slug || '';

  return (
    <section className="py-16 px-4 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Chọn dịch vụ phù hợp với bạn
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Mỗi dịch vụ được thiết kế để đáp ứng nhu cầu cụ thể của doanh nghiệp bạn
          </p>
        </div>

        <Tabs defaultValue={defaultService} className="w-full">
          <TabsList className="flex flex-wrap justify-center gap-2 mb-8 bg-transparent">
            {services.map((service) => {
              const IconComponent = ICON_MAP[service.icon || 'globe'] || DEFAULT_ICON;
              return (
                <TabsTrigger
                  key={service.slug}
                  value={service.slug}
                  className="flex items-center gap-2 px-6 py-3 rounded-full data-[state=active]:bg-rose-500 data-[state=active]:text-white transition-all"
                >
                  <IconComponent className="w-4 h-4" />
                  {service.name}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {services.map((service) => (
            <TabsContent key={service.slug} value={service.slug}>
              {service.description && (
                <p className="text-center text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
                  {service.description}
                </p>
              )}
              <PricingGrid tiers={service.pricingTiers} />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
}

