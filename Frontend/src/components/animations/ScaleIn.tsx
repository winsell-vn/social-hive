'use client';

import { motion, Variants } from 'framer-motion';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ScaleInProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  initialScale?: number;
  className?: string;
}

const scaleInVariants: Variants = {
  hidden: (custom: { initialScale: number }) => ({
    opacity: 0,
    scale: custom.initialScale,
  }),
  visible: (custom: { delay: number; duration: number }) => ({
    opacity: 1,
    scale: 1,
    transition: {
      delay: custom.delay,
      duration: custom.duration,
      ease: 'easeOut',
    },
  }),
};

export function ScaleIn({
  children,
  delay = 0,
  duration = 0.3,
  initialScale = 0.95,
  className,
}: ScaleInProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={scaleInVariants}
      custom={{ initialScale, delay, duration }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}

