'use client';

import { usePendingPosts, useModeratePost } from '../api/admin';
import { PostReviewCard, PostReviewCardSkeleton } from './PostReviewCard';
import { Button } from '@/components/ui/button';
import { Inbox, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export function ModerationQueue() {
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefetching,
  } = usePendingPosts();

  const moderatePost = useModeratePost();

  const handleApprove = async (postId: string) => {
    try {
      await moderatePost.mutateAsync({ postId, action: 'APPROVE' });
      toast.success('Đã duyệt bài viết');
    } catch (error) {
      toast.error('Không thể duyệt bài viết');
    }
  };

  const handleReject = async (postId: string, reason: string) => {
    try {
      await moderatePost.mutateAsync({ postId, action: 'REJECT', reason });
      toast.success('Đã từ chối bài viết');
    } catch (error) {
      toast.error('Không thể từ chối bài viết');
    }
  };

  const allPosts = data?.pages.flatMap((page) => page.data) ?? [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <PostReviewCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (allPosts.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Inbox className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Không có bài viết chờ duyệt</h3>
        <p className="text-gray-500 mt-1">Tất cả bài viết đã được xử lý.</p>
        <Button
          onClick={() => refetch()}
          variant="outline"
          className="mt-4"
          disabled={isRefetching}
        >
          {isRefetching ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Làm mới
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {data?.pages[0]?.meta.total || 0} bài viết chờ duyệt
        </p>
        <Button
          onClick={() => refetch()}
          variant="outline"
          size="sm"
          disabled={isRefetching}
        >
          {isRefetching ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Làm mới
        </Button>
      </div>

      {allPosts.map((post) => (
        <PostReviewCard
          key={post.id}
          post={post}
          onApprove={handleApprove}
          onReject={handleReject}
          isLoading={moderatePost.isPending}
        />
      ))}

      {hasNextPage && (
        <div className="flex justify-center pt-4">
          <Button
            onClick={() => fetchNextPage()}
            variant="outline"
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : null}
            Tải thêm
          </Button>
        </div>
      )}
    </div>
  );
}

