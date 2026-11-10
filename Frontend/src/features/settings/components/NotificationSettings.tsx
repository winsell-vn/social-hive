'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Bell, Mail, Heart, MessageCircle, UserPlus, AtSign, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useSettings } from '../hooks/useSettings';
import type { UpdateNotificationInput } from '../types/settings';

const notificationSchema = z.object({
  emailNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  notifyOnLike: z.boolean(),
  notifyOnComment: z.boolean(),
  notifyOnFollow: z.boolean(),
  notifyOnMention: z.boolean(),
  notifyOnMessage: z.boolean(),
});

type NotificationFormData = z.infer<typeof notificationSchema>;

const notificationItems = [
  { key: 'notifyOnLike', icon: Heart, label: 'Lượt thích', description: 'Khi ai đó thích bài viết của bạn' },
  { key: 'notifyOnComment', icon: MessageCircle, label: 'Bình luận', description: 'Khi ai đó bình luận bài viết của bạn' },
  { key: 'notifyOnFollow', icon: UserPlus, label: 'Theo dõi', description: 'Khi ai đó theo dõi bạn' },
  { key: 'notifyOnMention', icon: AtSign, label: 'Nhắc đến', description: 'Khi ai đó nhắc đến bạn' },
  { key: 'notifyOnMessage', icon: Send, label: 'Tin nhắn', description: 'Khi bạn nhận được tin nhắn mới' },
] as const;

export function NotificationSettings() {
  const { settings, isLoading, updateNotifications, isUpdatingNotifications } = useSettings();

  const { control, handleSubmit, formState: { isDirty }, reset } = useForm<NotificationFormData>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      emailNotifications: settings?.emailNotifications ?? true,
      pushNotifications: settings?.pushNotifications ?? true,
      notifyOnLike: settings?.notifyOnLike ?? true,
      notifyOnComment: settings?.notifyOnComment ?? true,
      notifyOnFollow: settings?.notifyOnFollow ?? true,
      notifyOnMention: settings?.notifyOnMention ?? true,
      notifyOnMessage: settings?.notifyOnMessage ?? true,
    },
    values: settings ? {
      emailNotifications: settings.emailNotifications,
      pushNotifications: settings.pushNotifications,
      notifyOnLike: settings.notifyOnLike,
      notifyOnComment: settings.notifyOnComment,
      notifyOnFollow: settings.notifyOnFollow,
      notifyOnMention: settings.notifyOnMention,
      notifyOnMessage: settings.notifyOnMessage,
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

  const onSubmit = async (data: NotificationFormData) => {
    try {
      await updateNotifications(data as UpdateNotificationInput);
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
        <h3 className="text-lg font-semibold text-foreground mb-4">Thông báo</h3>
        <p className="text-sm text-muted-foreground mb-6">Quản lý cách bạn nhận thông báo</p>
      </div>

      {/* General notification settings */}
      <div className="space-y-4">
        <Label className="text-base" id="notification-channels-label">Kênh thông báo</Label>
        <div role="group" aria-labelledby="notification-channels-label">
          <Controller
            name="emailNotifications"
            control={control}
            render={({ field }) => (
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg mb-2">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                  <div>
                    <p className="font-medium text-foreground" id="email-notifications-label">Thông báo qua email</p>
                    <p className="text-sm text-muted-foreground" id="email-notifications-desc">Nhận thông báo qua email</p>
                  </div>
                </div>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  aria-labelledby="email-notifications-label"
                  aria-describedby="email-notifications-desc"
                />
              </div>
            )}
          />
          <Controller
            name="pushNotifications"
            control={control}
            render={({ field }) => (
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                  <div>
                    <p className="font-medium text-foreground" id="push-notifications-label">Thông báo đẩy</p>
                    <p className="text-sm text-muted-foreground" id="push-notifications-desc">Nhận thông báo trên trình duyệt</p>
                  </div>
                </div>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  aria-labelledby="push-notifications-label"
                  aria-describedby="push-notifications-desc"
                />
              </div>
            )}
          />
        </div>
      </div>

      {/* Specific notification settings */}
      <div className="space-y-4">
        <Label className="text-base" id="notification-types-label">Loại thông báo</Label>
        <div role="group" aria-labelledby="notification-types-label" className="space-y-2">
          {notificationItems.map((item) => (
            <Controller
              key={item.key}
              name={item.key}
              control={control}
              render={({ field }) => (
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg transition-colors duration-200">
                  <div className="flex items-center gap-3">
                    <item.icon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                    <div>
                      <p className="font-medium text-foreground" id={`${item.key}-label`}>{item.label}</p>
                      <p className="text-sm text-muted-foreground" id={`${item.key}-desc`}>{item.description}</p>
                    </div>
                  </div>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    aria-labelledby={`${item.key}-label`}
                    aria-describedby={`${item.key}-desc`}
                  />
                </div>
              )}
            />
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <Button
          type="button"
          variant="outline"
          onClick={() => reset()}
          disabled={!isDirty || isUpdatingNotifications}
          className="transition-all duration-200"
        >
          Hủy
        </Button>
        <Button
          type="submit"
          disabled={!isDirty || isUpdatingNotifications}
          className="bg-rose-600 hover:bg-rose-700 transition-all duration-200"
        >
          {isUpdatingNotifications ? (
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

