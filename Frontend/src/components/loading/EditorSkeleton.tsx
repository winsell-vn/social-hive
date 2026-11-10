/**
 * EditorSkeleton - Loading skeleton for TipTap RichTextEditor
 * Used as fallback when lazy loading the editor component
 */

import { cn } from '@/lib/utils';

interface EditorSkeletonProps {
  /** Additional CSS classes */
  className?: string;
  /** Minimum height of the editor area */
  minHeight?: string;
  /** Whether to show the toolbar skeleton */
  showToolbar?: boolean;
}

export function EditorSkeleton({
  className,
  minHeight = 'min-h-[120px]',
  showToolbar = true,
}: EditorSkeletonProps) {
  return (
    <div className={cn('w-full animate-pulse', className)}>
      {/* Toolbar skeleton */}
      {showToolbar && (
        <div className="flex items-center gap-2 p-2 border border-border rounded-t-lg bg-muted/30">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-8 w-8 rounded bg-muted" />
          ))}
        </div>
      )}
      {/* Editor area skeleton */}
      <div
        className={cn(
          'border border-border p-4 bg-background',
          showToolbar ? 'border-t-0 rounded-b-lg' : 'rounded-lg',
          minHeight
        )}
      >
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded w-1/2" />
          <div className="h-4 bg-muted rounded w-5/6" />
        </div>
      </div>
    </div>
  );
}

export default EditorSkeleton;

