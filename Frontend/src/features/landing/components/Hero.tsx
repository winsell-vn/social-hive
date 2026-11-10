'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function Hero() {
  return (
    <section className="relative py-20 px-4 text-center bg-gradient-to-b from-[#18191a] to-[#0a0a0b]">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">
          Kết nối. Chia sẻ. Khám phá.
        </h1>
        <p className="text-xl md:text-2xl text-[#a6a6a6] mb-12 max-w-2xl mx-auto leading-relaxed">
          Nền tảng mạng xã hội dành cho cộng đồng Việt Nam
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            asChild
            size="lg"
            className="bg-[#1877F2] hover:bg-[#165ec7] text-white px-8 py-6 text-lg font-semibold rounded-lg"
          >
            <Link href="/register">Đăng ký ngay</Link>
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="border-[#a6a6a6] text-white hover:bg-[#262627] px-8 py-6 text-lg font-semibold rounded-lg"
          >
            Tìm hiểu thêm
          </Button>
        </div>
      </div>
    </section>
  );
}
