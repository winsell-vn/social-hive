'use client';

import { cn } from '@/lib/utils';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: number | string;
  trend?: number;
  trendDirection?: 'up' | 'down';
  className?: string;
}

export function StatsCard({
  icon: Icon,
  label,
  value,
  trend,
  trendDirection,
  className,
}: StatsCardProps) {
  const formattedValue = typeof value === 'number' 
    ? value.toLocaleString('vi-VN') 
    : value;

  return (
    <div
      className={cn(
        'bg-white rounded-xl shadow-sm border border-gray-200 p-6',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="p-2 bg-rose-50 rounded-lg">
          <Icon className="h-6 w-6 text-rose-600" />
        </div>
        {trend !== undefined && trendDirection && (
          <div
            className={cn(
              'flex items-center gap-1 text-sm font-medium',
              trendDirection === 'up' ? 'text-green-600' : 'text-red-600'
            )}
          >
            {trendDirection === 'up' ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            <span>{trend}%</span>
          </div>
        )}
      </div>

      <div className="mt-4">
        <p className="text-2xl font-bold text-gray-900">{formattedValue}</p>
        <p className="text-sm text-gray-500 mt-1">{label}</p>
      </div>
    </div>
  );
}

