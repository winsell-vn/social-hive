'use client';

import { Bell } from 'lucide-react';
import { EmptyState } from './EmptyState';

interface NoNotificationsProps {
  className?: string;
}

export function NoNotifications({ className }: NoNotificationsProps) {
  return (
    <EmptyState
      icon={Bell}
      title="Không có thông báo mới"
      description="Bạn đã xem hết thông báo. Chúng tôi sẽ thông báo khi có hoạt động mới."
      className={className}
    />
  );
}

