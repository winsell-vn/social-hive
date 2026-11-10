'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Eye, EyeOff, Users, Lock, Globe, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useSettings } from '../hooks/useSettings';
import type { UpdatePrivacyInput } from '../types/settings';

const privacySchema = z.object({
  profileVisibility: z.enum(['public', 'friends', 'private']),
  showOnlineStatus: z.boolean(),
  allowMessagesFrom: z.enum(['everyone', 'friends', 'none']),
  showActivityStatus: z.boolean(),
});

type PrivacyFormData = z.infer<typeof privacySchema>;

const visibilityOptions = [
  { value: 'public', label: 'Công khai', icon: Globe, description: 'Mọi người đều có thể xem' },
  { value: 'friends', label: 'Bạn bè', icon: Users, description: 'Chỉ bạn bè mới xem được' },
  { value: 'private', label: 'Riêng tư', icon: Lock, description: 'Chỉ mình bạn xem được' },
];

const messageOptions = [
  { value: 'everyone', label: 'Tất cả mọi người' },
  { value: 'friends', label: 'Chỉ bạn bè' },
  { value: 'none', label: 'Không ai cả' },
];

export function PrivacySettings() {
  const { settings, isLoading, updatePrivacy, isUpdatingPrivacy } = useSettings();

  const {
    control,
    handleSubmit,
    formState: { isDirty },
    reset,
  } = useForm<PrivacyFormData>({
    resolver: zodResolver(privacySchema),
    defaultValues: {
      profileVisibility: settings?.profileVisibility || 'public',
      showOnlineStatus: settings?.showOnlineStatus ?? true,
      allowMessagesFrom: settings?.allowMessagesFrom || 'everyone',
      showActivityStatus: settings?.showActivityStatus ?? true,
    },
    values: settings ? {
      profileVisibility: settings.profileVisibility,
      showOnlineStatus: settings.showOnlineStatus,
      allowMessagesFrom: settings.allowMessagesFrom,
      showActivityStatus: settings.showActivityStatus,
    } : undefined,
  });

  // Unsaved changes warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const onSubmit = async (data: PrivacyFormData) => {
    try {
      await updatePrivacy(data as UpdatePrivacyInput);
      reset(data);
    } catch (error) {
      // Error is handled by the useSettings hook
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-rose-600" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Quyền riêng tư</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Kiểm soát ai có thể xem thông tin và tương tác với bạn
        </p>
      </div>

      {/* Profile Visibility */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" id="profile-visibility-label">
          Hiển thị trang cá nhân
        </legend>
        <Controller
          name="profileVisibility"
          control={control}
          render={({ field }) => (
            <div className="grid gap-2" role="radiogroup" aria-labelledby="profile-visibility-label">
              {visibilityOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                    field.value === option.value
                      ? 'border-rose-600 bg-rose-500/10 dark:border-rose-500 dark:bg-rose-500/10'
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <input
                    type="radio"
                    {...field}
                    value={option.value}
                    checked={field.value === option.value}
                    className="sr-only"
                  />
                  <option.icon
                    className={`h-5 w-5 ${
                      field.value === option.value ? 'text-rose-600 dark:text-rose-400' : 'text-muted-foreground'
                    }`}
                    aria-hidden="true"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{option.label}</p>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </div>
                </label>
              ))}
            </div>
          )}
        />
      </fieldset>

      {/* Message Settings */}
      <div className="space-y-3">
        <Label htmlFor="allowMessagesFrom">Cho phép nhắn tin từ</Label>
        <Controller
          name="allowMessagesFrom"
          control={control}
          render={({ field }) => (
            <select
              {...field}
              id="allowMessagesFrom"
              className="w-full p-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all duration-200 min-h-[44px]"
            >
              {messageOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
        />
      </div>

      {/* Toggle Settings */}
      <div className="space-y-4">
        <Controller
          name="showOnlineStatus"
          control={control}
          render={({ field }) => (
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg transition-colors duration-200">
              <div className="flex items-center gap-3">
                <Eye className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                <div>
                  <p className="font-medium text-foreground" id="online-status-label">Hiển thị trạng thái online</p>
                  <p className="text-sm text-muted-foreground" id="online-status-desc">Cho phép người khác thấy khi bạn đang online</p>
                </div>
              </div>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                aria-labelledby="online-status-label"
                aria-describedby="online-status-desc"
              />
            </div>
          )}
        />

        <Controller
          name="showActivityStatus"
          control={control}
          render={({ field }) => (
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg transition-colors duration-200">
              <div className="flex items-center gap-3">
                <EyeOff className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                <div>
                  <p className="font-medium text-foreground" id="activity-status-label">Hiển thị hoạt động</p>
                  <p className="text-sm text-muted-foreground" id="activity-status-desc">Cho phép người khác thấy hoạt động gần đây</p>
                </div>
              </div>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                aria-labelledby="activity-status-label"
                aria-describedby="activity-status-desc"
              />
            </div>
          )}
        />
      </div>

      {/* Close Friends & Block List Info */}
      <div className="space-y-3 p-4 bg-blue-500/10 rounded-lg border border-blue-500/30 dark:bg-blue-500/10 dark:border-blue-500/30">
        <div className="flex items-start gap-3">
          <Users className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="font-medium text-blue-700 dark:text-blue-300">Bạn thân</p>
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
              Quản lý danh sách bạn thân của bạn trong phần hồ sơ. Bạn có thể chia sẻ nội dung riêng tư chỉ với bạn thân.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3 p-4 bg-red-500/10 rounded-lg border border-red-500/30 dark:bg-red-500/10 dark:border-red-500/30">
        <div className="flex items-start gap-3">
          <UserX className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="font-medium text-red-700 dark:text-red-300">Danh sách chặn</p>
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
              Quản lý danh sách những người bạn đã chặn. Những người bị chặn không thể xem hồ sơ hoặc liên hệ với bạn.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <Button
          type="button"
          variant="outline"
          onClick={() => reset()}
          disabled={!isDirty || isUpdatingPrivacy}
          className="transition-all duration-200"
        >
          Hủy
        </Button>
        <Button
          type="submit"
          disabled={!isDirty || isUpdatingPrivacy}
          className="bg-rose-600 hover:bg-rose-700 transition-all duration-200"
        >
          {isUpdatingPrivacy ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
              Đang lưu...
            </>
          ) : (
            'Lưu thay đổi'
          )}
        </Button>
      </div>
    </form>
  );
}

