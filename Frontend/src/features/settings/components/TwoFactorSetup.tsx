'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, Copy, Check, ShieldCheck, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useSettings } from '../hooks/useSettings';
import type { Enable2FAResponse } from '../types/settings';

const verifySchema = z.object({
  code: z.string().length(6, 'Mã xác thực phải có 6 chữ số'),
});

type VerifyFormData = z.infer<typeof verifySchema>;

interface TwoFactorSetupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type SetupStep = 'qrcode' | 'verify' | 'backup' | 'complete';

export function TwoFactorSetup({ open, onOpenChange }: TwoFactorSetupProps) {
  const { enable2FA, isEnabling2FA, verify2FA, isVerifying2FA } = useSettings();
  const [step, setStep] = useState<SetupStep>('qrcode');
  const [setupData, setSetupData] = useState<Enable2FAResponse | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedBackup, setCopiedBackup] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<VerifyFormData>({
    resolver: zodResolver(verifySchema),
  });

  // Trigger 2FA setup when dialog opens
  useEffect(() => {
    if (open && !setupData && !isEnabling2FA) {
      handleStartSetup();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleStartSetup = async () => {
    try {
      const data = await enable2FA();
      if (!data || !data.qrCode) {
        console.error('2FA enable response missing qrCode:', data);
        toast.error('Không thể tạo mã QR. Vui lòng thử lại.');
        return;
      }
      setSetupData(data);
      setStep('qrcode');
    } catch (error: any) {
      console.error('2FA enable error:', error);
      toast.error(error.response?.data?.message || 'Không thể bắt đầu thiết lập 2FA');
    }
  };

  const handleVerify = async (data: VerifyFormData) => {
    try {
      await verify2FA(data.code);
      setStep('backup');
      toast.success('Xác thực thành công!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Mã xác thực không đúng');
    }
  };

  const copyToClipboard = async (text: string, type: 'secret' | 'backup') => {
    await navigator.clipboard.writeText(text);
    if (type === 'secret') {
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    } else {
      setCopiedBackup(true);
      setTimeout(() => setCopiedBackup(false), 2000);
    }
    toast.success('Đã sao chép!');
  };

  const handleComplete = () => {
    setStep('qrcode');
    setSetupData(null);
    reset();
    onOpenChange(false);
    toast.success('Đã bật xác thực hai yếu tố!');
  };

  const handleClose = () => {
    if (step === 'backup' || step === 'complete') {
      handleComplete();
    } else {
      setStep('qrcode');
      setSetupData(null);
      reset();
      onOpenChange(false);
    }
  };

  // Handle dialog close
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      handleClose();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-green-600" />
            Thiết lập xác thực hai yếu tố
          </DialogTitle>
          <DialogDescription>
            {step === 'qrcode' && 'Quét mã QR bằng ứng dụng xác thực'}
            {step === 'verify' && 'Nhập mã xác thực từ ứng dụng'}
            {step === 'backup' && 'Lưu mã dự phòng của bạn'}
          </DialogDescription>
        </DialogHeader>

        {isEnabling2FA || (step === 'qrcode' && !setupData) ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
          </div>
        ) : (
          <>
            {/* Step 1: QR Code */}
            {step === 'qrcode' && setupData && (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <img
                    src={setupData.qrCode}
                    alt="Mã QR để thiết lập xác thực hai yếu tố"
                    className="w-48 h-48"
                  />
                </div>
                <div className="text-center text-sm text-muted-foreground">
                  <p>Hoặc nhập mã thủ công:</p>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <code className="bg-muted px-2 py-1 rounded text-xs break-all">
                      {setupData.secret}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(setupData.secret, 'secret')}
                      aria-label="Sao chép mã bí mật"
                    >
                      {copiedSecret ? (
                        <Check className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <Copy className="h-4 w-4" aria-hidden="true" />
                      )}
                      <span className="sr-only">
                        {copiedSecret ? 'Đã sao chép' : 'Sao chép mã bí mật'}
                      </span>
                    </Button>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={() => setStep('verify')}
                    className="w-full bg-rose-600 hover:bg-rose-700 transition-all duration-200"
                  >
                    Tiếp tục
                  </Button>
                </DialogFooter>
              </div>
            )}

            {/* Step 2: Verify Code */}
            {step === 'verify' && (
              <form onSubmit={handleSubmit(handleVerify)} className="space-y-4">
                <div>
                  <Label htmlFor="code">Mã xác thực</Label>
                  <Input
                    id="code"
                    placeholder="000000"
                    maxLength={6}
                    {...register('code')}
                    className="mt-1 text-center text-2xl tracking-widest"
                    aria-describedby={errors.code ? "code-error" : undefined}
                    aria-invalid={!!errors.code}
                    autoComplete="one-time-code"
                    inputMode="numeric"
                  />
                  {errors.code && (
                    <p id="code-error" className="text-sm text-destructive mt-1" role="alert">
                      {errors.code.message}
                    </p>
                  )}
                </div>
                <DialogFooter className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep('qrcode')}
                    className="transition-all duration-200"
                  >
                    Quay lại
                  </Button>
                  <Button
                    type="submit"
                    disabled={isVerifying2FA}
                    className="bg-rose-600 hover:bg-rose-700 transition-all duration-200"
                  >
                    {isVerifying2FA ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Đang xác thực...</>
                    ) : 'Xác thực'}
                  </Button>
                </DialogFooter>
              </form>
            )}

            {/* Step 3: Backup Codes */}
            {step === 'backup' && setupData && (
              <div className="space-y-4">
                <div
                  className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4"
                  role="alert"
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <div className="text-sm text-yellow-800 dark:text-yellow-200">
                      <p className="font-medium">Lưu mã dự phòng này!</p>
                      <p>Mỗi mã chỉ sử dụng được một lần. Lưu ở nơi an toàn.</p>
                    </div>
                  </div>
                </div>
                <div
                  className="grid grid-cols-2 gap-2"
                  role="list"
                  aria-label="Danh sách mã dự phòng"
                >
                  {setupData.backupCodes.map((code, index) => (
                    <code
                      key={index}
                      role="listitem"
                      className="bg-muted px-3 py-2 rounded text-center font-mono text-sm"
                    >
                      {code}
                    </code>
                  ))}
                </div>
                <Button
                  variant="outline"
                  className="w-full transition-all duration-200"
                  onClick={() => copyToClipboard(setupData.backupCodes.join('\n'), 'backup')}
                >
                  {copiedBackup ? (
                    <Check className="h-4 w-4 mr-2" aria-hidden="true" />
                  ) : (
                    <Copy className="h-4 w-4 mr-2" aria-hidden="true" />
                  )}
                  Sao chép tất cả
                </Button>
                <DialogFooter>
                  <Button
                    onClick={handleComplete}
                    className="w-full bg-rose-600 hover:bg-rose-700 transition-all duration-200"
                  >
                    Hoàn tất
                  </Button>
                </DialogFooter>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

