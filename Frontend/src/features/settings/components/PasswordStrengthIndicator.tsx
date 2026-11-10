'use client';

import { useMemo } from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasswordStrengthIndicatorProps {
  password: string;
}

interface Requirement {
  label: string;
  test: (password: string) => boolean;
}

const requirements: Requirement[] = [
  { label: 'Ít nhất 8 ký tự', test: (p) => p.length >= 8 },
  { label: 'Chữ hoa (A-Z)', test: (p) => /[A-Z]/.test(p) },
  { label: 'Chữ thường (a-z)', test: (p) => /[a-z]/.test(p) },
  { label: 'Số (0-9)', test: (p) => /[0-9]/.test(p) },
  { label: 'Ký tự đặc biệt (!@#$...)', test: (p) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p) },
];

type StrengthLevel = 'weak' | 'medium' | 'strong' | 'very-strong';

interface StrengthConfig {
  label: string;
  color: string;
  bgColor: string;
  width: string;
}

const strengthConfig: Record<StrengthLevel, StrengthConfig> = {
  'weak': { label: 'Yếu', color: 'bg-red-500', bgColor: 'text-red-500', width: 'w-1/4' },
  'medium': { label: 'Trung bình', color: 'bg-orange-500', bgColor: 'text-orange-500', width: 'w-2/4' },
  'strong': { label: 'Mạnh', color: 'bg-yellow-500', bgColor: 'text-yellow-500', width: 'w-3/4' },
  'very-strong': { label: 'Rất mạnh', color: 'bg-green-500', bgColor: 'text-green-500', width: 'w-full' },
};

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const { passedRequirements, strength } = useMemo(() => {
    const passed = requirements.map((req) => req.test(password));
    const passedCount = passed.filter(Boolean).length;
    
    // Calculate strength based on passed requirements
    // First 4 requirements are mandatory, 5th (special char) is bonus
    const mandatoryPassed = passed.slice(0, 4).filter(Boolean).length;
    const hasSpecialChar = passed[4];
    
    let strengthLevel: StrengthLevel;
    if (mandatoryPassed <= 1) {
      strengthLevel = 'weak';
    } else if (mandatoryPassed <= 2) {
      strengthLevel = 'medium';
    } else if (mandatoryPassed <= 3) {
      strengthLevel = 'strong';
    } else {
      strengthLevel = hasSpecialChar ? 'very-strong' : 'strong';
    }
    
    return { passedRequirements: passed, strength: strengthLevel };
  }, [password]);

  const config = strengthConfig[strength];

  if (!password) {
    return null;
  }

  return (
    <div className="mt-2 space-y-3" aria-live="polite" aria-label="Độ mạnh mật khẩu">
      {/* Strength Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Độ mạnh:</span>
          <span className={cn('font-medium', config.bgColor)}>{config.label}</span>
        </div>
        <div className="h-2 w-full rounded-full bg-secondary">
          <div
            className={cn('h-full rounded-full transition-all duration-300', config.color, config.width)}
            role="progressbar"
            aria-valuenow={requirements.filter((_, i) => passedRequirements[i]).length}
            aria-valuemin={0}
            aria-valuemax={requirements.length}
          />
        </div>
      </div>

      {/* Requirements Checklist */}
      <ul className="space-y-1 text-sm" aria-label="Yêu cầu mật khẩu">
        {requirements.map((req, index) => {
          const passed = passedRequirements[index];
          const isBonus = index === 4; // Special character is bonus
          
          return (
            <li
              key={req.label}
              className={cn(
                'flex items-center gap-2 transition-colors',
                passed ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
              )}
            >
              {passed ? (
                <Check className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
              ) : (
                <X className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
              )}
              <span>
                {req.label}
                {isBonus && <span className="text-xs ml-1">(tùy chọn)</span>}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

