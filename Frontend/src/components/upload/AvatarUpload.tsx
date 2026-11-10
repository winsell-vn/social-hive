'use client';

import { useRef, useState } from 'react';
import { Camera, Loader2, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AvatarUploadProps {
  currentAvatar?: string | null;
  onAvatarChange: (file: File) => Promise<void>;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-16 w-16',
  md: 'h-24 w-24',
  lg: 'h-32 w-32',
};

const iconSizes = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

export function AvatarUpload({
  currentAvatar,
  onAvatarChange,
  size = 'lg',
  className,
}: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleClick = () => {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file ảnh');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Ảnh không được vượt quá 5MB');
      return;
    }

    // Create preview
    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);

    try {
      setIsUploading(true);
      await onAvatarChange(file);
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const displayUrl = previewUrl || currentAvatar;

  return (
    <div className={cn('relative inline-block', className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <button
        type="button"
        onClick={handleClick}
        disabled={isUploading}
        className={cn(
          'relative rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-md',
          'hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2',
          'disabled:cursor-not-allowed',
          sizeClasses[size]
        )}
      >
        {displayUrl ? (
          <img
            src={displayUrl}
            alt="Avatar"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <User className={cn('text-gray-400', iconSizes[size])} />
          </div>
        )}

        {/* Overlay */}
        <div
          className={cn(
            'absolute inset-0 bg-black/40 flex items-center justify-center',
            'opacity-0 hover:opacity-100 transition-opacity',
            isUploading && 'opacity-100'
          )}
        >
          {isUploading ? (
            <Loader2 className={cn('text-white animate-spin', iconSizes[size])} />
          ) : (
            <Camera className={cn('text-white', iconSizes[size])} />
          )}
        </div>
      </button>

      {/* Camera badge */}
      <div
        className={cn(
          'absolute bottom-0 right-0 bg-rose-600 rounded-full p-1.5 border-2 border-white',
          'pointer-events-none'
        )}
      >
        <Camera className="h-3 w-3 text-white" />
      </div>
    </div>
  );
}

