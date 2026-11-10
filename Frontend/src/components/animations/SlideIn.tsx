'use client';

import { motion, Variants } from 'framer-motion';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Direction = 'left' | 'right' | 'top' | 'bottom';

interface SlideInProps {
  children: ReactNode;
  direction?: Direction;
  delay?: number;
  duration?: number;
  distance?: number;
  className?: string;
}

const getInitialPosition = (direction: Direction, distance: number) => {
  switch (direction) {
    case 'left':
      return { x: -distance, y: 0 };
    case 'right':
      return { x: distance, y: 0 };
    case 'top':
      return { x: 0, y: -distance };
    case 'bottom':
      return { x: 0, y: distance };
  }
};

const slideInVariants: Variants = {
  hidden: (custom: { direction: Direction; distance: number }) => ({
    opacity: 0,
    ...getInitialPosition(custom.direction, custom.distance),
  }),
  visible: (custom: { delay: number; duration: number }) => ({
    opacity: 1,
    x: 0,
    y: 0,
    transition: {
      delay: custom.delay,
      duration: custom.duration,
      ease: 'easeOut',
    },
  }),
};

export function SlideIn({
  children,
  direction = 'left',
  delay = 0,
  duration = 0.3,
  distance = 20,
  className,
}: SlideInProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={slideInVariants}
      custom={{ direction, distance, delay, duration }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}

