'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import nextDynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { useAuthStore } from '@/features/auth/stores/auth-store';

const AuthScene3D = nextDynamic(
  () => import('@/features/auth/components/AuthScene3D').then(mod => ({ default: mod.AuthScene3D })),
  { ssr: false }
);

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, hydrated } = useAuthStore();

  useEffect(() => {
    if (hydrated && isAuthenticated) {
      router.replace('/');
    }
  }, [hydrated, isAuthenticated, router]);

  if (!hydrated) {
    return null;
  }

  if (hydrated && isAuthenticated) {
    return null;
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background base */}
      <div className="fixed inset-0 bg-background" />

      {/* 3D WebGL Scene */}
      <div className="fixed inset-0 z-0">
        <AuthScene3D />
      </div>

      {/* Vignette overlay for depth */}
      <div className="fixed inset-0 z-[1] bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(var(--background)/0.5)_100%)]" />

      {/* Content with page transitions */}
      <div className="relative z-10 w-full p-4">
        {/* Back to home */}
        <Link
          href="/"
          className="fixed left-4 top-4 z-20 inline-flex items-center gap-1 rounded-xl border border-border bg-background/80 px-3 py-2 text-sm font-medium text-muted-foreground shadow-sm backdrop-blur transition-colors hover:bg-background hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Quay lại trang chủ
        </Link>

        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

