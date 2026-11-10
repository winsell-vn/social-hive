'use client';

import { X, RotateCcw } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

interface ChatHeaderProps {
  onClose: () => void;
  onReset: () => void;
}

export function ChatHeader({ onClose, onReset }: ChatHeaderProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-blue-700 bg-blue-600 rounded-t-2xl max-md:rounded-t-none">
      {/* Avatar */}
      <Avatar className="h-10 w-10 ring-2 ring-white/30">
        <AvatarFallback className="bg-white text-blue-600 text-sm font-bold">
          H
        </AvatarFallback>
      </Avatar>

      {/* Name & Status */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-white leading-tight">
          Hưng DPS
        </h3>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-blue-100">Online — Sẵn sàng hỗ trợ</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10"
          onClick={onReset}
          aria-label="Bắt đầu cuộc trò chuyện mới"
          title="Cuộc trò chuyện mới"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10"
          onClick={onClose}
          aria-label="Đóng chat"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

