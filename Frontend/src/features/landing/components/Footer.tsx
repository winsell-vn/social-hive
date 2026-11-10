'use client';

import Link from 'next/link';

export function Footer() {
  return (
    <footer className="py-12 px-4 bg-[#0a0a0b] border-t border-[#3a3a3b]">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-8">
          {/* Brand */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">ChungToiXayWeb</h3>
            <p className="text-[#a6a6a6] text-sm">
              Nền tảng mạng xã hội dành cho cộng đồng Việt Nam
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Về chúng tôi</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-[#a6a6a6] hover:text-white transition-colors">
                  Giới thiệu
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-[#a6a6a6] hover:text-white transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-[#a6a6a6] hover:text-white transition-colors">
                  Liên hệ
                </Link>
              </li>
            </ul>
          </div>

          {/* Topics */}
          <div>
            <h4 className="text-white font-semibold mb-4">Chủ đề</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/topics/web-design" className="text-[#a6a6a6] hover:text-white transition-colors">
                  Thiết kế Web
                </Link>
              </li>
              <li>
                <Link href="/topics/mobile-app" className="text-[#a6a6a6] hover:text-white transition-colors">
                  Ứng dụng di động
                </Link>
              </li>
              <li>
                <Link href="/topics/zalo-mini-app" className="text-[#a6a6a6] hover:text-white transition-colors">
                  Zalo Mini App
                </Link>
              </li>
              <li>
                <Link href="/topics/seo" className="text-[#a6a6a6] hover:text-white transition-colors">
                  SEO
                </Link>
              </li>
              <li>
                <Link href="/topics/ui-ux" className="text-[#a6a6a6] hover:text-white transition-colors">
                  UI/UX
                </Link>
              </li>
              <li>
                <Link href="/topics/e-commerce" className="text-[#a6a6a6] hover:text-white transition-colors">
                  Thương mại điện tử
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-semibold mb-4">Pháp lý</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/dieu-khoan" className="text-[#a6a6a6] hover:text-white transition-colors">
                  Điều khoản
                </Link>
              </li>
              <li>
                <Link href="/chinh-sach-bao-mat" className="text-[#a6a6a6] hover:text-white transition-colors">
                  Quyền riêng tư
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">Liên hệ</h4>
            <ul className="space-y-2">
              <li>
                <a href="mailto:contact@chungtoixayweb.vn" className="text-[#a6a6a6] hover:text-white transition-colors">
                  Email
                </a>
              </li>
              <li>
                <a href="tel:+84817771184" className="text-[#a6a6a6] hover:text-white transition-colors">
                  Điện thoại
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-[#3a3a3b] pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[#a6a6a6] text-sm">
            © 2026 ChungToiXayWeb. Tất cả quyền được bảo lưu.
          </p>
          <a
            href="/feed.xml"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-[#a6a6a6] hover:text-white transition-colors text-sm"
            aria-label="RSS Feed"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <circle cx="6.18" cy="17.82" r="2.18"/>
              <path d="M4 4.44v2.83c7.03 0 12.73 5.7 12.73 12.73h2.83c0-8.59-6.97-15.56-15.56-15.56zm0 5.66v2.83c3.9 0 7.07 3.17 7.07 7.07h2.83c0-5.47-4.43-9.9-9.9-9.9z"/>
            </svg>
            RSS Feed
          </a>
        </div>
      </div>
    </footer>
  );
}
