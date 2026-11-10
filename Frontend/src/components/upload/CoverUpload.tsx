'use client';

import { useRef, useState } from 'react';
import { Camera, Loader2, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CoverUploadProps {
  currentCover?: string | null;
  onCoverChange: (file: File) => Promise<void>;
  className?: string;
  aspectRatio?: '16/9' | '3/1' | '4/1';
}

export function CoverUpload({
  currentCover,
  onCoverChange,
  className,
  aspectRatio = '16/9',
}: CoverUploadProps) {
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
      await onCoverChange(file);
    } catch (error) {
      console.error('Failed to upload cover:', error);
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const displayUrl = previewUrl || currentCover;

  const aspectClasses = {
    '16/9': 'aspect-video',
    '3/1': 'aspect-[3/1]',
    '4/1': 'aspect-[4/1]',
  };

  return (
    <div className={cn('relative', className)}>
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
          'relative w-full rounded-lg overflow-hidden bg-gradient-to-r from-rose-400 to-rose-600',
          'hover:opacity-95 transition-opacity focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2',
          'disabled:cursor-not-allowed',
          aspectClasses[aspectRatio]
        )}
      >
        {displayUrl ? (
          <img
            src={displayUrl}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="h-12 w-12 text-white/50" />
          </div>
        )}

        {/* Overlay */}
        <div
          className={cn(
            'absolute inset-0 bg-black/30 flex items-center justify-center',
            'opacity-0 hover:opacity-100 transition-opacity',
            isUploading && 'opacity-100'
          )}
        >
          {isUploading ? (
            <div className="flex items-center gap-2 text-white">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm font-medium">Đang tải lên...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-white bg-black/50 px-4 py-2 rounded-lg">
              <Camera className="h-5 w-5" />
              <span className="text-sm font-medium">Thay đổi ảnh bìa</span>
            </div>
          )}
        </div>
      </button>
    </div>
  );
}

