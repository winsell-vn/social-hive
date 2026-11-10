'use client';

import { useState } from 'react';
import { Menu } from 'lucide-react';
import { AdminGuard } from '@/components/auth';
import { AdminSidebar } from '@/features/admin';
import { ErrorBoundary } from '@/components/error';
import { ThemeToggle } from '@/features/theme';
import { SkipLink } from '@/components/ui/skip-link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AdminGuard>
      <ErrorBoundary>
          <div className="flex min-h-screen bg-background">
            <SkipLink />

            {/* Desktop Sidebar */}
            <div className="hidden md:block">
              <AdminSidebar />
            </div>

            {/* Mobile Sidebar */}
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  className="fixed left-4 top-4 z-40"
                  aria-label="Mở menu"
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[240px] p-0">
                <AdminSidebar />
              </SheetContent>
            </Sheet>

            {/* Main Content */}
            <main id="main-content" className="flex-1 p-4 md:p-6">
              {/* Top bar with theme toggle */}
              <div className="mb-4 flex items-center justify-end md:mb-6">
                <ThemeToggle />
              </div>
              {children}
            </main>
          </div>
      </ErrorBoundary>
    </AdminGuard>
  );
}

