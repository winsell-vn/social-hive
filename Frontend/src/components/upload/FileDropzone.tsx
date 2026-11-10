'use client';

import { useCallback } from 'react';
import { useDropzone, type Accept } from 'react-dropzone';
import { Upload, FileWarning } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileDropzoneProps {
  onDrop: (files: File[]) => void;
  accept?: Accept;
  maxFiles?: number;
  maxSize?: number; // in bytes
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function FileDropzone({
  onDrop,
  accept,
  maxFiles = 10,
  maxSize = 5 * 1024 * 1024, // 5MB default
  disabled = false,
  className,
  children,
}: FileDropzoneProps) {
  const handleDrop = useCallback(
    (acceptedFiles: File[]) => {
      onDrop(acceptedFiles);
    },
    [onDrop]
  );

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragReject,
    fileRejections,
  } = useDropzone({
    onDrop: handleDrop,
    accept,
    maxFiles,
    maxSize,
    disabled,
  });

  const maxSizeMB = Math.round(maxSize / (1024 * 1024));

  return (
    <div
      {...getRootProps()}
      className={cn(
        'relative border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer',
        'hover:border-rose-400 hover:bg-rose-50/50',
        isDragActive && !isDragReject && 'border-rose-600 bg-rose-50',
        isDragReject && 'border-red-500 bg-red-50',
        disabled && 'opacity-50 cursor-not-allowed hover:border-gray-300 hover:bg-transparent',
        !isDragActive && !isDragReject && 'border-gray-300',
        className
      )}
    >
      <input {...getInputProps()} />

      {children || (
        <div className="flex flex-col items-center justify-center text-center">
          {isDragReject ? (
            <>
              <FileWarning className="h-10 w-10 text-red-500 mb-2" />
              <p className="text-sm text-red-600 font-medium">
                File không hợp lệ
              </p>
            </>
          ) : (
            <>
              <Upload
                className={cn(
                  'h-10 w-10 mb-2',
                  isDragActive ? 'text-rose-600' : 'text-gray-400'
                )}
              />
              <p className="text-sm text-gray-600 font-medium">
                {isDragActive
                  ? 'Thả file vào đây...'
                  : 'Kéo thả file vào đây hoặc click để chọn'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Tối đa {maxFiles} file, mỗi file tối đa {maxSizeMB}MB
              </p>
            </>
          )}
        </div>
      )}

      {fileRejections.length > 0 && (
        <div className="mt-3 text-xs text-red-500">
          {fileRejections.map(({ file, errors }) => (
            <div key={file.name}>
              <span className="font-medium">{file.name}:</span>{' '}
              {errors.map((e) => {
                if (e.code === 'file-too-large') {
                  return `File quá lớn (tối đa ${maxSizeMB}MB)`;
                }
                if (e.code === 'file-invalid-type') {
                  return 'Định dạng file không hợp lệ';
                }
                if (e.code === 'too-many-files') {
                  return `Chỉ được chọn tối đa ${maxFiles} file`;
                }
                return e.message;
              }).join(', ')}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

