'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, formatRelativeTime, getInitials } from '@/lib/utils';
import { getAvatarUrl } from '@/lib/image-url';
import { Check, X, ImageIcon } from 'lucide-react';
import type { PendingPost } from '../types/admin';

interface PostReviewCardProps {
  post: PendingPost;
  onApprove: (postId: string) => void;
  onReject: (postId: string, reason: string) => void;
  isLoading?: boolean;
}

const tierColors: Record<string, string> = {
  NEWCOMER: 'bg-gray-100 text-gray-700',
  CONTRIBUTOR: 'bg-blue-100 text-blue-700',
  EXPERT: 'bg-purple-100 text-purple-700',
  MASTER: 'bg-amber-100 text-amber-700',
  LEGEND: 'bg-rose-100 text-rose-700',
};

const tierLabels: Record<string, string> = {
  NEWCOMER: 'Người mới',
  CONTRIBUTOR: 'Đóng góp',
  EXPERT: 'Chuyên gia',
  MASTER: 'Bậc thầy',
  LEGEND: 'Huyền thoại',
};

export function PostReviewCard({ post, onApprove, onReject, isLoading }: PostReviewCardProps) {
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const handleApprove = () => {
    onApprove(post.id);
  };

  const handleReject = () => {
    if (showRejectInput) {
      onReject(post.id, rejectReason);
      setShowRejectInput(false);
      setRejectReason('');
    } else {
      setShowRejectInput(true);
    }
  };

  const handleCancelReject = () => {
    setShowRejectInput(false);
    setRejectReason('');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Author Header */}
      <div className="p-4 flex items-center gap-3 border-b border-gray-100">
        <Avatar className="h-10 w-10">
          <AvatarImage src={getAvatarUrl(post.author.avatar)} alt={post.author.username} />
          <AvatarFallback className="bg-rose-100 text-rose-600">
            {getInitials(post.author.displayName || post.author.username)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900">
              {post.author.displayName || post.author.username}
            </span>
            <Badge className={cn('text-xs', tierColors[post.author.tier] || tierColors.NEWCOMER)}>
              {tierLabels[post.author.tier] || 'Người mới'}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>@{post.author.username}</span>
            <span>·</span>
            <span>{formatRelativeTime(post.createdAt)}</span>
            <span>·</span>
            <span>{post.author.karma.toLocaleString()} karma</span>
          </div>
        </div>
      </div>

      {/* Post Content */}
      <div className="p-4">
        <p className="text-gray-900 whitespace-pre-wrap">{post.content}</p>
      </div>

      {/* Images Preview */}
      {post.images && post.images.length > 0 && (
        <div className="px-4 pb-4">
          <div className={cn(
            'grid gap-2',
            post.images.length === 1 ? 'grid-cols-1' : 
            post.images.length === 2 ? 'grid-cols-2' : 
            'grid-cols-2'
          )}>
            {post.images.slice(0, 4).map((image, index) => (
              <div
                key={index}
                className={cn(
                  'relative rounded-lg overflow-hidden bg-gray-100',
                  post.images.length === 1 ? 'aspect-video' : 'aspect-square'
                )}
              >
                <img
                  src={image}
                  alt={`Ảnh ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                {index === 3 && post.images.length > 4 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white text-xl font-bold">
                      +{post.images.length - 4}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
          {post.images.length > 0 && (
            <div className="flex items-center gap-1 mt-2 text-sm text-gray-500">
              <ImageIcon className="h-4 w-4" />
              <span>{post.images.length} ảnh</span>
            </div>
          )}
        </div>
      )}

      {/* Reject Reason Input */}
      {showRejectInput && (
        <div className="px-4 pb-4">
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Nhập lý do từ chối..."
            className="w-full p-3 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-rose-500"
            rows={3}
          />
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center gap-3">
        <Button
          onClick={handleApprove}
          disabled={isLoading || showRejectInput}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
        >
          <Check className="h-4 w-4 mr-2" />
          Duyệt
        </Button>
        {showRejectInput ? (
          <>
            <Button
              onClick={handleCancelReject}
              variant="outline"
              disabled={isLoading}
              className="flex-1"
            >
              Hủy
            </Button>
            <Button
              onClick={handleReject}
              disabled={isLoading || !rejectReason.trim()}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              Xác nhận từ chối
            </Button>
          </>
        ) : (
          <Button
            onClick={handleReject}
            disabled={isLoading}
            variant="outline"
            className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
          >
            <X className="h-4 w-4 mr-2" />
            Từ chối
          </Button>
        )}
      </div>
    </div>
  );
}

export function PostReviewCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 flex items-center gap-3 border-b border-gray-100">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
      </div>
      <div className="p-4 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex gap-3">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 flex-1" />
      </div>
    </div>
  );
}

