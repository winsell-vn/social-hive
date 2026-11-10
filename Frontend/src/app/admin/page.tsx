'use client';

import { usePlatformStats } from '@/features/admin';
import { StatsCard } from '@/features/admin';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, FileText, MessageSquare, Clock, UserPlus, TrendingUp, Activity } from 'lucide-react';

export default function AdminDashboardPage() {
  const { data: stats, isLoading, error } = usePlatformStats();

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Không thể tải dữ liệu thống kê</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tổng quan</h1>
        <p className="text-gray-500 mt-1">Thống kê tổng quan về nền tảng</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            icon={Users}
            label="Tổng người dùng"
            value={stats.totalUsers}
          />
          <StatsCard
            icon={FileText}
            label="Tổng bài viết"
            value={stats.totalPosts}
          />
          <StatsCard
            icon={MessageSquare}
            label="Tổng bình luận"
            value={stats.totalComments}
          />
          <StatsCard
            icon={Clock}
            label="Bài viết chờ duyệt"
            value={stats.pendingPosts}
            className={stats.pendingPosts > 0 ? 'border-amber-200 bg-amber-50' : ''}
          />
          <StatsCard
            icon={Activity}
            label="Người dùng hoạt động (24h)"
            value={stats.activeUsers24h}
          />
          <StatsCard
            icon={UserPlus}
            label="Người dùng mới hôm nay"
            value={stats.newUsersToday}
          />
          <StatsCard
            icon={TrendingUp}
            label="Bài viết mới hôm nay"
            value={stats.newPostsToday}
          />
        </div>
      ) : null}
    </div>
  );
}

