'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BookmarkButtonProps {
  isBookmarked?: boolean;
  onBookmark?: () => void;
  onRemoveBookmark?: () => void;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
  disabled?: boolean;
}

const sizeConfig = {
  sm: { icon: 'h-4 w-4', button: 'h-8 w-8' },
  md: { icon: 'h-5 w-5', button: 'h-9 w-9' },
  lg: { icon: 'h-6 w-6', button: 'h-10 w-10' },
};

export function BookmarkButton({
  isBookmarked = false,
  onBookmark,
  onRemoveBookmark,
  size = 'md',
  showLabel = false,
  className,
  disabled = false,
}: BookmarkButtonProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const config = sizeConfig[size];

  const handleClick = () => {
    if (disabled) return;

    setIsAnimating(true);

    if (isBookmarked) {
      onRemoveBookmark?.();
    } else {
      onBookmark?.();
    }

    setTimeout(() => setIsAnimating(false), 300);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      disabled={disabled}
      className={cn(
        'relative transition-all duration-150',
        'hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        isBookmarked && 'text-primary',
        showLabel ? 'w-auto px-3' : config.button,
        className
      )}
      title={isBookmarked ? 'Remove bookmark' : 'Bookmark post'}
      aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark post'}
      aria-pressed={isBookmarked}
    >
      <motion.div
        animate={isAnimating ? { scale: [1, 1.2, 1] } : {}}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="flex items-center gap-1.5"
      >
        <motion.div
          animate={isBookmarked ? { y: [0, -3, 0] } : {}}
          transition={{ duration: 0.3 }}
        >
          <Bookmark
            className={cn(
              config.icon,
              'transition-all duration-200',
              isBookmarked && 'fill-current'
            )}
          />
        </motion.div>
        {showLabel && (
          <span className="text-sm">
            {isBookmarked ? 'Đã lưu' : 'Lưu'}
          </span>
        )}
      </motion.div>
      
      {/* Fill animation effect */}
      <AnimatePresence>
        {isAnimating && !isBookmarked && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Bookmark className={cn(config.icon, 'fill-primary text-primary opacity-50')} />
          </motion.div>
        )}
      </AnimatePresence>
    </Button>
  );
}

