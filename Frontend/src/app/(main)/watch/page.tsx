"use client";

import { useRouter } from "next/navigation";
import { Watch, Video, Radio } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty";
import { FadeIn } from "@/components/animations";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { LoginPromptModal } from "@/features/auth/components/LoginPromptModal";

export default function WatchPage() {
  const router = useRouter();
  const { isAuthenticated, hydrated } = useAuth();

  const handleClose = () => {
    router.push('/');
  };

  // Show loading while hydrating
  if (!hydrated) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Watch</h1>
        </div>
        <Card>
          <CardContent className="p-8">
            <div className="text-center text-muted-foreground">Đang tải...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Watch</h1>
        </div>

        <FadeIn>
          <Card>
            <CardContent className="p-8">
              <EmptyState
                icon={Watch}
                title="Watch - Sắp ra mắt"
                description="Video và live stream sẽ sớm có mặt tại đây. Hãy theo dõi!"
              />
            </CardContent>
          </Card>
        </FadeIn>

        {/* Feature Preview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6 text-center">
              <Video className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <h3 className="font-medium mb-1">Videos</h3>
              <p className="text-sm text-muted-foreground">
                Xem và chia sẻ video
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Radio className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <h3 className="font-medium mb-1">Live Streams</h3>
              <p className="text-sm text-muted-foreground">
                Phát trực tiếp với khán giả
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Watch className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <h3 className="font-medium mb-1">Watch Party</h3>
              <p className="text-sm text-muted-foreground">Xem cùng bạn bè</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Show modal if not authenticated - closes and redirects to home */}
      <LoginPromptModal
        open={!isAuthenticated}
        onClose={handleClose}
        message="Vui lòng đăng nhập để truy cập tính năng Watch"
      />
    </>
  );
}
