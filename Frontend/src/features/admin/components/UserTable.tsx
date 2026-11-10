'use client';

import { useState } from 'react';
import { useUsers, useBanUser, useUnbanUser, useChangeUserRole } from '../api/admin';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, formatRelativeTime, getInitials } from '@/lib/utils';
import { getAvatarUrl } from '@/lib/image-url';
import { Search, Ban, UserCheck, ChevronDown, Loader2, Users } from 'lucide-react';
import { toast } from 'sonner';
import type { UserFilters, UserManagement } from '../types/admin';

const roleLabels: Record<string, string> = {
  GUEST: 'Khách',
  USER: 'Người dùng',
  ADMIN: 'Quản trị viên',
  SUPER_ADMIN: 'Siêu quản trị',
};

const roleColors: Record<string, string> = {
  GUEST: 'bg-gray-100 text-gray-500',
  USER: 'bg-gray-100 text-gray-700',
  ADMIN: 'bg-rose-100 text-rose-700',
  SUPER_ADMIN: 'bg-purple-100 text-purple-700',
};

const tierLabels: Record<string, string> = {
  NEWCOMER: 'Người mới',
  CONTRIBUTOR: 'Đóng góp',
  EXPERT: 'Chuyên gia',
  MASTER: 'Bậc thầy',
  LEGEND: 'Huyền thoại',
};

export function UserTable() {
  const [filters, setFilters] = useState<UserFilters>({});
  const [searchInput, setSearchInput] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [showRoleDropdown, setShowRoleDropdown] = useState<string | null>(null);

  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = useUsers(filters);
  const banUser = useBanUser();
  const unbanUser = useUnbanUser();
  const changeRole = useChangeUserRole();

  const handleSearch = () => {
    setFilters((prev) => ({ ...prev, search: searchInput || undefined }));
  };

  const handleRoleFilter = (role: string) => {
    setRoleFilter(role);
    setFilters((prev) => ({
      ...prev,
      role: role ? (role as 'GUEST' | 'USER' | 'ADMIN' | 'SUPER_ADMIN') : undefined,
    }));
  };

  const handleBan = async (userId: string) => {
    try {
      await banUser.mutateAsync(userId);
      toast.success('Đã cấm người dùng');
    } catch {
      toast.error('Không thể cấm người dùng');
    }
  };

  const handleUnban = async (userId: string) => {
    try {
      await unbanUser.mutateAsync(userId);
      toast.success('Đã bỏ cấm người dùng');
    } catch {
      toast.error('Không thể bỏ cấm người dùng');
    }
  };

  const handleChangeRole = async (userId: string, role: 'GUEST' | 'USER' | 'ADMIN' | 'SUPER_ADMIN') => {
    try {
      await changeRole.mutateAsync({ userId, role });
      toast.success('Đã thay đổi vai trò');
      setShowRoleDropdown(null);
    } catch {
      toast.error('Không thể thay đổi vai trò');
    }
  };

  const allUsers = data?.pages.flatMap((page) => page.data) ?? [];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex gap-2">
          <Input
            placeholder="Tìm kiếm theo tên hoặc email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1"
          />
          <Button onClick={handleSearch} variant="outline">
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <select
          value={roleFilter}
          onChange={(e) => handleRoleFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
        >
          <option value="">Tất cả vai trò</option>
          <option value="GUEST">Khách</option>
          <option value="USER">Người dùng</option>
          <option value="ADMIN">Quản trị viên</option>
          <option value="SUPER_ADMIN">Siêu quản trị</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Người dùng
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Vai trò
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Cấp độ
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Karma
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Trạng thái
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3"><Skeleton className="h-10 w-40" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-6 w-20" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-12" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-6 w-16" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-8 w-24 ml-auto" /></td>
                  </tr>
                ))
              ) : allUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Không tìm thấy người dùng</p>
                  </td>
                </tr>
              ) : (
                allUsers.map((user) => (
                  <UserTableRow
                    key={user.id}
                    user={user}
                    onBan={handleBan}
                    onUnban={handleUnban}
                    onChangeRole={handleChangeRole}
                    showRoleDropdown={showRoleDropdown}
                    setShowRoleDropdown={setShowRoleDropdown}
                    isLoading={banUser.isPending || unbanUser.isPending || changeRole.isPending}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {hasNextPage && (
        <div className="flex justify-center">
          <Button onClick={() => fetchNextPage()} variant="outline" disabled={isFetchingNextPage}>
            {isFetchingNextPage && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Tải thêm
          </Button>
        </div>
      )}
    </div>
  );
}

interface UserTableRowProps {
  user: UserManagement;
  onBan: (userId: string) => void;
  onUnban: (userId: string) => void;
  onChangeRole: (userId: string, role: 'GUEST' | 'USER' | 'ADMIN' | 'SUPER_ADMIN') => void;
  showRoleDropdown: string | null;
  setShowRoleDropdown: (userId: string | null) => void;
  isLoading: boolean;
}

function UserTableRow({
  user,
  onBan,
  onUnban,
  onChangeRole,
  showRoleDropdown,
  setShowRoleDropdown,
  isLoading,
}: UserTableRowProps) {
  const displayName = user.profile?.displayName || user.profile?.username || 'Người dùng';
  const username = user.profile?.username || 'unknown';
  const avatarUrl = getAvatarUrl(user.profile?.avatar);

  return (
    <tr className={cn(user.isBanned && 'bg-red-50')}>
      {/* User Info */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback className="bg-rose-100 text-rose-600 text-xs">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-gray-900 text-sm">{displayName}</p>
            <p className="text-xs text-gray-500">@{username}</p>
          </div>
        </div>
      </td>

      {/* Email */}
      <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>

      {/* Role with dropdown */}
      <td className="px-4 py-3">
        <div className="relative">
          <button
            onClick={() => setShowRoleDropdown(showRoleDropdown === user.id ? null : user.id)}
            className={cn(
              'inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium',
              roleColors[user.role] || roleColors.USER
            )}
          >
            {roleLabels[user.role] || 'Người dùng'}
            <ChevronDown className="h-3 w-3" />
          </button>

          {showRoleDropdown === user.id && (
            <div className="absolute z-10 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[140px]">
              {(['GUEST', 'USER', 'ADMIN', 'SUPER_ADMIN'] as const).map((role) => (
                <button
                  key={role}
                  onClick={() => onChangeRole(user.id, role)}
                  disabled={isLoading || user.role === role}
                  className={cn(
                    'w-full px-3 py-1.5 text-left text-sm hover:bg-gray-50',
                    user.role === role && 'bg-gray-100 font-medium'
                  )}
                >
                  {roleLabels[role]}
                </button>
              ))}
            </div>
          )}
        </div>
      </td>

      {/* Tier */}
      <td className="px-4 py-3 text-sm text-gray-600">
        {tierLabels[user.tier] || 'Người mới'}
      </td>

      {/* Karma */}
      <td className="px-4 py-3 text-sm text-gray-600">
        {user.karma.toLocaleString()}
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        {user.isBanned ? (
          <Badge className="bg-red-100 text-red-700 text-xs">Đã cấm</Badge>
        ) : user.isVerified ? (
          <Badge className="bg-green-100 text-green-700 text-xs">Đã xác minh</Badge>
        ) : (
          <Badge className="bg-gray-100 text-gray-700 text-xs">Hoạt động</Badge>
        )}
      </td>

      {/* Actions */}
      <td className="px-4 py-3 text-right">
        {user.isBanned ? (
          <Button
            onClick={() => onUnban(user.id)}
            disabled={isLoading}
            size="sm"
            variant="outline"
            className="text-green-600 border-green-200 hover:bg-green-50"
          >
            <UserCheck className="h-4 w-4 mr-1" />
            Bỏ cấm
          </Button>
        ) : (
          <Button
            onClick={() => onBan(user.id)}
            disabled={isLoading}
            size="sm"
            variant="outline"
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            <Ban className="h-4 w-4 mr-1" />
            Cấm
          </Button>
        )}
      </td>
    </tr>
  );
}

