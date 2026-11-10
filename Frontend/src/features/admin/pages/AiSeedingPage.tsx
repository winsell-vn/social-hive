'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  useAiSeedingDashboard,
  useHourlyActivity,
  useActivityLogs,
  useAiAgents,
  exportActivityLogsCSV,
  type ActivityLog,
  type HourlyActivityData,
} from '../api/ai-seeding.api';
import { StatsCard } from '../components/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Bot, Key, Activity, Clock, CheckCircle, XCircle, AlertTriangle, Play, Pause, ArrowRight, RefreshCw, FileText, MessageSquare, Heart, Download, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const AUTO_REFRESH_INTERVAL = 30 * 1000; // 30 seconds

export function AiSeedingPage() {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Activity log filters (match backend AiActivityQueryDto)
  const [logFilters, setLogFilters] = useState<{
    agentId?: string;
    actionType?: string;
    success?: boolean;
    filterResult?: string;
    page: number;
  }>({ page: 1 });

  const { data, isLoading, error, refetch } = useAiSeedingDashboard();
  const { data: hourlyData, isLoading: hourlyLoading } = useHourlyActivity(24);
  const { data: activityData, isLoading: activityLoading } = useActivityLogs({ ...logFilters, limit: 10 });
  const { data: agentsData } = useAiAgents({ limit: 100 });

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refetch();
      setLastRefresh(new Date());
    }, AUTO_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [autoRefresh, refetch]);

  const handleManualRefresh = () => {
    refetch();
    setLastRefresh(new Date());
    toast.success('Đã làm mới dữ liệu');
  };

  const handleExportCSV = async () => {
    try {
      await exportActivityLogsCSV(logFilters);
      toast.success('Đã xuất file CSV');
    } catch {
      toast.error('Không thể xuất file CSV');
    }
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
        <p className="text-red-600">Không thể tải dữ liệu AI Seeding</p>
        <p className="text-gray-500 text-sm mt-2">Vui lòng thử lại sau</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Seeding</h1>
          <p className="text-gray-500 mt-1">Quản lý AI agents và nội dung tự động</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Auto-refresh controls */}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Cập nhật lúc: {lastRefresh.toLocaleTimeString('vi-VN')}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleManualRefresh}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
            </Button>
            <Button
              variant={autoRefresh ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className="text-xs"
            >
              {autoRefresh ? 'Tự động: BẬT' : 'Tự động: TẮT'}
            </Button>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/ai-seeding/api-keys">
              <Button variant="outline">
                <Key className="h-4 w-4 mr-2" />
                API Keys
              </Button>
            </Link>
            <Link href="/admin/ai-seeding/agents">
              <Button>
                <Bot className="h-4 w-4 mr-2" />
                Quản lý Agents
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : data ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            icon={Key}
            label="API Keys"
            value={`${data.apiKeys?.active ?? 0}/${data.apiKeys?.total ?? 0}`}
          />
          <StatsCard
            icon={Bot}
            label="AI Agents hoạt động"
            value={data.agents?.active ?? 0}
          />
          <StatsCard
            icon={Activity}
            label="Tỷ lệ thành công"
            value={`${(data.activity?.successRate ?? 0).toFixed(1)}%`}
          />
          <StatsCard
            icon={Clock}
            label="Đang chờ xử lý"
            value={(data.queue?.waiting ?? 0) + (data.queue?.delayed ?? 0)}
          />
        </div>
      ) : null}

      {/* Queue Status & Agent Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Queue Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Trạng thái Queue</CardTitle>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <Play className="h-3 w-3 mr-1" />
              Đang chạy
            </Badge>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-8" />
                ))}
              </div>
            ) : data ? (
              <div className="space-y-3">
                <QueueItem label="Đang chờ" value={data.queue?.waiting ?? 0} color="text-amber-600" />
                <QueueItem label="Đang xử lý" value={data.queue?.active ?? 0} color="text-blue-600" />
                <QueueItem label="Hoàn thành" value={data.queue?.completed ?? 0} color="text-green-600" />
                <QueueItem label="Thất bại" value={data.queue?.failed ?? 0} color="text-red-600" />
                <QueueItem label="Đã lên lịch" value={data.queue?.delayed ?? 0} color="text-purple-600" />
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Agent Summary */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Tổng quan Agents</CardTitle>
            <Link href="/admin/ai-seeding/agents">
              <Button variant="ghost" size="sm">
                Xem tất cả
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-8" />
                ))}
              </div>
            ) : data ? (
              <div className="space-y-3">
                <AgentStatusItem
                  icon={CheckCircle}
                  label="Đang hoạt động"
                  value={data.agents?.active ?? 0}
                  color="text-green-600"
                  bgColor="bg-green-50"
                />
                <AgentStatusItem
                  icon={Pause}
                  label="Tạm dừng"
                  value={data.agents?.paused ?? 0}
                  color="text-amber-600"
                  bgColor="bg-amber-50"
                />
                <AgentStatusItem
                  icon={XCircle}
                  label="Đã vô hiệu"
                  value={data.agents?.disabled ?? 0}
                  color="text-gray-600"
                  bgColor="bg-gray-50"
                />
                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-gray-900">Tổng cộng</span>
                    <span className="font-bold text-gray-900">{data.agents?.total ?? 0}</span>
                  </div>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* Hourly Activity Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Hoạt động theo giờ (24h)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hourlyLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : hourlyData && hourlyData.length > 0 ? (
            <HourlyChart data={hourlyData} />
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-500">
              Chưa có dữ liệu hoạt động
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity Log */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Nhật ký hoạt động</CardTitle>
          <div className="flex items-center gap-2">
            {/* Filters */}
            <select
              className="text-sm border rounded-md px-2 py-1"
              value={logFilters.agentId || ''}
              onChange={(e) => setLogFilters({ ...logFilters, agentId: e.target.value || undefined, page: 1 })}
            >
              <option value="">Tất cả agents</option>
              {(agentsData?.agents ?? []).map((agent) => (
                <option key={agent.id} value={agent.id}>{agent.name}</option>
              ))}
            </select>
            <select
              className="text-sm border rounded-md px-2 py-1"
              value={logFilters.actionType || ''}
              onChange={(e) => setLogFilters({ ...logFilters, actionType: e.target.value || undefined, page: 1 })}
            >
              <option value="">Tất cả loại</option>
              <option value="POST">Bài viết</option>
              <option value="COMMENT">Bình luận</option>
              <option value="REACTION">Tương tác</option>
            </select>
            <select
              className="text-sm border rounded-md px-2 py-1"
              value={logFilters.success === undefined ? '' : String(logFilters.success)}
              onChange={(e) =>
                setLogFilters({
                  ...logFilters,
                  success: e.target.value === '' ? undefined : e.target.value === 'true',
                  page: 1,
                })
              }
            >
              <option value="">Tất cả trạng thái</option>
              <option value="true">Thành công</option>
              <option value="false">Thất bại</option>
            </select>
            <select
              className="text-sm border rounded-md px-2 py-1"
              value={logFilters.filterResult || ''}
              onChange={(e) =>
                setLogFilters({
                  ...logFilters,
                  filterResult: e.target.value || undefined,
                  page: 1,
                })
              }
            >
              <option value="">Tất cả kết quả lọc</option>
              <option value="PASSED">Đạt</option>
              <option value="BLOCKED_PROFANITY">Chặn - từ ngữ thô tục</option>
              <option value="BLOCKED_DUPLICATE">Chặn - trùng lặp</option>
              <option value="BLOCKED_QUALITY">Chặn - chất lượng</option>
              <option value="BLOCKED_SPAM">Chặn - spam</option>
            </select>
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-1" />
              Xuất CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {activityLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : activityData && (activityData.logs ?? []).length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      <th className="pb-2 font-medium">Thời gian</th>
                      <th className="pb-2 font-medium">Agent</th>
                      <th className="pb-2 font-medium">Loại</th>
                      <th className="pb-2 font-medium">Trạng thái</th>
                      <th className="pb-2 font-medium">Nội dung</th>
                      <th className="pb-2 font-medium">Tokens</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(activityData.logs ?? []).map((log) => (
                      <ActivityLogRow key={log.id} log={log} />
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <span className="text-sm text-gray-500">
                  Trang {activityData.page} / {activityData.totalPages} ({activityData.total} bản ghi)
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={logFilters.page <= 1}
                    onClick={() => setLogFilters({ ...logFilters, page: logFilters.page - 1 })}
                  >
                    Trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={logFilters.page >= activityData.totalPages}
                    onClick={() => setLogFilters({ ...logFilters, page: logFilters.page + 1 })}
                  >
                    Sau
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Chưa có nhật ký hoạt động</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Helper Components
function QueueItem({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`font-semibold ${color}`}>{value.toLocaleString('vi-VN')}</span>
    </div>
  );
}

function AgentStatusItem({
  icon: Icon,
  label,
  value,
  color,
  bgColor,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
  bgColor: string;
}) {
  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-2">
        <div className={`p-1.5 rounded ${bgColor}`}>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
        <span className="text-sm text-gray-600">{label}</span>
      </div>
      <span className={`font-semibold ${color}`}>{value}</span>
    </div>
  );
}

// Hourly Activity Chart Component
function HourlyChart({ data }: { data: HourlyActivityData[] }) {
  const maxValue = Math.max(...data.map((d) => d.total), 1);

  return (
    <div className="h-48">
      <div className="flex items-end justify-between h-40 gap-1">
        {data.map((item, index) => (
            <div key={index} className="flex-1 flex flex-col items-center group relative">
              <div className="w-full flex flex-col-reverse" style={{ height: '160px' }}>
                {/* Posts */}
                <div
                  className="w-full bg-blue-500 rounded-t-sm transition-all"
                  style={{ height: `${(item.posts / maxValue) * 100}%` }}
                />
                {/* Comments */}
                <div
                  className="w-full bg-green-500"
                  style={{ height: `${(item.comments / maxValue) * 100}%` }}
                />
                {/* Reactions */}
                <div
                  className="w-full bg-amber-500 rounded-t-sm"
                  style={{ height: `${(item.reactions / maxValue) * 100}%` }}
                />
              </div>
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                <div>{item.hour}</div>
                <div>Bài viết: {item.posts}</div>
                <div>Bình luận: {item.comments}</div>
                <div>Tương tác: {item.reactions}</div>
              </div>
            </div>
        ))}
      </div>
      {/* X-axis labels */}
      <div className="flex justify-between mt-2 text-xs text-gray-500">
        {data.filter((_, i) => i % 4 === 0).map((item, index) => (
          <span key={index}>{item.hour}</span>
        ))}
      </div>
      {/* Legend */}
      <div className="flex justify-center gap-4 mt-2 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-500 rounded-sm" />
          <span>Bài viết</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-500 rounded-sm" />
          <span>Bình luận</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-amber-500 rounded-sm" />
          <span>Tương tác</span>
        </div>
      </div>
    </div>
  );
}

// Activity Log Row Component
function ActivityLogRow({ log }: { log: ActivityLog }) {
  const actionIcons = {
    POST: FileText,
    COMMENT: MessageSquare,
    REACTION: Heart,
  };

  const statusColors = {
    SUCCESS: 'bg-green-100 text-green-700',
    FAILED: 'bg-red-100 text-red-700',
    FILTERED: 'bg-amber-100 text-amber-700',
  };

  const ActionIcon = actionIcons[log.actionType as keyof typeof actionIcons] || Activity;

  // The backend returns `success` + `filterResult` instead of a single status.
  const isFiltered = log.filterResult && log.filterResult !== 'PASSED';
  const statusKey = !log.success ? 'FAILED' : isFiltered ? 'FILTERED' : 'SUCCESS';
  const statusClass = statusColors[statusKey];
  const statusLabel = !log.success
    ? 'FAILED'
    : isFiltered
      ? log.filterResult
      : 'SUCCESS';

  return (
    <tr className="border-b hover:bg-gray-50">
      <td className="py-2 text-gray-600">
        {new Date(log.createdAt).toLocaleString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          day: '2-digit',
          month: '2-digit',
        })}
      </td>
      <td className="py-2">
        <span className="font-medium">{log.agent?.name || 'Unknown'}</span>
      </td>
      <td className="py-2">
        <div className="flex items-center gap-1">
          <ActionIcon className="h-4 w-4 text-gray-500" />
          <span>{log.actionType}</span>
        </div>
      </td>
      <td className="py-2">
        <Badge className={cn('text-xs', statusClass)}>
          {statusLabel}
        </Badge>
      </td>
      <td className="py-2 max-w-xs truncate text-gray-600" title={log.content || ''}>
        {log.content ? log.content.substring(0, 50) + (log.content.length > 50 ? '...' : '') : '-'}
      </td>
      <td className="py-2 text-gray-600">
        {log.tokensUsed || 0}
      </td>
    </tr>
  );
}

