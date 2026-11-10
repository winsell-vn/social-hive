'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, ShieldCheck, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useVerifyLogin2FA } from '../api/auth';

const codeSchema = z.object({
  code: z.string().min(6, 'Vui lòng nhập mã xác thực'),
});

type CodeFormData = z.infer<typeof codeSchema>;

interface TwoFactorLoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tempToken: string;
  onSuccess: () => void;
}

export function TwoFactorLoginModal({ 
  open, 
  onOpenChange, 
  tempToken,
  onSuccess 
}: TwoFactorLoginModalProps) {
  const verifyLogin2FA = useVerifyLogin2FA();
  const [useBackupCode, setUseBackupCode] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CodeFormData>({
    resolver: zodResolver(codeSchema),
  });

  const onSubmit = async (data: CodeFormData) => {
    try {
      await verifyLogin2FA.mutateAsync({
        code: data.code,
        tempToken,
      });
      reset();
      onOpenChange(false);
      onSuccess();
      toast.success('Đăng nhập thành công!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Mã xác thực không đúng');
    }
  };

  const handleClose = () => {
    reset();
    setUseBackupCode(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-green-600" />
            Xác thực hai yếu tố
          </DialogTitle>
          <DialogDescription>
            {useBackupCode 
              ? 'Nhập mã dự phòng 8 ký tự của bạn'
              : 'Nhập mã 6 chữ số từ ứng dụng xác thực'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="code">
              {useBackupCode ? 'Mã dự phòng' : 'Mã xác thực'}
            </Label>
            <Input
              id="code"
              placeholder={useBackupCode ? 'XXXXXXXX' : '000000'}
              maxLength={useBackupCode ? 8 : 6}
              {...register('code')}
              className="mt-1 text-center text-2xl tracking-widest"
              autoComplete="one-time-code"
            />
            {errors.code && (
              <p className="text-sm text-red-500 mt-1">{errors.code.message}</p>
            )}
          </div>

          <Button 
            type="submit" 
            disabled={verifyLogin2FA.isPending} 
            className="w-full bg-rose-600 hover:bg-rose-700"
          >
            {verifyLogin2FA.isPending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Đang xác thực...</>
            ) : 'Xác thực'}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setUseBackupCode(!useBackupCode)}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              {useBackupCode ? (
                <><KeyRound className="h-3 w-3 inline mr-1" />Sử dụng mã từ ứng dụng</>
              ) : (
                'Sử dụng mã dự phòng'
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

