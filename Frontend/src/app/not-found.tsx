'use client';

import Link from 'next/link';
import { FileQuestion, Home, Search, BookOpen, Mail, DollarSign, FileText, Shield, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';

const BASE_URL = 'https://chungtoixayweb.vn';

interface PopularLink {
  href: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const popularLinks: PopularLink[] = [
  {
    href: '/',
    label: 'Trang chủ',
    description: 'Khám phá bài viết mới nhất từ cộng đồng',
    icon: Home,
  },
  {
    href: '/blog',
    label: 'Blog',
    description: 'Bài viết chuyên sâu về thiết kế web',
    icon: BookOpen,
  },
  {
    href: '/bang-gia',
    label: 'Bảng giá',
    description: 'Xem các gói dịch vụ thiết kế website',
    icon: DollarSign,
  },
  {
    href: '/about',
    label: 'Giới thiệu',
    description: 'Tìm hiểu về ChungToiXayWeb',
    icon: Info,
  },
  {
    href: '/contact',
    label: 'Liên hệ',
    description: 'Liên hệ với đội ngũ hỗ trợ',
    icon: Mail,
  },
  {
    href: '/dieu-khoan',
    label: 'Điều khoản',
    description: 'Điều khoản sử dụng dịch vụ',
    icon: FileText,
  },
  {
    href: '/chinh-sach-bao-mat',
    label: 'Quyền riêng tư',
    description: 'Chính sách bảo mật thông tin',
    icon: Shield,
  },
];

export default function NotFound() {
  // WebPage structured data for 404 page
  const webPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: '404 - Không tìm thấy trang',
    description: 'Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.',
    url: BASE_URL,
    isPartOf: {
      '@type': 'WebSite',
      name: 'ChungToiXayWeb',
      url: BASE_URL,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${BASE_URL}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />

      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-4xl">
          {/* Error Message Section */}
          <div className="flex flex-col items-center text-center mb-12">
            <div className="mb-6 rounded-full bg-muted p-6">
              <FileQuestion className="h-16 w-16 text-muted-foreground" />
            </div>

            <h1 className="mb-3 text-6xl font-bold text-foreground">404</h1>

            <h2 className="mb-3 text-3xl font-semibold text-foreground">
              Không tìm thấy trang
            </h2>

            <p className="mb-8 max-w-md text-lg text-muted-foreground">
              Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển. Hãy thử tìm kiếm hoặc khám phá các trang phổ biến bên dưới.
            </p>

            {/* Primary Actions */}
            <div className="flex flex-col gap-3 sm:flex-row mb-12">
              <Button asChild size="lg">
                <Link href="/">
                  <Home className="mr-2 h-5 w-5" />
                  Về trang chủ
                </Link>
              </Button>

              <Button asChild variant="outline" size="lg">
                <Link href="/search">
                  <Search className="mr-2 h-5 w-5" />
                  Tìm kiếm
                </Link>
              </Button>
            </div>
          </div>

          {/* Popular Pages Section */}
          <div className="w-full">
            <h3 className="text-xl font-semibold text-foreground mb-6 text-center">
              Các trang phổ biến
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {popularLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="group flex items-start gap-3 p-4 rounded-lg border border-border bg-card hover:bg-accent hover:text-accent-foreground hover:border-accent-foreground/20 transition-colors"
                  >
                    <div className="flex-shrink-0 mt-1">
                      <Icon className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground group-hover:text-accent-foreground mb-1">
                        {link.label}
                      </div>
                      <div className="text-sm text-muted-foreground line-clamp-2">
                        {link.description}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Sitemap Link */}
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Hoặc xem{' '}
              <Link
                href="/sitemap.xml"
                className="text-primary hover:underline font-medium"
                target="_blank"
                rel="noopener noreferrer"
              >
                sơ đồ trang web
              </Link>
              {' '}để tìm tất cả các trang có sẵn.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

