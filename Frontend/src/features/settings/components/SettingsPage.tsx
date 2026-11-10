"use client";

import { User, Lock, Bell, Shield, ChevronLeft, ChevronRight } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { useRef, useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { useSettingsStore } from "../stores/settings-store";
import { AccountSettings } from "./AccountSettings";
import { PrivacySettings } from "./PrivacySettings";
import { NotificationSettings } from "./NotificationSettings";
import { SecuritySettings } from "./SecuritySettings";
import type { SettingsTab } from "../types/settings";

const tabs: { id: SettingsTab; label: string; icon: typeof User }[] = [
  { id: "account", label: "Tài khoản", icon: User },
  { id: "privacy", label: "Quyền riêng tư", icon: Lock },
  { id: "notifications", label: "Thông báo", icon: Bell },
  { id: "security", label: "Bảo mật", icon: Shield },
];

const validTabs: SettingsTab[] = ["account", "privacy", "notifications", "security"];

export function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activeTab, setActiveTab } = useSettingsStore();
  const navRef = useRef<HTMLDivElement>(null);
  const [showLeftGradient, setShowLeftGradient] = useState(false);
  const [showRightGradient, setShowRightGradient] = useState(false);

  // Sync tab from URL on mount and URL changes
  useEffect(() => {
    const tabFromUrl = searchParams.get("tab") as SettingsTab | null;
    if (tabFromUrl && validTabs.includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    } else if (!tabFromUrl) {
      // Default to account tab if no tab param
      setActiveTab("account");
    }
  }, [searchParams, setActiveTab]);

  // Handle tab change - update URL without page reload
  const handleTabChange = useCallback((newTab: SettingsTab) => {
    setActiveTab(newTab);
    router.push(`/settings?tab=${newTab}`, { scroll: false });
  }, [router, setActiveTab]);

  // Check scroll position for gradient indicators
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const checkScroll = () => {
      const { scrollLeft, scrollWidth, clientWidth } = nav;
      setShowLeftGradient(scrollLeft > 0);
      setShowRightGradient(scrollLeft < scrollWidth - clientWidth - 1);
    };

    checkScroll();
    nav.addEventListener("scroll", checkScroll);
    window.addEventListener("resize", checkScroll);

    return () => {
      nav.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case "account":
        return <AccountSettings />;
      case "privacy":
        return <PrivacySettings />;
      case "notifications":
        return <NotificationSettings />;
      case "security":
        return <SecuritySettings />;
      default:
        return <AccountSettings />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4">
      {/* Skip Link */}
      <a
        href="#settings-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground focus:shadow-lg focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        Bỏ qua đến nội dung chính
      </a>

      <h1 className="text-2xl font-bold mb-6">Cài đặt</h1>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Navigation */}
        <nav
          className="w-full md:w-56 flex-shrink-0"
          aria-label="Điều hướng cài đặt"
        >
          <Card>
            {/* Mobile: Horizontal scroll with gradient indicators */}
            <div className="relative md:hidden">
              {/* Left gradient */}
              <div
                className={cn(
                  "absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-card to-transparent z-10 pointer-events-none transition-opacity duration-200",
                  showLeftGradient ? "opacity-100" : "opacity-0"
                )}
                aria-hidden="true"
              >
                <ChevronLeft className="absolute left-1 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              {/* Right gradient */}
              <div
                className={cn(
                  "absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-card to-transparent z-10 pointer-events-none transition-opacity duration-200",
                  showRightGradient ? "opacity-100" : "opacity-0"
                )}
                aria-hidden="true"
              >
                <ChevronRight className="absolute right-1 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <div
              ref={navRef}
              className="flex md:flex-col overflow-x-auto md:overflow-x-visible scrollbar-hide"
              role="tablist"
              aria-label="Các tab cài đặt"
            >
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  aria-controls="settings-content"
                  tabIndex={activeTab === tab.id ? 0 : -1}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 text-left transition-all duration-200 whitespace-nowrap cursor-pointer min-h-[44px]",
                    "hover:bg-secondary border-b md:border-b-0 md:border-l-2 border-transparent",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                    activeTab === tab.id
                      ? "bg-primary/10 text-primary md:border-l-primary"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <tab.icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </div>
          </Card>
        </nav>

        {/* Main Content */}
        <main
          className="flex-1"
          id="settings-content"
          role="tabpanel"
          aria-label={`Nội dung ${tabs.find(t => t.id === activeTab)?.label || 'cài đặt'}`}
        >
          <Card>
            <CardContent className="p-6 animate-in fade-in-0 duration-200">
              {renderContent()}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
