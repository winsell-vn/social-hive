'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageTransitionProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

export function PageTransition({
  children,
  delay = 0,
  duration = 300,
  className,
}: PageTransitionProps) {
  return (
    <div
      className={cn('animate-page-transition-in', className)}
      style={{
        animationDelay: `${delay}ms`,
        animationDuration: `${duration}ms`,
      }}
    >
      {children}
    </div>
  );
}
