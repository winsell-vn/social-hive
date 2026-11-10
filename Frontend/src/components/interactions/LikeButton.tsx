'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LikeButtonProps {
  isLiked?: boolean;
  likeCount?: number;
  onLike?: () => void;
  onUnlike?: () => void;
  showCount?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
}

const sizeConfig = {
  sm: { icon: 'h-4 w-4', button: 'h-8 px-2 text-xs' },
  md: { icon: 'h-5 w-5', button: 'h-9 px-3 text-sm' },
  lg: { icon: 'h-6 w-6', button: 'h-10 px-4 text-base' },
};

export function LikeButton({
  isLiked = false,
  likeCount = 0,
  onLike,
  onUnlike,
  showCount = true,
  size = 'md',
  className,
  disabled = false,
}: LikeButtonProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const config = sizeConfig[size];

  const handleClick = () => {
    if (disabled) return;

    setIsAnimating(true);

    if (isLiked) {
      onUnlike?.();
    } else {
      onLike?.();
    }

    setTimeout(() => setIsAnimating(false), 300);
  };

  return (
    <Button
      variant="ghost"
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
        isLiked && 'text-red-500 hover:text-red-600',
        config.button,
        className
      )}
      aria-label={isLiked ? `Unlike (${likeCount} likes)` : `Like (${likeCount} likes)`}
      aria-pressed={isLiked}
    >
      <motion.div
        animate={isAnimating ? { scale: [1, 1.3, 1] } : {}}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="flex items-center gap-1.5"
      >
        <Heart
          className={cn(
            config.icon,
            'transition-all duration-150',
            isLiked && 'fill-current'
          )}
        />
        {showCount && likeCount > 0 && (
          <AnimatePresence mode="wait">
            <motion.span
              key={likeCount}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.15 }}
            >
              {likeCount}
            </motion.span>
          </AnimatePresence>
        )}
        {showCount && likeCount === 0 && <span>Thích</span>}
      </motion.div>
      
      {/* Burst effect on like */}
      <AnimatePresence>
        {isAnimating && isLiked && (
          <motion.div
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 2, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 rounded-full bg-red-500/20"
          />
        )}
      </AnimatePresence>
    </Button>
  );
}

