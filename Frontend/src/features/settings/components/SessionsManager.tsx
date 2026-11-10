'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  Monitor,
  Smartphone,
  Tablet,
  HelpCircle,
  Loader2,
  LogOut,
  Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useSessions, useSettings } from '../hooks/useSettings';
import type { SessionInfo } from '../types/settings';
import { formatRelativeTime } from '@/lib/utils';

function getDeviceIcon(deviceType: SessionInfo['deviceType']) {
  switch (deviceType) {
    case 'desktop':
      return Monitor;
    case 'mobile':
      return Smartphone;
    case 'tablet':
      return Tablet;
    default:
      return HelpCircle;
  }
}

function SessionCard({
  session,
  onRevoke,
  isRevoking,
}: {
  session: SessionInfo;
  onRevoke: (id: string) => void;
  isRevoking: boolean;
}) {
  const DeviceIcon = getDeviceIcon(session.deviceType);

  return (
    <Card
      className={`transition-all duration-200 ${
        session.isCurrent
          ? 'border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-950/30'
          : 'border-border'
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={`p-2 rounded-lg ${
                session.isCurrent
                  ? 'bg-green-100 dark:bg-green-900/50'
                  : 'bg-muted'
              }`}
            >
              <DeviceIcon
                className={`h-5 w-5 ${
                  session.isCurrent
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-muted-foreground'
                }`}
                aria-hidden="true"
              />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">
                  {session.browser} trên {session.os}
                </span>
                {session.isCurrent && (
                  <Badge
                    variant="outline"
                    className="border-green-500 text-green-600 dark:text-green-400"
                  >
                    Thiết bị này
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Globe className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{session.ipAddress || 'Không xác định'}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Hoạt động {formatRelativeTime(session.lastActiveAt)}
              </p>
            </div>
          </div>
          {!session.isCurrent && (
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all duration-200 min-w-[44px] min-h-[44px]"
              onClick={() => onRevoke(session.id)}
              disabled={isRevoking}
              aria-label={`Đăng xuất khỏi ${session.browser} trên ${session.os}`}
            >
              {isRevoking ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span className="sr-only">Đang đăng xuất...</span>
                </>
              ) : (
                <>
                  <LogOut className="h-4 w-4 mr-1" aria-hidden="true" />
                  <span className="hidden sm:inline">Đăng xuất</span>
                  <span className="sr-only sm:hidden">Đăng xuất khỏi thiết bị này</span>
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function SessionsSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Skeleton className="h-9 w-9 rounded-lg" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-8 w-24" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function SessionsManager() {
  const { data: sessions, isLoading, error } = useSessions();
  const { revokeSession, isRevokingSession, revokeAllSessions, isRevokingAllSessions } = useSettings();
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const handleRevokeSession = async (sessionId: string) => {
    setRevokingId(sessionId);
    try {
      await revokeSession(sessionId);
      toast.success('Đã đăng xuất thiết bị');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể đăng xuất thiết bị');
    } finally {
      setRevokingId(null);
    }
  };

  const handleRevokeAllSessions = async () => {
    try {
      const result = await revokeAllSessions();
      toast.success(`Đã đăng xuất ${result.revokedCount} thiết bị khác`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể đăng xuất các thiết bị');
    }
  };

  if (isLoading) {
    return <SessionsSkeleton />;
  }

  if (error) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        Không thể tải danh sách phiên đăng nhập
      </div>
    );
  }

  const otherSessions = sessions?.filter((s) => !s.isCurrent) || [];
  const currentSession = sessions?.find((s) => s.isCurrent);

  return (
    <div className="space-y-4" aria-live="polite" aria-label="Danh sách phiên đăng nhập">
      {/* Current session first */}
      {currentSession && (
        <SessionCard
          session={currentSession}
          onRevoke={handleRevokeSession}
          isRevoking={revokingId === currentSession.id}
        />
      )}

      {/* Other sessions */}
      {otherSessions.map((session) => (
        <SessionCard
          key={session.id}
          session={session}
          onRevoke={handleRevokeSession}
          isRevoking={revokingId === session.id}
        />
      ))}

      {/* Empty state */}
      {otherSessions.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Không có phiên đăng nhập nào khác
        </p>
      )}

      {/* Revoke all button */}
      {otherSessions.length > 0 && (
        <Button
          variant="outline"
          className="w-full text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all duration-200 min-h-[44px]"
          onClick={handleRevokeAllSessions}
          disabled={isRevokingAllSessions}
        >
          {isRevokingAllSessions ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
              Đang xử lý...
            </>
          ) : (
            <>
              <LogOut className="h-4 w-4 mr-2" aria-hidden="true" />
              Đăng xuất tất cả thiết bị khác
            </>
          )}
        </Button>
      )}
    </div>
  );
}

