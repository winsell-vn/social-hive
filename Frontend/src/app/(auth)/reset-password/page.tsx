'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ResetPasswordForm } from '@/features/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

// Prevent static generation - auth pages must always serve fresh HTML
// to avoid stale build artifact references after deployments
export const dynamic = 'force-dynamic';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  if (!token) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-center text-2xl font-bold text-red-500">
            Liên kết không hợp lệ
          </CardTitle>
          <CardDescription className="text-center">
            Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Link href="/forgot-password">
            <Button>Yêu cầu liên kết mới</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return <ResetPasswordForm token={token} />;
}

function ResetPasswordLoading() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-center text-2xl font-bold">
          Đặt lại mật khẩu
        </CardTitle>
      </CardHeader>
      <CardContent className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordLoading />}>
      <ResetPasswordContent />
    </Suspense>
  );
}

