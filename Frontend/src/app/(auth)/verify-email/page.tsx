'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useVerifyEmail, useResendVerificationEmail } from '@/features/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, XCircle, Mail } from 'lucide-react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const emailParam = searchParams.get('email');

  const verifyEmail = useVerifyEmail();
  const resendVerification = useResendVerificationEmail();

  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'idle'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [email, setEmail] = useState<string>(emailParam ? decodeURIComponent(emailParam) : '');
  const [resendStatus, setResendStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [resendMessage, setResendMessage] = useState<string>('');

  // Auto-verify if token is provided
  useEffect(() => {
    if (!token) {
      return;
    }

    setStatus('loading');
    verifyEmail.mutate(
      { token },
      {
        onSuccess: () => {
          setStatus('success');
        },
        onError: (error: any) => {
          setStatus('error');
          setErrorMessage(
            error.response?.data?.message || 'Xác thực thất bại. Vui lòng thử lại.'
          );
        },
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleResendVerification = async () => {
    if (!email) {
      setResendMessage('Vui lòng nhập email');
      setResendStatus('error');
      return;
    }

    setResendStatus('loading');
    setResendMessage('');

    resendVerification.mutate(
      { email },
      {
        onSuccess: () => {
          setResendStatus('success');
          setResendMessage('Email xác thực đã được gửi. Vui lòng kiểm tra hộp thư của bạn.');
        },
        onError: (error: any) => {
          setResendStatus('error');
          setResendMessage(
            error.response?.data?.message || 'Không thể gửi lại email xác thực. Vui lòng thử lại.'
          );
        },
      }
    );
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Xác thực email</CardTitle>
          <CardDescription>
            {token ? 'Đang xác thực email của bạn...' : 'Nhập email để nhận link xác thực'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Auto-verification flow (when token is provided) */}
          {token && (
            <>
              {status === 'loading' && (
                <div className="space-y-4 text-center">
                  <Loader2 className="mx-auto h-12 w-12 animate-spin text-rose-600" />
                  <p className="text-muted-foreground">Đang xác thực...</p>
                </div>
              )}

              {status === 'success' && (
                <div className="space-y-4 text-center">
                  <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                  <p className="font-medium text-green-600">
                    Email đã được xác thực thành công!
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Bạn có thể đăng nhập vào tài khoản của mình ngay bây giờ.
                  </p>
                  <Button asChild className="mt-4 w-full">
                    <Link href="/login">Đăng nhập</Link>
                  </Button>
                </div>
              )}

              {status === 'error' && (
                <div className="space-y-4 text-center">
                  <XCircle className="mx-auto h-12 w-12 text-red-500" />
                  <p className="font-medium text-red-600">Xác thực thất bại</p>
                  <p className="text-sm text-muted-foreground">{errorMessage}</p>
                  <div className="mt-4 flex flex-col gap-2">
                    <Button asChild variant="outline">
                      <Link href="/login">Quay lại đăng nhập</Link>
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Manual verification flow (when no token, user enters email) */}
          {!token && (
            <>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={resendStatus === 'loading'}
                />
              </div>

              {resendMessage && (
                <div
                  className={`p-3 text-sm rounded-md ${
                    resendStatus === 'success'
                      ? 'bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-400'
                      : 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400'
                  }`}
                >
                  {resendMessage}
                </div>
              )}

              <Button
                onClick={handleResendVerification}
                disabled={resendStatus === 'loading' || !email}
                className="w-full"
              >
                {resendStatus === 'loading' && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {resendStatus === 'success' ? 'Email đã gửi' : 'Gửi lại email xác thực'}
              </Button>

              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Đã có tài khoản?{' '}
                  <Link href="/login" className="text-primary hover:underline">
                    Đăng nhập
                  </Link>
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function VerifyEmailLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Xác thực email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-rose-600" />
          <p className="text-muted-foreground">Đang tải...</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyEmailLoading />}>
      <VerifyEmailContent />
    </Suspense>
  );
}

