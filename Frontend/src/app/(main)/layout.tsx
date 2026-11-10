"use client";

import { Navbar, Sidebar, BottomNav } from "@/components/layout";
import { RightSidebar } from "@/components/layout/RightSidebar";
import { ErrorBoundary } from "@/components/error";
import { SkipLink } from "@/components/ui/skip-link";
import { useActivityTracker } from "@/features/auth/hooks/useActivityTracker";
import { IdleWarningModal } from "@/features/auth/components/IdleWarningModal";

function MainLayoutContent({ children }: { children: React.ReactNode }) {
  const { showIdleWarning, idleCountdown, resetIdleTimer } = useActivityTracker();

  return (
    <div className="min-h-screen bg-background">
      <SkipLink />

      {/* Facebook-style Top Navbar */}
      <Navbar />

      {/* Main Content Area - 3-column responsive layout */}
      <div className="flex">
        {/* Left Sidebar - hidden on mobile, icons only on tablet, full on desktop */}
        <Sidebar />

        {/* Main Content - centered, responsive width */}
        <main id="main-content" className="flex-1 pb-20 md:pb-4">
          <div className="mx-auto w-full max-w-5xl px-3 py-4 sm:px-4">
            {children}
          </div>
        </main>

        {/* Right Sidebar - hidden on mobile/tablet, shown on xl+ */}
        <RightSidebar />
      </div>

      {/* Bottom Navigation - mobile only */}
      <BottomNav />

      {/* Idle Warning Modal */}
      <IdleWarningModal
        open={showIdleWarning}
        countdown={idleCountdown}
        onStayLoggedIn={resetIdleTimer}
      />
    </div>
  );
}

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary>
      <MainLayoutContent>{children}</MainLayoutContent>
    </ErrorBoundary>
  );
}
