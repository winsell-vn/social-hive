'use client';

import { FileText, PenSquare } from 'lucide-react';
import { EmptyState } from './EmptyState';

interface NoPostsProps {
  isOwnProfile?: boolean;
  onCreatePost?: () => void;
  className?: string;
}

export function NoPosts({ isOwnProfile, onCreatePost, className }: NoPostsProps) {
  return (
    <EmptyState
      icon={FileText}
      title="Chưa có bài viết nào"
      description={
        isOwnProfile
          ? 'Bạn chưa có bài viết nào. Hãy chia sẻ điều gì đó!'
          : 'Hãy là người đầu tiên chia sẻ!'
      }
      action={
        onCreatePost
          ? {
              label: 'Tạo bài viết',
              onClick: onCreatePost,
            }
          : undefined
      }
      className={className}
    >
      {onCreatePost && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <PenSquare className="h-4 w-4" />
          <span>Nhấn để bắt đầu viết</span>
        </div>
      )}
    </EmptyState>
  );
}

