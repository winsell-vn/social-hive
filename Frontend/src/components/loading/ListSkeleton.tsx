'use client';

import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface ListSkeletonProps {
  count?: number;
  itemHeight?: number;
  showAvatar?: boolean;
  className?: string;
}

export function ListSkeleton({
  count = 5,
  itemHeight = 64,
  showAvatar = true,
  className,
}: ListSkeletonProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-3 p-3 rounded-lg border bg-card"
          style={{ minHeight: itemHeight }}
        >
          {showAvatar && (
            <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
          )}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      ))}
    </div>
  );
}

// Notification list skeleton
export function NotificationListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-1">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex items-start gap-3 p-3 rounded-lg">
          <div className="relative">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full" />
          </div>
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-2 w-2 rounded-full" />
        </div>
      ))}
    </div>
  );
}

