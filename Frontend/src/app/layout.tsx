import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClientLayout } from "./client-layout";

const inter = Inter({ subsets: ["latin", "vietnamese"] });

export const metadata: Metadata = {
  metadataBase: new URL('https://chungtoixayweb.vn'),
  title: {
    default: "ChungToiXayWeb - Nền tảng Mạng xã hội & Thiết kế Website",
    template: "%s | ChungToiXayWeb",
  },
  description: "Nền tảng mạng xã hội kết nối cộng đồng thiết kế web Việt Nam. Chia sẻ kiến thức, đăng bài viết, nhận dự án thiết kế website chuyên nghiệp.",
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || '',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.webmanifest',
  // Hreflang tags for Vietnamese language targeting (AC-092)
  alternates: {
    canonical: 'https://chungtoixayweb.vn',
    languages: {
      'vi': 'https://chungtoixayweb.vn',
      'x-default': 'https://chungtoixayweb.vn',
    },
    types: {
      'application/rss+xml': 'https://chungtoixayweb.vn/feed.xml',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    siteName: 'ChungToiXayWeb',
  },
  twitter: {
    card: 'summary_large_image',
  },
};

// Script to prevent flash of wrong theme - defaults to dark (light on admin)
const themeScript = `
  (function() {
    try {
      var stored = localStorage.getItem('theme-storage');
      var isAdmin = window.location.pathname.indexOf('/admin') === 0;
      var theme = null;
      if (stored) {
        var parsed = JSON.parse(stored);
        theme = isAdmin ? (parsed.state && parsed.state.adminTheme ? parsed.state.adminTheme : 'light') : (parsed.state && parsed.state.theme ? parsed.state.theme : 'dark');
      } else {
        theme = isAdmin ? 'light' : 'dark';
      }
      if (theme === 'light') {
        document.documentElement.classList.remove('dark');
        document.documentElement.style.colorScheme = 'light';
        return;
      }
      if (theme === 'system' && !window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.remove('dark');
        document.documentElement.style.colorScheme = 'light';
        return;
      }
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } catch (e) {
      document.documentElement.classList.add('dark');
    }
  })();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning className="dark">
      <head>
        {/* Resource hints for external domains to improve LCP */}
        {/* Google Fonts - preconnect with crossorigin for CORS */}
        <link key="preconnect-fonts-googleapis" rel="preconnect" href="https://fonts.googleapis.com" />
        <link key="preconnect-fonts-gstatic" rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link key="dns-prefetch-fonts-googleapis" rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link key="dns-prefetch-fonts-gstatic" rel="dns-prefetch" href="https://fonts.gstatic.com" />

        {/* Backend API domain - preconnect for faster API calls */}
        <link key="preconnect-gateway" rel="preconnect" href="https://gateway.chungtoixayweb.vn" crossOrigin="anonymous" />
        <link key="dns-prefetch-gateway" rel="dns-prefetch" href="https://gateway.chungtoixayweb.vn" />

        {/* Cloudflare Turnstile - dns-prefetch for CAPTCHA */}
        <link key="dns-prefetch-cloudflare" rel="dns-prefetch" href="https://challenges.cloudflare.com" />

        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={inter.className}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
        >
          Bỏ qua đến nội dung chính
        </a>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
