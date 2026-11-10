'use client';

import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LogIn, UserPlus } from 'lucide-react';

interface LoginPromptModalProps {
  open: boolean;
  onClose: () => void;
  message?: string;
}

export function LoginPromptModal({ open, onClose, message }: LoginPromptModalProps) {
  const router = useRouter();

  const handleLogin = () => {
    onClose();
    router.push('/login');
  };

  const handleRegister = () => {
    onClose();
    router.push('/register');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Đăng nhập để tiếp tục</DialogTitle>
          <DialogDescription>
            {message || 'Bạn cần đăng nhập để thực hiện thao tác này.'}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleRegister} className="w-full sm:w-auto">
            <UserPlus className="w-4 h-4 mr-2" />
            Đăng ký
          </Button>
          <Button onClick={handleLogin} className="w-full sm:w-auto">
            <LogIn className="w-4 h-4 mr-2" />
            Đăng nhập
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

