'use client';

import { Sun, Moon, Monitor } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useMounted } from '@/hooks/use-mounted';
import { useThemeStore, type Theme } from '../stores/theme-store';

const themeOptions: { value: Theme; label: string; icon: React.ReactNode }[] = [
  { value: 'light', label: 'Sáng', icon: <Sun className="h-4 w-4" /> },
  { value: 'dark', label: 'Tối', icon: <Moon className="h-4 w-4" /> },
  { value: 'system', label: 'Hệ thống', icon: <Monitor className="h-4 w-4" /> },
];

export function ThemeToggle() {
  const mounted = useMounted();
  const pathname = usePathname();
  const { theme, adminTheme, setTheme, setAdminTheme } = useThemeStore();

  // The admin panel has its own theme preference (light by default).
  const isAdmin = pathname?.startsWith('/admin') ?? false;
  const currentTheme = isAdmin ? adminTheme : theme;
  const applyTheme = isAdmin ? setAdminTheme : setTheme;

  // Render placeholder during SSR to avoid hydration mismatch
  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9"
        disabled
        aria-label="Chuyển đổi giao diện"
      >
        <span className="h-5 w-5" />
      </Button>
    );
  }

  const currentIcon = currentTheme === 'dark' ? (
    <Moon className="h-5 w-5" />
  ) : currentTheme === 'light' ? (
    <Sun className="h-5 w-5" />
  ) : (
    <Monitor className="h-5 w-5" />
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          aria-label="Chuyển đổi giao diện"
        >
          {currentIcon}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {themeOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => applyTheme(option.value)}
            className={currentTheme === option.value ? 'bg-accent' : ''}
          >
            <span className="mr-2">{option.icon}</span>
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

