'use client';

import { AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { DeletionStatus } from '../types/settings';

interface AccountDeletionBannerProps {
  deletionStatus: DeletionStatus;
  onCancelDeletion: () => void;
  isCancelling: boolean;
}

export function AccountDeletionBanner({
  deletionStatus,
  onCancelDeletion,
  isCancelling,
}: AccountDeletionBannerProps) {
  if (!deletionStatus.isScheduledForDeletion) {
    return null;
  }

  // Format the deletion date in Vietnamese locale
  const deletionDate = deletionStatus.deletionScheduledFor
    ? new Date(deletionStatus.deletionScheduledFor).toLocaleDateString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  const daysRemaining = deletionStatus.daysRemaining ?? 0;

  return (
    <Alert variant="warning" className="mb-6" role="alert" aria-live="polite">
      <AlertTriangle className="h-5 w-5" aria-hidden="true" />
      <AlertTitle className="text-base font-semibold">
        Tài khoản đang chờ xóa
      </AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-3">
          Tài khoản của bạn sẽ bị xóa vĩnh viễn vào{' '}
          <span className="font-semibold">{deletionDate}</span>
          {daysRemaining > 0 && (
            <span> (còn {daysRemaining} ngày)</span>
          )}
          . Sau thời gian này, tất cả dữ liệu của bạn sẽ bị xóa và không thể khôi phục.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={onCancelDeletion}
          disabled={isCancelling}
          className="border-yellow-600/50 text-yellow-700 hover:bg-yellow-500/20 dark:border-yellow-500/50 dark:text-yellow-400 dark:hover:bg-yellow-500/20 transition-all duration-200 min-h-[44px]"
          aria-label="Hủy yêu cầu xóa tài khoản"
        >
          {isCancelling ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
              Đang hủy...
            </>
          ) : (
            'Hủy yêu cầu xóa tài khoản'
          )}
        </Button>
      </AlertDescription>
    </Alert>
  );
}

