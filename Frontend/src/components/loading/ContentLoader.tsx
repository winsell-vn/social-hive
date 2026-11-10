'use client';

import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

type ContentLoaderVariant = 'text' | 'avatar' | 'card' | 'post';

interface ContentLoaderProps {
  variant?: ContentLoaderVariant;
  count?: number;
  className?: string;
}

function TextSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-4 w-3/5" />
    </div>
  );
}

function AvatarSkeleton() {
  return (
    <div className="flex items-center gap-3">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>
    </div>
  );
}

function PostSkeletonContent() {
  return (
    <div className="rounded-lg border bg-card shadow-sm">
      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-start gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      </div>
      {/* Content */}
      <div className="px-4 pb-3 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      {/* Image placeholder */}
      <Skeleton className="h-48 w-full" />
      {/* Actions */}
      <div className="p-4 flex justify-around border-t">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  );
}

const variantComponents: Record<ContentLoaderVariant, React.FC> = {
  text: TextSkeleton,
  avatar: AvatarSkeleton,
  card: CardSkeleton,
  post: PostSkeletonContent,
};

export function ContentLoader({
  variant = 'text',
  count = 1,
  className,
}: ContentLoaderProps) {
  const Component = variantComponents[variant];

  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: count }).map((_, index) => (
        <Component key={index} />
      ))}
    </div>
  );
}

