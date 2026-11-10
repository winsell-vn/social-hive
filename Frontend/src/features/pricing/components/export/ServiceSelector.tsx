'use client';

import { useMemo, useCallback } from 'react';
import { AlertTriangle } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getIconByName } from '../../constants/icons';
import type { PublicCategory, Service } from '@/types/pricing';

interface ServiceSelectorProps {
  categories: PublicCategory[];
  services: Service[];
  selectedServiceIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

const MAX_RECOMMENDED_SERVICES = 8;

export function ServiceSelector({
  categories,
  services,
  selectedServiceIds,
  onSelectionChange,
}: ServiceSelectorProps) {
  // Group services by category
  const servicesByCategory = useMemo(() => {
    const map = new Map<string, Service[]>();
    services.forEach((service) => {
      if (service.categoryId) {
        const existing = map.get(service.categoryId) || [];
        map.set(service.categoryId, [...existing, service]);
      }
    });
    return map;
  }, [services]);

  // Get selection state for a category
  const getCategorySelectionState = useCallback(
    (categoryId: string) => {
      const categoryServices = servicesByCategory.get(categoryId) || [];
      if (categoryServices.length === 0) return { checked: false, indeterminate: false, count: 0, total: 0 };

      const selectedCount = categoryServices.filter((s) => selectedServiceIds.includes(s.id)).length;
      return {
        checked: selectedCount === categoryServices.length,
        indeterminate: selectedCount > 0 && selectedCount < categoryServices.length,
        count: selectedCount,
        total: categoryServices.length,
      };
    },
    [servicesByCategory, selectedServiceIds]
  );

  // Toggle all services in a category
  const toggleCategory = useCallback(
    (categoryId: string) => {
      const categoryServices = servicesByCategory.get(categoryId) || [];
      const categoryServiceIds = categoryServices.map((s) => s.id);
      const state = getCategorySelectionState(categoryId);

      if (state.checked || state.indeterminate) {
        // Deselect all in category
        onSelectionChange(selectedServiceIds.filter((id) => !categoryServiceIds.includes(id)));
      } else {
        // Select all in category
        const newIds = [...new Set([...selectedServiceIds, ...categoryServiceIds])];
        onSelectionChange(newIds);
      }
    },
    [servicesByCategory, getCategorySelectionState, selectedServiceIds, onSelectionChange]
  );

  // Toggle single service
  const toggleService = useCallback(
    (serviceId: string) => {
      if (selectedServiceIds.includes(serviceId)) {
        onSelectionChange(selectedServiceIds.filter((id) => id !== serviceId));
      } else {
        onSelectionChange([...selectedServiceIds, serviceId]);
      }
    },
    [selectedServiceIds, onSelectionChange]
  );

  const showWarning = selectedServiceIds.length > MAX_RECOMMENDED_SERVICES;

  return (
    <div className="flex flex-col h-full">
      <Accordion type="multiple" className="flex-1 overflow-auto">
        {categories.map((category) => {
          const categoryServices = servicesByCategory.get(category.id) || [];
          if (categoryServices.length === 0) return null;

          const state = getCategorySelectionState(category.id);
          const IconComponent = getIconByName(category.icon);

          return (
            <AccordionItem key={category.id} value={category.id} className="border-b border-slate-200">
              {/* Custom header: Checkbox and AccordionTrigger as siblings to avoid nested buttons */}
              <div className="flex items-center gap-3 px-2 py-3">
                {/* Checkbox outside AccordionTrigger to prevent button-in-button hydration error */}
                <div onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={state.checked}
                    ref={(el) => {
                      if (el) {
                        (el as HTMLButtonElement & { indeterminate: boolean }).indeterminate = state.indeterminate;
                      }
                    }}
                    onCheckedChange={() => toggleCategory(category.id)}
                    className={cn(
                      'data-[state=checked]:bg-sky-500 data-[state=checked]:border-sky-500',
                      state.indeterminate && 'bg-sky-200 border-sky-500'
                    )}
                  />
                </div>
                <AccordionTrigger className="flex-1 hover:no-underline py-0 [&>svg]:ml-auto">
                  <div className="flex items-center gap-3 flex-1">
                    <IconComponent className="w-4 h-4 text-sky-600" />
                    <span className="font-medium text-slate-800">{category.name}</span>
                    <Badge variant="secondary" className="ml-auto mr-2 text-xs">
                      {state.count}/{state.total}
                    </Badge>
                  </div>
                </AccordionTrigger>
              </div>
              <AccordionContent className="px-2 pb-3">
                <div className="space-y-2 pl-7">
                  {categoryServices.map((service) => {
                    const isSelected = selectedServiceIds.includes(service.id);
                    const ServiceIcon = getIconByName(service.icon);
                    return (
                      <label
                        key={service.id}
                        className="flex items-center gap-3 py-1.5 px-2 rounded-md hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleService(service.id)}
                          className="data-[state=checked]:bg-sky-500 data-[state=checked]:border-sky-500"
                        />
                        <ServiceIcon className="w-4 h-4 text-slate-500" />
                        <span className={cn('text-sm', isSelected ? 'text-slate-900 font-medium' : 'text-slate-600')}>
                          {service.name}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {/* Footer with count and warning */}
      <div className="border-t border-slate-200 pt-3 mt-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600">
            Đã chọn: <span className="font-semibold text-sky-600">{selectedServiceIds.length}</span> dịch vụ
          </span>
        </div>
        {showWarning && (
          <div className="flex items-center gap-2 mt-2 text-amber-600 text-xs">
            <AlertTriangle className="w-4 h-4" />
            <span>Chọn quá nhiều dịch vụ có thể làm ảnh quá lớn</span>
          </div>
        )}
      </div>
    </div>
  );
}
