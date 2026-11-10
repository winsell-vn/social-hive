'use client';

import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  };
  className?: string;
  children?: ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  children,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center',
        className
      )}
    >
      {Icon && (
        <div className="mb-4 rounded-full bg-muted p-4">
          <Icon className="h-12 w-12 text-muted-foreground" />
        </div>
      )}
      
      <h3 className="text-lg font-medium text-foreground">{title}</h3>
      
      {description && (
        <p className="mt-2 text-sm text-muted-foreground max-w-sm">
          {description}
        </p>
      )}
      
      {action && (
        <Button
          onClick={action.onClick}
          variant={action.variant || 'default'}
          className="mt-6"
        >
          {action.label}
        </Button>
      )}
      
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
}

