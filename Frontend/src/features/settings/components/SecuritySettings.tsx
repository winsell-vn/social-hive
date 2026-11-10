'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, Shield, Key, Trash2, AlertTriangle, ShieldCheck, ShieldOff, Monitor } from 'lucide-react';
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
import { useAuth } from '@/features/auth';
import { TwoFactorSetup } from './TwoFactorSetup';
import { SessionsManager } from './SessionsManager';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';
import { AccountDeletionBanner } from './AccountDeletionBanner';

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
  newPassword: z.string().min(8, 'Mật khẩu mới phải có ít nhất 8 ký tự'),
  confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu mới'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

export function SecuritySettings() {
  const {
    settings,
    isLoading,
    changePassword,
    isChangingPassword,
    deleteAccount,
    isDeletingAccount,
    disable2FA,
    isDisabling2FA,
    cancelAccountDeletion,
    isCancellingDeletion,
  } = useSettings();
  const { logout } = useAuth();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDisable2FADialog, setShowDisable2FADialog] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [disable2FAPassword, setDisable2FAPassword] = useState('');
  const [disable2FAError, setDisable2FAError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch,
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  // Watch newPassword for strength indicator
  const newPassword = watch('newPassword', '');

  // Check if user has pending deletion
  const hasPendingDeletion = settings?.deletionStatus?.isScheduledForDeletion ?? false;

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

  const onPasswordSubmit = async (data: PasswordFormData) => {
    try {
      await changePassword(data);
      reset();
      toast.success('Đổi mật khẩu thành công!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Đổi mật khẩu thất bại');
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setDeleteError('Vui lòng nhập mật khẩu');
      return;
    }
    try {
      const result = await deleteAccount(deletePassword);
      setShowDeleteDialog(false);
      setDeletePassword('');
      toast.success(result.message);
    } catch (error: any) {
      setDeleteError(error.response?.data?.message || 'Yêu cầu xóa tài khoản thất bại');
    }
  };

  const handleCancelDeletion = async () => {
    try {
      await cancelAccountDeletion();
      toast.success('Đã hủy yêu cầu xóa tài khoản');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Hủy yêu cầu xóa tài khoản thất bại');
    }
  };

  const handleDisable2FA = async () => {
    if (!disable2FAPassword) {
      setDisable2FAError('Vui lòng nhập mật khẩu');
      return;
    }
    try {
      await disable2FA(disable2FAPassword);
      setShowDisable2FADialog(false);
      setDisable2FAPassword('');
      toast.success('Đã tắt xác thực hai yếu tố');
    } catch (error: any) {
      setDisable2FAError(error.response?.data?.message || 'Tắt 2FA thất bại');
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
    <div className="space-y-8">
      {/* Account Deletion Warning Banner */}
      {settings?.deletionStatus && (
        <AccountDeletionBanner
          deletionStatus={settings.deletionStatus}
          onCancelDeletion={handleCancelDeletion}
          isCancelling={isCancellingDeletion}
        />
      )}

      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Bảo mật</h3>
        <p className="text-sm text-muted-foreground mb-6">Quản lý mật khẩu và bảo mật tài khoản</p>
      </div>

      {/* Change Password */}
      <div className="p-4 border border-border rounded-lg">
        <div className="flex items-center gap-3 mb-4">
          <Key className="h-5 w-5 text-muted-foreground" />
          <h4 className="font-medium text-foreground">Đổi mật khẩu</h4>
        </div>

        <form onSubmit={handleSubmit(onPasswordSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
            <Input
              id="currentPassword"
              type="password"
              {...register('currentPassword')}
              className="mt-1"
              aria-describedby={errors.currentPassword ? "currentPassword-error" : undefined}
              aria-invalid={!!errors.currentPassword}
            />
            {errors.currentPassword && (
              <p id="currentPassword-error" className="text-sm text-destructive mt-1" role="alert">
                {errors.currentPassword.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="newPassword">Mật khẩu mới</Label>
            <Input
              id="newPassword"
              type="password"
              {...register('newPassword')}
              className="mt-1"
              aria-describedby={errors.newPassword ? "newPassword-error newPassword-strength" : "newPassword-strength"}
              aria-invalid={!!errors.newPassword}
            />
            {errors.newPassword && (
              <p id="newPassword-error" className="text-sm text-destructive mt-1" role="alert">
                {errors.newPassword.message}
              </p>
            )}
            {/* Password Strength Indicator */}
            <div id="newPassword-strength">
              <PasswordStrengthIndicator password={newPassword} />
            </div>
          </div>

          <div>
            <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
            <Input
              id="confirmPassword"
              type="password"
              {...register('confirmPassword')}
              className="mt-1"
              aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
              aria-invalid={!!errors.confirmPassword}
            />
            {errors.confirmPassword && (
              <p id="confirmPassword-error" className="text-sm text-destructive mt-1" role="alert">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isChangingPassword}
            className="bg-rose-600 hover:bg-rose-700 transition-all duration-200"
          >
            {isChangingPassword ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Đang xử lý...</>) : 'Đổi mật khẩu'}
          </Button>
        </form>
      </div>

      {/* Two-Factor Authentication */}
      <div className={`p-4 border rounded-lg ${settings?.twoFactorEnabled ? 'border-green-500/30 bg-green-500/10 dark:border-green-500/30 dark:bg-green-500/10' : 'border-border'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {settings?.twoFactorEnabled ? (
              <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
            ) : (
              <Shield className="h-5 w-5 text-muted-foreground" />
            )}
            <div>
              <h4 className="font-medium text-foreground">Xác thực hai yếu tố (2FA)</h4>
              <p className={`text-sm ${settings?.twoFactorEnabled ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                {settings?.twoFactorEnabled ? 'Đã bật - Tài khoản được bảo vệ' : 'Chưa bật - Bảo vệ tài khoản bằng mã xác thực'}
              </p>
            </div>
          </div>
          {settings?.twoFactorEnabled ? (
            <Button
              variant="outline"
              className="border-red-500/50 text-red-600 hover:bg-red-500/10 dark:border-red-500/50 dark:text-red-400 dark:hover:bg-red-500/10"
              onClick={() => setShowDisable2FADialog(true)}
            >
              <ShieldOff className="h-4 w-4 mr-2" />
              Tắt 2FA
            </Button>
          ) : (
            <Button
              variant="outline"
              className="border-green-500/50 text-green-600 hover:bg-green-500/10 dark:border-green-500/50 dark:text-green-400 dark:hover:bg-green-500/10"
              onClick={() => setShow2FASetup(true)}
            >
              <ShieldCheck className="h-4 w-4 mr-2" />
              Bật 2FA
            </Button>
          )}
        </div>
      </div>

      {/* Session Management */}
      <div className="p-4 border border-border rounded-lg">
        <div className="flex items-center gap-3 mb-4">
          <Monitor className="h-5 w-5 text-muted-foreground" />
          <div>
            <h4 className="font-medium text-foreground">Phiên đăng nhập</h4>
            <p className="text-sm text-muted-foreground">Quản lý các thiết bị đang đăng nhập vào tài khoản của bạn</p>
          </div>
        </div>
        <SessionsManager />
      </div>

      {/* Delete Account */}
      <div className="p-4 border border-red-500/30 rounded-lg bg-red-500/10 dark:border-red-500/30 dark:bg-red-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trash2 className="h-5 w-5 text-red-500 dark:text-red-400" />
            <div>
              <h4 className="font-medium text-red-700 dark:text-red-300">Xóa tài khoản</h4>
              <p className="text-sm text-red-600 dark:text-red-400">
                {hasPendingDeletion
                  ? 'Tài khoản đang chờ xóa - bạn có thể hủy yêu cầu này'
                  : 'Yêu cầu xóa tài khoản (có 14 ngày để hủy)'}
              </p>
            </div>
          </div>
          {hasPendingDeletion ? (
            <Button
              variant="outline"
              className="border-yellow-500/50 text-yellow-600 hover:bg-yellow-500/10 dark:border-yellow-500/50 dark:text-yellow-400 dark:hover:bg-yellow-500/10"
              onClick={handleCancelDeletion}
              disabled={isCancellingDeletion}
            >
              {isCancellingDeletion ? 'Đang hủy...' : 'Hủy xóa tài khoản'}
            </Button>
          ) : (
            <Button
              variant="outline"
              className="border-red-500/50 text-red-600 hover:bg-red-500/10 dark:border-red-500/50 dark:text-red-400 dark:hover:bg-red-500/10"
              onClick={() => setShowDeleteDialog(true)}
            >
              Xóa tài khoản
            </Button>
          )}
        </div>
      </div>

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Yêu cầu xóa tài khoản
            </DialogTitle>
            <DialogDescription className="space-y-2">
              <span className="block">
                Sau khi xác nhận, tài khoản của bạn sẽ được lên lịch xóa sau <strong>14 ngày</strong>.
              </span>
              <span className="block">
                Trong thời gian này, bạn vẫn có thể đăng nhập và hủy yêu cầu xóa. Sau 14 ngày, tất cả dữ liệu sẽ bị xóa vĩnh viễn và không thể khôi phục.
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="deletePassword">Nhập mật khẩu để xác nhận</Label>
            <Input
              id="deletePassword"
              type="password"
              value={deletePassword}
              onChange={(e) => { setDeletePassword(e.target.value); setDeleteError(''); }}
              className="mt-1"
              placeholder="Mật khẩu của bạn"
              aria-describedby={deleteError ? "deletePassword-error" : undefined}
              aria-invalid={!!deleteError}
            />
            {deleteError && (
              <p id="deletePassword-error" className="text-sm text-destructive mt-1" role="alert">
                {deleteError}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Hủy</Button>
            <Button variant="destructive" onClick={handleDeleteAccount} disabled={isDeletingAccount}>
              {isDeletingAccount ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Đang xử lý...</>) : 'Xác nhận xóa tài khoản'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2FA Setup Dialog */}
      <TwoFactorSetup open={show2FASetup} onOpenChange={setShow2FASetup} />

      {/* Disable 2FA Dialog */}
      <Dialog open={showDisable2FADialog} onOpenChange={setShowDisable2FADialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <ShieldOff className="h-5 w-5" />
              Tắt xác thực hai yếu tố
            </DialogTitle>
            <DialogDescription>
              Tắt 2FA sẽ làm giảm bảo mật tài khoản của bạn. Nhập mật khẩu để xác nhận.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="disable2FAPassword">Mật khẩu</Label>
            <Input
              id="disable2FAPassword"
              type="password"
              value={disable2FAPassword}
              onChange={(e) => { setDisable2FAPassword(e.target.value); setDisable2FAError(''); }}
              className="mt-1"
              placeholder="Nhập mật khẩu của bạn"
              aria-describedby={disable2FAError ? "disable2FAPassword-error" : undefined}
              aria-invalid={!!disable2FAError}
            />
            {disable2FAError && (
              <p id="disable2FAPassword-error" className="text-sm text-destructive mt-1" role="alert">
                {disable2FAError}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDisable2FADialog(false); setDisable2FAPassword(''); setDisable2FAError(''); }}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleDisable2FA} disabled={isDisabling2FA}>
              {isDisabling2FA ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Đang xử lý...</>) : 'Tắt 2FA'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

