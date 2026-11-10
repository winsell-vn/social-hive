'use client';

import { WifiOff, RefreshCw } from 'lucide-react';
import { EmptyState } from './EmptyState';

interface NoConnectionProps {
  onRetry?: () => void;
  className?: string;
}

export function NoConnection({ onRetry, className }: NoConnectionProps) {
  return (
    <EmptyState
      icon={WifiOff}
      title="Không có kết nối mạng"
      description="Vui lòng kiểm tra kết nối internet của bạn và thử lại."
      action={
        onRetry
          ? {
              label: 'Thử lại',
              onClick: onRetry,
              variant: 'outline',
            }
          : undefined
      }
      className={className}
    >
      {onRetry && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
          <RefreshCw className="h-4 w-4" />
          <span>Nhấn để tải lại</span>
        </div>
      )}
    </EmptyState>
  );
}

