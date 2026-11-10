"use client";

import { useRouter } from "next/navigation";
import { ShoppingBag, Package, DollarSign, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty";
import { FadeIn } from "@/components/animations";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { LoginPromptModal } from "@/features/auth/components/LoginPromptModal";

export default function MarketplacePage() {
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
          <h1 className="text-2xl font-bold">Marketplace</h1>
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
          <h1 className="text-2xl font-bold">Marketplace</h1>
        </div>

        <FadeIn>
          <Card>
            <CardContent className="p-8">
              <EmptyState
                icon={ShoppingBag}
                title="Marketplace - Sắp ra mắt"
                description="Mua bán sản phẩm trong cộng đồng. Tính năng đang được phát triển."
              />
            </CardContent>
          </Card>
        </FadeIn>

        {/* Feature Preview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6 text-center">
              <Package className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <h3 className="font-medium mb-1">Sản phẩm</h3>
              <p className="text-sm text-muted-foreground">
                Mua bán đồ cũ và mới
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <DollarSign className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <h3 className="font-medium mb-1">Giá tốt</h3>
              <p className="text-sm text-muted-foreground">Giao dịch an toàn</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <MapPin className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <h3 className="font-medium mb-1">Địa phương</h3>
              <p className="text-sm text-muted-foreground">Mua bán gần bạn</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Show modal if not authenticated - closes and redirects to home */}
      <LoginPromptModal
        open={!isAuthenticated}
        onClose={handleClose}
        message="Vui lòng đăng nhập để truy cập tính năng Marketplace"
      />
    </>
  );
}
