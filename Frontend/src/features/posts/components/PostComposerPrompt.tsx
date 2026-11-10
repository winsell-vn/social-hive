'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PenSquare } from 'lucide-react';

export function PostComposerPrompt() {
  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center">
            <PenSquare className="w-5 h-5 text-gray-400" />
          </div>
          <div className="flex-1">
            <p className="text-gray-500 dark:text-slate-400">
              Bạn đang nghĩ gì?
            </p>
          </div>
          <Button asChild>
            <Link href="/login">Đăng nhập để đăng bài</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

