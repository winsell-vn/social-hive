'use client';

import { ModerationQueue } from '@/features/admin';

export default function ModerationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Kiểm duyệt</h1>
        <p className="text-gray-500 mt-1">Duyệt hoặc từ chối các bài viết đang chờ</p>
      </div>

      <ModerationQueue />
    </div>
  );
}

