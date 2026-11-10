'use client';

import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorFallbackProps {
  error?: Error | null;
  onReset?: () => void;
  showDetails?: boolean;
}

export function ErrorFallback({ error, onReset, showDetails = false }: ErrorFallbackProps) {
  const isDev = process.env.NODE_ENV === 'development';

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center px-4 py-16" role="alert">
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 rounded-full bg-destructive/10 p-4">
          <AlertTriangle className="h-12 w-12 text-destructive" aria-hidden="true" />
        </div>

        <h1 className="mb-2 text-2xl font-bold text-foreground">
          Đã xảy ra lỗi
        </h1>

        <p className="mb-6 max-w-md text-muted-foreground">
          Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.
        </p>

        {(showDetails || isDev) && error && (
          <div className="mb-6 w-full max-w-md rounded-lg bg-muted p-4 text-left">
            <p className="mb-2 text-sm font-medium text-foreground">
              Chi tiết lỗi:
            </p>
            <pre className="overflow-auto text-xs text-muted-foreground" aria-label="Error details">
              {error.message}
              {isDev && error.stack && (
                <>
                  {'\n\n'}
                  {error.stack}
                </>
              )}
            </pre>
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          {onReset && (
            <Button
              onClick={onReset}
              variant="default"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onReset();
                }
              }}
              aria-label="Try again"
            >
              <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
              Thử lại
            </Button>
          )}

          <Button
            asChild
            variant="outline"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
              }
            }}
          >
            <Link href="/" aria-label="Go to home page">
              <Home className="mr-2 h-4 w-4" aria-hidden="true" />
              Về trang chủ
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

