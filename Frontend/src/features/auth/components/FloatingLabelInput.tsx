'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface FloatingLabelInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  error?: string;
  errorId?: string;
  rightElement?: React.ReactNode;
}

export const FloatingLabelInput = React.forwardRef<
  HTMLInputElement,
  FloatingLabelInputProps
>(
  (
    {
      id,
      label,
      type = 'text',
      error,
      errorId,
      rightElement,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <div className={cn('space-y-1', className)}>
        <div className="relative">
          <input
            ref={ref}
            id={id}
            type={type}
            placeholder=" "
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={error && errorId ? errorId : undefined}
            className={cn(
              'peer w-full px-4 py-3 pt-6 bg-secondary/50 border border-border/50 rounded-xl text-sm text-foreground placeholder-transparent transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-transparent hover:border-muted-foreground/30 disabled:opacity-50 disabled:cursor-not-allowed',
              rightElement && 'pr-12'
            )}
            {...props}
          />
          <label
            htmlFor={id}
            className="absolute left-4 top-1.5 text-[11px] font-medium text-muted-foreground transition-all duration-200 peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-focus:top-1.5 peer-focus:text-[11px] peer-focus:font-medium pointer-events-none"
          >
            {label}
          </label>
          {rightElement}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-0 bg-foreground peer-focus:w-full transition-all duration-300 rounded-full" />
        </div>
        {error && errorId && (
          <p id={errorId} className="mt-1.5 text-xs text-red-500">
            {error}
          </p>
        )}
      </div>
    );
  }
);

FloatingLabelInput.displayName = 'FloatingLabelInput';

