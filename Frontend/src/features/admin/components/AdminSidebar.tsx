'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Shield, Users, BarChart3, ChevronLeft, Bot, Key, Megaphone, DollarSign, Layers, FolderOpen, HelpCircle, FileText, MessageSquare, Mail } from 'lucide-react';

const navItems = [
  {
    href: '/admin',
    label: 'Tổng quan',
    icon: LayoutDashboard,
  },
  {
    href: '/admin/moderation',
    label: 'Kiểm duyệt',
    icon: Shield,
  },
  {
    href: '/admin/users',
    label: 'Người dùng',
    icon: Users,
  },
  {
    href: '/admin/ads',
    label: 'Quảng cáo',
    icon: Megaphone,
  },
  {
    href: '/admin/blogs',
    label: 'Blog',
    icon: FileText,
  },
  {
    href: '/admin/pricing',
    label: 'Bảng giá',
    icon: DollarSign,
    children: [
      {
        href: '/admin/pricing/categories',
        label: 'Danh mục',
        icon: FolderOpen,
      },
      {
        href: '/admin/pricing',
        label: 'Dịch vụ',
        icon: Layers,
      },
      {
        href: '/admin/pricing/tiers',
        label: 'Gói giá',
        icon: DollarSign,
      },
      {
        href: '/admin/pricing/faqs',
        label: 'FAQ',
        icon: HelpCircle,
      },
      {
        href: '/admin/pricing/quotes',
        label: 'Yêu cầu báo giá',
        icon: FileText,
      },
    ],
  },
  {
    href: '/admin/analytics',
    label: 'Thống kê',
    icon: BarChart3,
  },
  {
    href: '/admin/ai-seeding',
    label: 'AI Seeding',
    icon: Bot,
    children: [
      {
        href: '/admin/ai-seeding/api-keys',
        label: 'API Keys',
        icon: Key,
      },
      {
        href: '/admin/ai-seeding/agents',
        label: 'Agents',
        icon: Bot,
      },
    ],
  },
  {
    href: '/admin/chatbot',
    label: 'Chatbot',
    icon: MessageSquare,
  },
  {
    href: '/admin/settings',
    label: 'Cấu hình',
    icon: Layers,
    children: [
      {
        href: '/admin/settings/email',
        label: 'Email',
        icon: Mail,
      },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-card border-r border-border min-h-screen">
      <div className="p-4 border-b border-border">
        <Link
          href="/"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="text-sm">Quay lại trang chủ</span>
        </Link>
      </div>

      <nav className="p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/admin' && pathname.startsWith(item.href));
          const Icon = item.icon;
          const hasChildren = 'children' in item && item.children;

          return (
            <div key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-rose-500/10 text-rose-500 border-l-4 border-rose-500 -ml-1 pl-4 dark:bg-rose-500/20 dark:text-rose-400'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                )}
              >
                <Icon className={cn('h-5 w-5', isActive ? 'text-rose-500 dark:text-rose-400' : 'text-muted-foreground')} />
                {item.label}
              </Link>

              {/* Render children if parent is active */}
              {hasChildren && isActive && (
                <div className="ml-6 mt-1 space-y-1">
                  {item.children.map((child) => {
                    const isChildActive = pathname === child.href;
                    const ChildIcon = child.icon;

                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                          isChildActive
                            ? 'bg-rose-500/15 text-rose-600 font-medium dark:bg-rose-500/25 dark:text-rose-400'
                            : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                        )}
                      >
                        <ChildIcon className={cn('h-4 w-4', isChildActive ? 'text-rose-500 dark:text-rose-400' : 'text-muted-foreground')} />
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

