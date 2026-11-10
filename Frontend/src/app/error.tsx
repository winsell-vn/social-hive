'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-16">
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 rounded-full bg-destructive/10 p-4">
          <AlertTriangle className="h-12 w-12 text-destructive" />
        </div>
        
        <h1 className="mb-2 text-2xl font-bold text-foreground">
          Đã xảy ra lỗi
        </h1>
        
        <p className="mb-6 max-w-md text-muted-foreground">
          Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.
        </p>

        {process.env.NODE_ENV === 'development' && (
          <div className="mb-6 w-full max-w-md rounded-lg bg-muted p-4 text-left">
            <p className="mb-2 text-sm font-medium text-foreground">
              Chi tiết lỗi:
            </p>
            <pre className="overflow-auto text-xs text-muted-foreground">
              {error.message}
            </pre>
            {error.digest && (
              <p className="mt-2 text-xs text-muted-foreground">
                Digest: {error.digest}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button onClick={reset}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Thử lại
          </Button>
          
          <Button asChild variant="outline">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Về trang chủ
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

