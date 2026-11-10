'use client';

import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface PostSkeletonProps {
  showImage?: boolean;
  className?: string;
}

export function PostSkeleton({ showImage = true, className }: PostSkeletonProps) {
  return (
    <div className={cn('rounded-lg border bg-card shadow-sm', className)}>
      {/* Header - Avatar, Name, Timestamp */}
      <div className="p-4 pb-3">
        <div className="flex items-start gap-3">
          <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-3 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>

      {/* Image placeholder */}
      {showImage && (
        <Skeleton className="h-64 w-full" />
      )}

      {/* Reaction counts */}
      <div className="px-4 py-2 flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Divider */}
      <div className="mx-4 border-t" />

      {/* Action buttons */}
      <div className="p-2 flex justify-around">
        <Skeleton className="h-9 w-24 rounded-md" />
        <Skeleton className="h-9 w-24 rounded-md" />
        <Skeleton className="h-9 w-24 rounded-md" />
      </div>
    </div>
  );
}

// Multiple post skeletons for feed loading
interface PostSkeletonListProps {
  count?: number;
  showImage?: boolean;
  className?: string;
}

export function PostSkeletonList({ 
  count = 3, 
  showImage = true,
  className 
}: PostSkeletonListProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: count }).map((_, index) => (
        <PostSkeleton key={index} showImage={showImage && index === 0} />
      ))}
    </div>
  );
}

