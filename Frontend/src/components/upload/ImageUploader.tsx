'use client';

import { useState, useCallback } from 'react';
import { X, Loader2, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FileDropzone } from './FileDropzone';
import { uploadImage, waitForMediaReady } from '@/lib/upload';

export interface ImageFile {
  id: string;
  file?: File;
  url: string;
  uploading?: boolean;
  error?: string;
  mediaId?: string; // Backend media ID for deletion
}

interface ImageUploaderProps {
  images: ImageFile[];
  onImagesChange: (images: ImageFile[]) => void;
  maxImages?: number;
  /** @deprecated Use built-in upload API. Kept for backward compatibility. */
  onUpload?: (file: File) => Promise<string>;
  /** Use built-in upload API (default: true if onUpload not provided) */
  useBuiltInUpload?: boolean;
  className?: string;
}

export function ImageUploader({
  images,
  onImagesChange,
  maxImages = 10,
  onUpload,
  useBuiltInUpload = !onUpload,
  className,
}: ImageUploaderProps) {
  const [uploadingCount, setUploadingCount] = useState(0);

  /**
   * Upload a single file using the built-in upload API
   * Handles async processing for large files (> 2MB)
   */
  const uploadFileWithApi = useCallback(async (file: File): Promise<{ url: string; mediaId: string }> => {
    const result = await uploadImage(file);

    // If processing async (large file), poll for completion
    if (result.status === 'PROCESSING') {
      const finalStatus = await waitForMediaReady(result.id);
      if (finalStatus.status === 'FAILED' || !finalStatus.url) {
        throw new Error('Xử lý ảnh thất bại');
      }
      return { url: finalStatus.url, mediaId: result.id };
    }

    // Sync processing completed
    if (result.status === 'READY' && result.url) {
      return { url: result.url, mediaId: result.id };
    }

    throw new Error('Upload thất bại');
  }, []);

  const handleDrop = useCallback(
    async (files: File[]) => {
      const remainingSlots = maxImages - images.length;
      const filesToAdd = files.slice(0, remainingSlots);

      if (filesToAdd.length === 0) return;

      const shouldUpload = useBuiltInUpload || !!onUpload;

      // Create preview images
      const newImages: ImageFile[] = filesToAdd.map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        url: URL.createObjectURL(file),
        uploading: shouldUpload,
      }));

      onImagesChange([...images, ...newImages]);

      // Upload using built-in API or custom handler
      if (shouldUpload) {
        setUploadingCount((c) => c + newImages.length);

        const uploadPromises = newImages.map(async (img) => {
          try {
            if (useBuiltInUpload) {
              // Use built-in upload API
              const { url, mediaId } = await uploadFileWithApi(img.file!);
              return { ...img, url, mediaId, uploading: false };
            } else if (onUpload) {
              // Use custom upload handler (backward compatibility)
              const uploadedUrl = await onUpload(img.file!);
              return { ...img, url: uploadedUrl, uploading: false };
            }
            return { ...img, uploading: false };
          } catch (error) {
            return { ...img, uploading: false, error: 'Upload thất bại' };
          }
        });

        const uploadedImages = await Promise.all(uploadPromises);

        // Update images with uploaded URLs
        const currentImages = [...images, ...newImages];
        const updatedImages = currentImages.map((img) => {
          const uploaded = uploadedImages.find((u) => u.id === img.id);
          return uploaded || img;
        });
        onImagesChange(updatedImages);

        setUploadingCount((c) => c - newImages.length);
      }
    },
    [images, maxImages, onImagesChange, onUpload, useBuiltInUpload, uploadFileWithApi]
  );

  const removeImage = useCallback(
    (id: string) => {
      const imageToRemove = images.find((img) => img.id === id);
      if (imageToRemove?.file) {
        URL.revokeObjectURL(imageToRemove.url);
      }
      onImagesChange(images.filter((img) => img.id !== id));
    },
    [images, onImagesChange]
  );

  const canAddMore = images.length < maxImages;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Image previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {images.map((image) => (
            <div
              key={image.id}
              className="relative aspect-square rounded-lg overflow-hidden bg-gray-100"
            >
              {/*
                Using native <img> intentionally for blob URL previews.
                Next.js Image optimization doesn't work with blob: URLs created by URL.createObjectURL().
                These are temporary preview images that exist only in browser memory before upload.
                After upload completes, the URL is replaced with the actual uploaded URL.
                See: https://nextjs.org/docs/messages/next-image-unconfigured-host
              */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.url}
                alt="Xem trước ảnh tải lên"
                className="w-full h-full object-cover"
              />

              {/* Loading overlay */}
              {image.uploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 text-white animate-spin" />
                </div>
              )}

              {/* Error overlay */}
              {image.error && (
                <div className="absolute inset-0 bg-red-500/80 flex items-center justify-center p-2">
                  <span className="text-white text-xs text-center">
                    {image.error}
                  </span>
                </div>
              )}

              {/* Remove button */}
              {!image.uploading && (
                <button
                  type="button"
                  onClick={() => removeImage(image.id)}
                  className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Dropzone */}
      {canAddMore && (
        <FileDropzone
          onDrop={handleDrop}
          accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'] }}
          maxFiles={maxImages - images.length}
          maxSize={5 * 1024 * 1024}
          disabled={uploadingCount > 0}
        >
          <div className="flex flex-col items-center justify-center py-4">
            <ImageIcon className="h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-600">
              Thêm ảnh ({images.length}/{maxImages})
            </p>
            <p className="text-xs text-gray-400 mt-1">
              PNG, JPG, GIF, WebP - Tối đa 5MB
            </p>
          </div>
        </FileDropzone>
      )}
    </div>
  );
}

