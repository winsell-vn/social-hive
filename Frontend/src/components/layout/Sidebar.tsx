"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Users,
  Bookmark,
  Plus,
  TrendingUp,
  LogIn,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/features/auth";
import { generateAvatarAlt } from "@/lib/seo/alt-text";
import { getAvatarUrl } from "@/lib/image-url";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  labelVi?: string;
}

const primaryNavItems: NavItem[] = [
  { href: "/", label: "Home", icon: Home, labelVi: "Trang chủ" },
  { href: "/trending", label: "Trending", icon: TrendingUp, labelVi: "Xu hướng" },
  { href: "/friends", label: "Friends", icon: Users, labelVi: "Bạn bè" },
  { href: "/saved", label: "Saved", icon: Bookmark, labelVi: "Đã lưu" },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const displayName =
    user?.profile?.displayName || user?.profile?.username || "User";
  const avatarUrl = getAvatarUrl(user?.profile?.avatar);
  const initials = displayName.charAt(0).toUpperCase();

  // On tablet (md), show collapsed sidebar with icons only
  // On desktop (lg+), show full sidebar with labels
  const isCollapsed = false; // Will be controlled by parent if needed

  return (
    <aside
      className={cn(
        "hidden w-60 shrink-0 border-r border-border bg-background md:block lg:w-64",
        className,
      )}
    >
      <div className="sticky top-14 flex h-[calc(100vh-3.5rem)] flex-col overflow-y-auto p-3 lg:p-4">
        {/* User Profile Section */}
        {user ? (
          <Link
            href="/profile"
            className="mb-4 flex items-center gap-3 rounded-lg p-2 hover:bg-secondary transition-colors"
          >
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarImage src={avatarUrl} alt={generateAvatarAlt(displayName)} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="hidden min-w-0 flex-1 lg:block">
              <p className="text-sm font-semibold truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground">Xem trang cá nhân</p>
            </div>
          </Link>
        ) : (
          <Link
            href="/login"
            className="mb-4 flex items-center gap-3 rounded-lg p-2 hover:bg-secondary transition-colors"
          >
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarFallback>
                <LogIn className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div className="hidden min-w-0 flex-1 lg:block">
              <p className="text-sm font-semibold truncate">Đăng nhập/ Đăng ký</p>
              <p className="text-xs text-muted-foreground">Truy cập tài khoản</p>
            </div>
          </Link>
        )}

        {/* Create Post Button */}
        <Button asChild className="mb-4 w-full gap-2 lg:mb-6">
          <Link href="/compose">
            <Plus className="h-4 w-4" />
            <span className="hidden lg:inline">Tạo bài viết</span>
          </Link>
        </Button>

        {/* Primary Navigation */}
        <nav
          className="flex-1 space-y-1 border-b border-border pb-4"
          aria-label="Primary navigation"
        >
          {primaryNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary",
                )}
                aria-current={isActive ? "page" : undefined}
                title={item.label}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span className="hidden lg:inline">
                  {item.labelVi || item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-border pt-4">
          <p className="hidden text-xs text-muted-foreground lg:block">
            © 2024 ChungToiXayWeb
          </p>
          <div className="mt-2 hidden flex-wrap gap-x-2 gap-y-1 text-xs text-muted-foreground lg:flex">
            <Link
              href="/about"
              className="hover:text-foreground transition-colors"
            >
              About
            </Link>
            <span>·</span>
            <Link
              href="/chinh-sach-bao-mat"
              className="hover:text-foreground transition-colors"
            >
              Privacy
            </Link>
            <span>·</span>
            <Link
              href="/dieu-khoan"
              className="hover:text-foreground transition-colors"
            >
              Terms
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
}
