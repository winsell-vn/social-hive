'use client';

import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useEmailConfig,
  useUpdateEmailConfig,
  useTestEmail,
} from '../api/email-config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Save,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';

const formSchema = z.object({
  apiKey: z.string().optional(),
  from: z.string().email('Email gửi không hợp lệ'),
  verificationRequired: z.boolean(),
  testEmail: z.string().email('Email nhận không hợp lệ').optional().or(z.literal('')),
});

type FormData = z.infer<typeof formSchema>;

export function EmailConfigPage() {
  const [showApiKey, setShowApiKey] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const { data: config, isLoading, error } = useEmailConfig();
  const updateConfig = useUpdateEmailConfig();
  const testEmail = useTestEmail();

  // Always resolve to a concrete object so the form fields are never
  // `undefined` on the first render (which would make the toggle switch
  // uncontrolled before the config request resolves).
  const configValues = useMemo<FormData>(
    () => ({
      apiKey: '',
      from: config?.from ?? '',
      verificationRequired: config?.verificationRequired ?? true,
      testEmail: '',
    }),
    [config?.from, config?.verificationRequired]
  );

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: configValues,
    values: configValues,
  });

  const onSubmit = async (data: FormData) => {
    const payload: {
      apiKey?: string;
      from: string;
      verificationRequired: boolean;
    } = {
      from: data.from,
      verificationRequired: data.verificationRequired,
    };

    // Only send the API key when the admin typed a new one
    if (data.apiKey && data.apiKey.trim()) {
      payload.apiKey = data.apiKey.trim();
    }

    await updateConfig.mutateAsync(payload);
  };

  const handleTestEmail = async () => {
    const to = form.getValues('testEmail');
    if (!to) {
      toast.error('Vui lòng nhập email nhận để kiểm tra');
      return;
    }

    setTestResult(null);
    try {
      const result = await testEmail.mutateAsync(to);
      setTestResult({ success: result.success, message: result.message });
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Không thể gửi email kiểm tra';
      setTestResult({ success: false, message });
      toast.error(message);
    }
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
        <p className="text-red-600">Không thể tải cấu hình email</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Mail className="h-6 w-6" />
          Cấu hình Email
        </h1>
        <p className="text-gray-500 mt-1">
          Quản lý nhà cung cấp email (Resend) và cơ chế xác thực email khi đăng ký
        </p>
      </div>

      {isLoading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72 mt-2" />
          </CardHeader>
          <CardContent className="space-y-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Nhà cung cấp email (Resend)</CardTitle>
              <CardDescription>
                API key trong .env chỉ dùng làm dự phòng. Nếu bạn lưu ở đây thì giá trị
                này được ưu tiên.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Source */}
              <div className="rounded-lg border border-gray-200 bg-gray-50/60 p-3 text-sm">
                <p className="text-gray-700">
                  Nguồn cấu hình hiện tại:{' '}
                  <span className="font-medium">
                    {config?.source === 'db' ? 'Đã lưu trong hệ thống' : 'Biến môi trường (.env)'}
                  </span>
                </p>
                {config?.hasApiKey ? (
                  <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                    <CheckCircle className="h-3 w-3" />
                    Đã có API key
                  </p>
                ) : (
                  <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                    <AlertTriangle className="h-3 w-3" />
                    Chưa có API key - email sẽ không được gửi
                  </p>
                )}
              </div>

              {/* API Key */}
              <div className="space-y-2">
                <Label htmlFor="apiKey">Resend API Key</Label>
                <div className="relative">
                  <Input
                    id="apiKey"
                    type={showApiKey ? 'text' : 'password'}
                    placeholder={
                      config?.hasApiKey
                        ? '•••••••• (đã lưu - để trống nếu không đổi)'
                        : 're_...'
                    }
                    {...form.register('apiKey')}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label={showApiKey ? 'Ẩn API key' : 'Hiện API key'}
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  Lấy API key tại resend.com. Để trống nếu bạn không muốn thay đổi key đang lưu.
                </p>
              </div>

              {/* From email */}
              <div className="space-y-2">
                <Label htmlFor="from">Email gửi (From)</Label>
                <Input
                  id="from"
                  type="email"
                  placeholder="noreply@chungtoixayweb.vn"
                  {...form.register('from')}
                />
                <p className="text-xs text-gray-500">
                  Địa chỉ dùng làm người gửi cho mọi email (xác thực, đặt lại mật khẩu).
                </p>
                {form.formState.errors.from && (
                  <p className="text-xs text-red-500">
                    {form.formState.errors.from.message}
                  </p>
                )}
              </div>

              {/* Verification toggle */}
              <div className="flex items-start justify-between gap-4 rounded-lg border border-gray-200 p-4">
                <div className="space-y-1">
                  <Label htmlFor="verificationRequired">
                    Bắt buộc xác thực email khi đăng ký
                  </Label>
                  <p className="text-xs text-gray-500">
                    {form.watch('verificationRequired')
                      ? 'Tài khoản mới sẽ ở trạng thái chờ xác thực và hệ thống gửi email xác nhận.'
                      : 'Tài khoản mới được kích hoạt ngay và không gửi email nào.'}
                  </p>
                </div>
                <Switch
                  id="verificationRequired"
                  checked={form.watch('verificationRequired')}
                  onCheckedChange={(checked) =>
                    form.setValue('verificationRequired', checked, { shouldDirty: true })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Kiểm tra cấu hình</CardTitle>
              <CardDescription>
                Gửi một email thử để xác nhận API key và địa chỉ gửi hoạt động.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="testEmail">Email nhận thử</Label>
                <Input
                  id="testEmail"
                  type="email"
                  placeholder="admin@chungtoixayweb.vn"
                  {...form.register('testEmail')}
                />
                {form.formState.errors.testEmail && (
                  <p className="text-xs text-red-500">
                    {form.formState.errors.testEmail.message}
                  </p>
                )}
              </div>

              {testResult && (
                <div
                  className={`p-3 rounded-lg text-sm flex items-start gap-2 ${
                    testResult.success
                      ? 'bg-green-50 text-green-700'
                      : 'bg-red-50 text-red-700'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleTestEmail}
              disabled={testEmail.isPending}
            >
              {testEmail.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Gửi email thử
            </Button>
            <Button type="submit" disabled={updateConfig.isPending}>
              {updateConfig.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Lưu cấu hình
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
