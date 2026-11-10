'use client';

import Link from 'next/link';
import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserTable } from '@/features/admin';

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Người dùng</h1>
          <p className="text-gray-500 mt-1">Quản lý người dùng trên nền tảng</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/settings/email">
            <Mail className="h-4 w-4" />
            Cấu hình gửi Email
          </Link>
        </Button>
      </div>

      <UserTable />
    </div>
  );
}

