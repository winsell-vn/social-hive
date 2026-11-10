'use client';

import { motion, Variants } from 'framer-motion';
import { ReactNode, Children, isValidElement } from 'react';
import { cn } from '@/lib/utils';

interface StaggerContainerProps {
  children: ReactNode;
  staggerDelay?: number;
  initialDelay?: number;
  className?: string;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: (custom: { initialDelay: number; staggerDelay: number }) => ({
    opacity: 1,
    transition: {
      delayChildren: custom.initialDelay,
      staggerChildren: custom.staggerDelay,
    },
  }),
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
};

export function StaggerContainer({
  children,
  staggerDelay = 0.1,
  initialDelay = 0,
  className,
}: StaggerContainerProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      custom={{ initialDelay, staggerDelay }}
      className={cn(className)}
    >
      {Children.map(children, (child, index) => {
        if (isValidElement(child)) {
          // Use child's key if available, otherwise use index
          // Append index to handle duplicate keys gracefully
          const childKey = child.key != null ? `${child.key}-${index}` : index;
          return (
            <motion.div key={childKey} variants={itemVariants}>
              {child}
            </motion.div>
          );
        }
        return child;
      })}
    </motion.div>
  );
}

// Export item variants for custom usage
export { itemVariants as staggerItemVariants };

