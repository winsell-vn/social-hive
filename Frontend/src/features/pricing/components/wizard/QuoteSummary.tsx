'use client';

import { X, ChevronUp, ChevronDown, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useWizardStore, calculateTotal, type SelectedItem } from '../../stores/wizard-store';
import { formatVNDPrice } from '../../utils';

interface QuoteSummaryProps {
  onAddMore?: () => void;
  onRequestQuote?: () => void;
  compact?: boolean;
}

export function QuoteSummary({ onAddMore, onRequestQuote, compact = false }: QuoteSummaryProps) {
  const { selectedItems, removeItem, currentStep, goToStep, isQuoteSummaryExpanded, setQuoteSummaryExpanded } = useWizardStore();
  const total = calculateTotal(selectedItems);

  if (selectedItems.length === 0) {
    return null;
  }

  // Mobile: Collapsible bottom sheet style
  if (compact) {
    return (
      <div className="lg:hidden">
        <div>
          <Card
            className={cn(
              'fixed left-0 right-0 z-40',
              'bottom-[calc(5.5rem+env(safe-area-inset-bottom))]',
              'bg-white border-t border-sky-200 rounded-t-2xl shadow-lg',
              'transition-all duration-300',
              isQuoteSummaryExpanded ? 'max-h-[60vh]' : 'max-h-[80px]'
            )}
          >
            {/* Header - always visible */}
            <button
              type="button"
              onClick={() => setQuoteSummaryExpanded(!isQuoteSummaryExpanded)}
              className="w-full p-4 flex items-center justify-between"
              aria-expanded={isQuoteSummaryExpanded}
              aria-label={isQuoteSummaryExpanded ? 'Thu gọn chi tiết' : 'Xem chi tiết báo giá'}
            >
              <div className="flex items-center gap-3">
                <Badge className="bg-sky-500 text-white">
                  {selectedItems.length} dịch vụ
                </Badge>
                <span className="font-bold text-sky-950">
                  {formatVNDPrice(total)}
                </span>
              </div>
              {isQuoteSummaryExpanded ? (
                <ChevronDown className="w-5 h-5 text-slate-500" />
              ) : (
                <ChevronUp className="w-5 h-5 text-slate-500" />
              )}
            </button>

            {/* Expanded content */}
            {isQuoteSummaryExpanded && (
              <div className="px-4 pb-4 overflow-y-auto max-h-[calc(60vh-80px)]">
                <ItemList items={selectedItems} onRemove={removeItem} />
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onAddMore?.();
                      goToStep(1);
                    }}
                    className="flex-1 border-sky-200 text-sky-700"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Thêm dịch vụ
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    );
  }

  // Desktop: Sticky sidebar
  return (
    <div className="hidden lg:block">
      <Card className="sticky top-24 w-80 p-6 bg-white border-sky-200 shadow-lg">
        <h3 className="text-lg font-bold text-sky-950 mb-4">Báo giá của bạn</h3>
        
        <ItemList items={selectedItems} onRemove={removeItem} />

        {/* Total */}
        <div className="mt-4 pt-4 border-t border-sky-100">
          <div className="flex justify-between items-center mb-4">
            <span className="text-slate-500">Tổng cộng:</span>
            <span className="text-2xl font-bold text-sky-950">
              {formatVNDPrice(total)}
            </span>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            {currentStep < 4 && (
              <Button
                onClick={() => goToStep(4)}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white min-h-[48px]"
              >
                Nhận báo giá
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => {
                onAddMore?.();
                goToStep(1);
              }}
              className="w-full border-sky-200 text-sky-700 hover:bg-sky-50"
            >
              <Plus className="w-4 h-4 mr-2" />
              Thêm dịch vụ khác
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function ItemList({ items, onRemove }: { items: SelectedItem[]; onRemove: (id: string) => void }) {
  return (
    <ul className="space-y-3" aria-label="Danh sách dịch vụ đã chọn">
      {items.map((item) => (
        <li
          key={item.tierId}
          className="flex items-start justify-between gap-2 p-3 bg-sky-50 rounded-lg"
        >
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sky-950 text-sm truncate">{item.serviceName}</p>
            <p className="text-xs text-slate-500">{item.tierName}</p>
            <p className="text-sm font-semibold text-sky-600 mt-1">
              {formatVNDPrice(item.price)}
              {item.priceNote && (
                <span className="text-xs text-slate-400 ml-1">{item.priceNote}</span>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onRemove(item.tierId)}
            className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
            aria-label={`Xóa ${item.serviceName}`}
          >
            <X className="w-4 h-4" />
          </button>
        </li>
      ))}
    </ul>
  );
}

