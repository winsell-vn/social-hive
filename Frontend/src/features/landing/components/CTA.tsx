'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function CTA() {
  return (
    <section className="py-20 px-4 bg-gradient-to-b from-[#18191a] to-[#0a0a0b]">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
          Sẵn sàng tham gia?
        </h2>
        <p className="text-lg md:text-xl text-[#a6a6a6] mb-12 max-w-2xl mx-auto">
          Đăng ký miễn phí và bắt đầu kết nối ngay hôm nay
        </p>
        <Button
          asChild
          size="lg"
          className="bg-[#1877F2] hover:bg-[#165ec7] text-white px-8 py-6 text-lg font-semibold rounded-lg"
        >
          <Link href="/register">Tạo tài khoản</Link>
        </Button>
      </div>
    </section>
  );
}
