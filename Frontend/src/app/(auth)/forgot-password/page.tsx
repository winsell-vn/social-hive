'use client';

import { ForgotPasswordForm } from '@/features/auth';

// Prevent static generation - auth pages must always serve fresh HTML
// to avoid stale build artifact references after deployments
export const dynamic = 'force-dynamic';

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}

