'use client';

import { SearchX } from 'lucide-react';
import { EmptyState } from './EmptyState';

interface NoResultsProps {
  query?: string;
  onClearFilters?: () => void;
  className?: string;
}

export function NoResults({ query, onClearFilters, className }: NoResultsProps) {
  return (
    <EmptyState
      icon={SearchX}
      title="Không tìm thấy kết quả"
      description={
        query
          ? `Không tìm thấy kết quả cho "${query}". Thử tìm kiếm với từ khóa khác.`
          : 'Thử tìm kiếm với từ khóa khác hoặc điều chỉnh bộ lọc.'
      }
      action={
        onClearFilters
          ? {
              label: 'Xóa bộ lọc',
              onClick: onClearFilters,
              variant: 'outline',
            }
          : undefined
      }
      className={className}
    />
  );
}

