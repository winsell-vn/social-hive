'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PrivacySettingsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/settings?tab=privacy');
  }, [router]);

  return null;
}
