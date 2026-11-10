'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLogout } from '../api/auth';

interface IdleWarningModalProps {
  open: boolean;
  countdown: number;
  onStayLoggedIn: () => void;
}

export function IdleWarningModal({ open, countdown, onStayLoggedIn }: IdleWarningModalProps) {
  const logoutMutation = useLogout();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const formatCountdown = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins} phút ${secs} giây`;
    }
    return `${secs} giây`;
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Phiên đăng nhập sắp hết hạn</DialogTitle>
          <DialogDescription>
            Bạn đã không hoạt động trong một thời gian. Phiên đăng nhập của bạn sẽ tự động kết thúc sau{' '}
            <span className="font-semibold text-foreground">{formatCountdown(countdown)}</span>.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={handleLogout} className="w-full sm:w-auto">
            Đăng xuất
          </Button>
          <Button onClick={onStayLoggedIn} className="w-full sm:w-auto">
            Ở lại
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

