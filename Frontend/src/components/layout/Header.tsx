"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  LogOut,
  User,
  Settings,
  Bell,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MobileNav } from "./MobileNav";
import { ThemeToggle } from "@/features/theme";
import { useAuth } from "@/features/auth";
import { NotificationBell } from "@/features/notifications";
import { cn } from "@/lib/utils";

export function Header() {
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  const displayName =
    user?.profile?.displayName || user?.profile?.username || "User";
  const avatarUrl = user?.profile?.avatar || undefined;
  const initials = displayName.charAt(0).toUpperCase();

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4">
        {/* Left: Logo + Mobile Menu */}
        <div className="flex items-center gap-3">
          <MobileNav />
          <Link
            href="/"
            className="text-lg font-bold text-foreground hover:text-foreground/80 transition-colors"
          >
            ChungToiXayWeb
          </Link>
        </div>

        {/* Center: Search */}
        <form
          onSubmit={handleSearch}
          className="hidden flex-1 justify-center px-8 md:flex"
        >
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 bg-secondary"
              aria-label="Search"
            />
          </div>
        </form>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          {/* Mobile search button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => router.push("/search")}
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </Button>

          <ThemeToggle />
          <NotificationBell />

          {/* User Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className={cn(
                "flex items-center gap-2 p-1.5 transition-colors cursor-pointer",
                "hover:bg-secondary",
                isUserMenuOpen && "bg-secondary",
              )}
              aria-expanded={isUserMenuOpen}
              aria-haspopup="true"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={avatarUrl} alt={displayName} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium sm:inline">
                {displayName}
              </span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform",
                  isUserMenuOpen && "rotate-180",
                )}
              />
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-1 w-56 rounded-lg border border-border bg-popover py-1 shadow-lg animate-fade-in">
                <div className="border-b border-border px-4 py-2">
                  <p className="text-sm font-medium">{displayName}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>

                <Link
                  href="/profile"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-secondary transition-colors cursor-pointer"
                >
                  <User className="h-4 w-4" />
                  Profile
                </Link>

                <Link
                  href="/settings"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-secondary transition-colors cursor-pointer"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>

                <div className="my-1 border-t border-border" />

                <button
                  onClick={handleLogout}
                  disabled={isLoading}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
