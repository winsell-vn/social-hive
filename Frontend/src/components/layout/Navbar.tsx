"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Search,
  LogOut,
  LogIn,
  User,
  UserPlus,
  Settings,
  Bell,
  ChevronDown,
  Home,
  Users,
  Grid3x3,
  Watch,
  ShoppingBag,
  TrendingUp,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/features/theme";
import { useAuth } from "@/features/auth";
import { NotificationBell } from "@/features/notifications";
import { SearchModal } from "@/components/search/SearchModal";
import { cn } from "@/lib/utils";
import { generateAvatarAlt } from "@/lib/seo/alt-text";
import { getAvatarUrl } from "@/lib/image-url";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const centerNavItems: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/trending", label: "Trending", icon: TrendingUp },
  { href: "/watch", label: "Watch", icon: Watch },
  { href: "/marketplace", label: "Marketplace", icon: ShoppingBag },
];

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, isLoading } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const displayName =
    user?.profile?.displayName || user?.profile?.username || "User";
  const avatarUrl = getAvatarUrl(user?.profile?.avatar);
  const initials = displayName.charAt(0).toUpperCase();

  // Close menu when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsUserMenuOpen(false);
        setIsMobileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscapeKey);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, []);

  const handleLogout = async () => {
    setIsUserMenuOpen(false);
    await logout();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 h-14 border-b border-border bg-background">
      <div className="relative flex h-full items-center px-2 sm:px-3 md:px-4">
        {/* LEFT SECTION: Logo + Search */}
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-shrink-0">
          {/* Logo - Only "C" icon */}
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-bold text-foreground hover:text-foreground/80 transition-colors flex-shrink-0"
            aria-label="ChungToiXayWeb Home"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
              C
            </div>
          </Link>

          {/* Search Bar - Hidden on mobile, shown on md+ */}
          <button
            onClick={() => setIsSearchModalOpen(true)}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-full text-muted-foreground hover:bg-secondary/80 transition-colors max-w-[240px] flex-shrink-0 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            aria-label="Open search modal"
            title="Search (Ctrl+K)"
          >
            <Search className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm truncate">Tìm kiếm</span>
            <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-border bg-background px-1.5 text-[10px] font-medium text-muted-foreground ml-auto flex-shrink-0">
              <span className="text-xs">⌘</span>K
            </kbd>
          </button>
        </div>

        {/* CENTER SECTION: Navigation Icons - Absolutely centered, hidden on mobile/tablet, shown on lg+ */}
        <nav
          className="hidden lg:flex absolute left-1/2 transform -translate-x-1/2 items-center gap-2"
          aria-label="Main navigation"
        >
          {centerNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <div
                key={item.href}
                className={cn(
                  "relative flex items-center justify-center h-14 px-4 transition-colors",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Link
                  href={item.href}
                  className="flex items-center justify-center h-10 w-10 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded"
                  aria-current={isActive ? "page" : undefined}
                  aria-label={item.label}
                  title={item.label}
                >
                  <Icon className="h-6 w-6" />
                </Link>
                {/* Active indicator - 3px white underline */}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-white" />
                )}
              </div>
            );
          })}
        </nav>

        {/* RIGHT SECTION: Actions + Profile */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 ml-auto">
          {/* Mobile search button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-9 w-9 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            onClick={() => setIsSearchModalOpen(true)}
            aria-label="Open search"
          >
            <Search className="h-5 w-5" />
          </Button>

          <ThemeToggle />

          {/* Menu button (Grid 3x3) - Hidden on mobile */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden sm:flex h-9 w-9 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            aria-label="App menu"
            title="App menu"
          >
            <Grid3x3 className="h-5 w-5" />
          </Button>

          {/* Notifications button */}
          <NotificationBell />

          {/* User Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setIsUserMenuOpen(!isUserMenuOpen);
                } else if (e.key === "Escape") {
                  setIsUserMenuOpen(false);
                }
              }}
              className={cn(
                "flex items-center gap-1 p-1 transition-colors cursor-pointer rounded",
                "hover:bg-secondary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                isUserMenuOpen && "bg-secondary",
              )}
              aria-expanded={isUserMenuOpen}
              aria-haspopup="true"
              aria-label="User menu"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={avatarUrl} alt={generateAvatarAlt(displayName)} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform hidden sm:block",
                  isUserMenuOpen && "rotate-180",
                )}
              />
            </button>

            {isUserMenuOpen && (
              <div
                className="absolute right-0 mt-1 w-56 border border-border bg-popover py-1 shadow-lg animate-fade-in"
                role="menu"
                aria-label="User menu options"
              >
                {user ? (
                  <>
                    <div className="border-b border-border px-4 py-2">
                      <p className="text-sm font-medium">{displayName}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>

                    <Link
                      href="/profile"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-secondary transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                      role="menuitem"
                      tabIndex={isUserMenuOpen ? 0 : -1}
                    >
                      <User className="h-4 w-4" />
                      Profile
                    </Link>

                    <Link
                      href="/settings"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-secondary transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                      role="menuitem"
                      tabIndex={isUserMenuOpen ? 0 : -1}
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </Link>

                    <div className="my-1 border-t border-border" />

                    <button
                      onClick={handleLogout}
                      disabled={isLoading}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset disabled:opacity-50 disabled:cursor-not-allowed"
                      role="menuitem"
                      tabIndex={isUserMenuOpen ? 0 : -1}
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-secondary transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                      role="menuitem"
                      tabIndex={isUserMenuOpen ? 0 : -1}
                    >
                      <LogIn className="h-4 w-4" />
                      Đăng nhập
                    </Link>

                    <Link
                      href="/register"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-secondary transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                      role="menuitem"
                      tabIndex={isUserMenuOpen ? 0 : -1}
                    >
                      <UserPlus className="h-4 w-4" />
                      Đăng ký
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search Modal */}
      <SearchModal open={isSearchModalOpen} onOpenChange={setIsSearchModalOpen} />
    </header>
  );
}
