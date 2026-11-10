'use client';

import { motion, Variants } from 'framer-motion';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: (custom: { delay: number; duration: number }) => ({
    opacity: 1,
    transition: {
      delay: custom.delay,
      duration: custom.duration,
      ease: 'easeOut',
    },
  }),
};

export function FadeIn({
  children,
  delay = 0,
  duration = 0.3,
  className,
}: FadeInProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeInVariants}
      custom={{ delay, duration }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}

