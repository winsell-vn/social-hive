'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface SkeletonCardProps {
  className?: string;
  showImage?: boolean;
  showActions?: boolean;
}

export function SkeletonCard({
  className,
  showImage = true,
  showActions = true,
}: SkeletonCardProps) {
  return (
    <div
      className={cn(
        'bg-card rounded-lg p-4 space-y-4 animate-pulse border border-border',
        className
      )}
    >
      {/* Header with avatar and user info */}
      <div className="flex items-center space-x-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>

      {/* Content lines */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>

      {/* Image placeholder */}
      {showImage && <Skeleton className="h-48 w-full rounded-md" />}

      {/* Action buttons */}
      {showActions && (
        <div className="flex justify-around pt-2 border-t border-border">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
        </div>
      )}
    </div>
  );
}
