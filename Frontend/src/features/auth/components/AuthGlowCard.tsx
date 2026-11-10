'use client';

import { useRef, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AuthGlowCardProps {
  children: React.ReactNode;
  className?: string;
}

export function AuthGlowCard({ children, className }: AuthGlowCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={cn('relative w-full max-w-md mx-auto', className)}
    >
      <div
        ref={cardRef}
        onMouseMove={(e) => {
          setIsHovered(true);
          handleMouseMove(e);
        }}
        onMouseLeave={() => setIsHovered(false)}
        className="relative rounded-2xl bg-card/80 backdrop-blur-xl border border-border/30 shadow-2xl shadow-black/10 p-8 overflow-hidden"
      >
        {/* Mouse-following glow */}
        {isHovered && (
          <div
            className="pointer-events-none absolute -inset-px rounded-2xl transition-opacity duration-300"
            style={{
              background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, hsl(var(--foreground) / 0.06), transparent 40%)`,
            }}
          />
        )}
        {/* Inner gradient overlay */}
        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.03] to-transparent" />
        {/* Content */}
        <div className="relative z-10">{children}</div>
      </div>
    </motion.div>
  );
}

