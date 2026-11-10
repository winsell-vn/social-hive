'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PageLoaderProps {
  text?: string;
  className?: string;
}

export function PageLoader({ 
  text = 'Đang tải...', 
  className 
}: PageLoaderProps) {
  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex flex-col items-center justify-center',
        'bg-background/80 backdrop-blur-sm',
        className
      )}
    >
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      {text && (
        <p className="mt-4 text-sm text-muted-foreground">{text}</p>
      )}
    </div>
  );
}

