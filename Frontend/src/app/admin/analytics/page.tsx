'use client';

import { usePlatformStats } from '@/features/admin';
import { StatsCard } from '@/features/admin';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  FileText,
  MessageSquare,
  TrendingUp,
  Activity,
  UserPlus,
  BarChart3,
} from 'lucide-react';

export default function AnalyticsPage() {
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
        <h1 className="text-2xl font-bold text-gray-900">Thống kê</h1>
        <p className="text-gray-500 mt-1">Phân tích chi tiết hoạt động nền tảng</p>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      ) : stats ? (
        <div className="space-y-6">
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          </div>

          {/* Activity Stats */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-rose-600" />
              Hoạt động hôm nay
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Activity className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.activeUsers24h.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">Người dùng hoạt động</p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <UserPlus className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.newUsersToday.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">Người dùng mới</p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.newPostsToday.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">Bài viết mới</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Placeholder for future charts */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Biểu đồ hoạt động
            </h2>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <p className="text-gray-400">Biểu đồ sẽ được thêm sau</p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

