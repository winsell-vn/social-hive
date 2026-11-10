"use client";

import { useRouter } from "next/navigation";
import { Bookmark, FileText, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty";
import { FadeIn } from "@/components/animations";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { LoginPromptModal } from "@/features/auth/components/LoginPromptModal";

export default function SavedPostsPage() {
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
          <h1 className="text-2xl font-bold">Đã lưu</h1>
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
          <h1 className="text-2xl font-bold">Đã lưu</h1>
        </div>

        <FadeIn>
          <Card>
            <CardContent className="p-8">
              <EmptyState
                icon={Bookmark}
                title="Bài viết đã lưu"
                description="Các bài viết bạn đã lưu sẽ xuất hiện ở đây"
              />
            </CardContent>
          </Card>
        </FadeIn>

        {/* Feature Preview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6 text-center">
              <Bookmark className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <h3 className="font-medium mb-1">Lưu bài viết</h3>
              <p className="text-sm text-muted-foreground">
                Lưu lại để đọc sau
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <h3 className="font-medium mb-1">Quản lý</h3>
              <p className="text-sm text-muted-foreground">Sắp xếp theo danh mục</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Clock className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <h3 className="font-medium mb-1">Truy cập nhanh</h3>
              <p className="text-sm text-muted-foreground">Xem lại bất cứ lúc nào</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Show modal if not authenticated - closes and redirects to home */}
      <LoginPromptModal
        open={!isAuthenticated}
        onClose={handleClose}
        message="Vui lòng đăng nhập để xem bài viết đã lưu"
      />
    </>
  );
}

