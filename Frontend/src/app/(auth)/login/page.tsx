'use client';

import { LoginForm } from '@/features/auth';

// Prevent static generation - auth pages must always serve fresh HTML
// to avoid stale build artifact references after deployments
export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return <LoginForm />;
}

