'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useSettings } from '../hooks/useSettings';
import type { UpdateAccountInput } from '../types/settings';

const accountSchema = z.object({
  displayName: z.string().min(2, 'Tên hiển thị phải có ít nhất 2 ký tự').max(50),
  email: z.string().email('Email không hợp lệ'),
  bio: z.string().max(500, 'Tiểu sử không được quá 500 ký tự').optional(),
});

type AccountFormData = z.infer<typeof accountSchema>;

export function AccountSettings() {
  const { settings, isLoading, updateAccount, isUpdatingAccount } = useSettings();
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      displayName: settings?.displayName || '',
      email: settings?.email || '',
      bio: settings?.bio || '',
    },
    values: settings ? {
      displayName: settings.displayName,
      email: settings.email,
      bio: settings.bio || '',
    } : undefined,
  });

  // Unsaved changes warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const onSubmit = async (data: AccountFormData) => {
    try {
      await updateAccount(data as UpdateAccountInput);
      reset(data);
    } catch (error) {
      // Error is handled by the useSettings hook
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-rose-600" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Thông tin tài khoản</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Cập nhật thông tin cá nhân của bạn
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="displayName">Tên hiển thị</Label>
          <Input
            id="displayName"
            {...register('displayName')}
            placeholder="Nhập tên hiển thị"
            className="mt-1"
            aria-describedby={errors.displayName ? "displayName-error" : undefined}
            aria-invalid={!!errors.displayName}
          />
          {errors.displayName && (
            <p id="displayName-error" className="text-sm text-destructive mt-1" role="alert">
              {errors.displayName.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            {...register('email')}
            placeholder="Nhập email"
            className="mt-1"
            aria-describedby={errors.email ? "email-error email-hint" : "email-hint"}
            aria-invalid={!!errors.email}
          />
          {errors.email && (
            <p id="email-error" className="text-sm text-destructive mt-1" role="alert">
              {errors.email.message}
            </p>
          )}
          <p id="email-hint" className="text-xs text-muted-foreground mt-1">
            Thay đổi email sẽ yêu cầu xác minh
          </p>
        </div>

        <div>
          <Label htmlFor="bio">Tiểu sử</Label>
          <Textarea
            id="bio"
            {...register('bio')}
            placeholder="Viết vài dòng về bản thân..."
            rows={4}
            className="mt-1"
            aria-describedby={errors.bio ? "bio-error bio-hint" : "bio-hint"}
            aria-invalid={!!errors.bio}
          />
          {errors.bio && (
            <p id="bio-error" className="text-sm text-destructive mt-1" role="alert">
              {errors.bio.message}
            </p>
          )}
          <p id="bio-hint" className="text-xs text-muted-foreground mt-1">Tối đa 500 ký tự</p>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <Button
          type="button"
          variant="outline"
          onClick={() => reset()}
          disabled={!isDirty || isUpdatingAccount}
          className="transition-all duration-200"
        >
          Hủy
        </Button>
        <Button
          type="submit"
          disabled={!isDirty || isUpdatingAccount}
          className="bg-rose-600 hover:bg-rose-700 transition-all duration-200"
        >
          {isUpdatingAccount ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Đang lưu...
            </>
          ) : (
            'Lưu thay đổi'
          )}
        </Button>
      </div>
    </form>
  );
}

