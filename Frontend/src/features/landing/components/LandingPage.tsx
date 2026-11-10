'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Users,
  MessageSquare,
  TrendingUp,
  Shield,
  Star,
  Zap,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';

const features = [
  {
    icon: Users,
    title: 'Cộng đồng sôi động',
    description: 'Kết nối với hàng nghìn người dùng có cùng sở thích và đam mê.',
  },
  {
    icon: TrendingUp,
    title: 'Hệ thống Karma',
    description: 'Đóng góp nội dung chất lượng để tăng điểm Karma và mở khóa đặc quyền.',
  },
  {
    icon: Shield,
    title: 'Nội dung được kiểm duyệt',
    description: 'Mọi bài viết đều được kiểm duyệt để đảm bảo chất lượng cộng đồng.',
  },
  {
    icon: Star,
    title: 'Cấp độ thành viên',
    description: 'Từ Người mới đến Huyền thoại - phát triển cùng cộng đồng.',
  },
  {
    icon: MessageSquare,
    title: 'Thảo luận sâu sắc',
    description: 'Tham gia các cuộc thảo luận có ý nghĩa với hệ thống bình luận đa cấp.',
  },
  {
    icon: Zap,
    title: 'Trải nghiệm mượt mà',
    description: 'Giao diện hiện đại, tốc độ nhanh, tối ưu cho mọi thiết bị.',
  },
];

const tiers = [
  { name: 'Người mới', karma: '0+', color: 'bg-gray-100 text-gray-700' },
  { name: 'Đóng góp', karma: '100+', color: 'bg-blue-100 text-blue-700' },
  { name: 'Chuyên gia', karma: '500+', color: 'bg-purple-100 text-purple-700' },
  { name: 'Bậc thầy', karma: '2000+', color: 'bg-amber-100 text-amber-700' },
  { name: 'Huyền thoại', karma: '10000+', color: 'bg-rose-100 text-rose-700' },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-rose-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 py-24 sm:py-32">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight">
              Chào mừng đến với
              <span className="block text-rose-600 mt-2">ChúngTôiXâyWeb</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Nền tảng blog xã hội với hệ thống Karma/Reputation độc đáo. 
              Chia sẻ kiến thức, kết nối cộng đồng, và phát triển cùng nhau.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="bg-rose-600 hover:bg-rose-700 text-white px-8">
                  Bắt đầu ngay
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="px-8">
                  Đăng nhập
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-rose-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 translate-x-1/2 translate-y-1/2" />
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Tính năng nổi bật
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Khám phá những gì làm nên sự khác biệt của chúng tôi
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="w-12 h-12 bg-rose-100 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-rose-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Karma/Tier Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
                Hệ thống Karma & Cấp độ
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                Đóng góp nội dung chất lượng để tích lũy điểm Karma. 
                Karma càng cao, cấp độ càng cao, và bạn sẽ mở khóa nhiều đặc quyền hơn.
              </p>

              <ul className="mt-8 space-y-4">
                {[
                  'Bài viết được duyệt: +10 Karma',
                  'Nhận upvote: +1 Karma',
                  'Bình luận hữu ích: +2 Karma',
                  'Bài viết bị từ chối: -5 Karma',
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-gray-50 rounded-2xl p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                Các cấp độ thành viên
              </h3>
              <div className="space-y-4">
                {tiers.map((tier, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-white rounded-lg p-4 border border-gray-200"
                  >
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${tier.color}`}>
                      {tier.name}
                    </span>
                    <span className="text-gray-600 text-sm">{tier.karma} Karma</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-rose-600">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Sẵn sàng tham gia cộng đồng?
          </h2>
          <p className="mt-4 text-lg text-rose-100 max-w-2xl mx-auto">
            Đăng ký ngay hôm nay để bắt đầu chia sẻ kiến thức và kết nối với cộng đồng.
          </p>
          <div className="mt-10">
            <Link href="/register">
              <Button size="lg" className="bg-white text-rose-600 hover:bg-rose-50 px-8">
                Tạo tài khoản miễn phí
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-white font-bold text-xl">ChúngTôiXâyWeb</div>
            <nav className="flex flex-wrap justify-center gap-6" aria-label="Footer navigation">
              <Link href="/pricing" className="text-gray-400 hover:text-white transition-colors text-sm">
                Bảng giá
              </Link>
              <Link href="/blog" className="text-gray-400 hover:text-white transition-colors text-sm">
                Blog
              </Link>
              <Link href="/contact" className="text-gray-400 hover:text-white transition-colors text-sm">
                Liên hệ
              </Link>
              <Link href="/about" className="text-gray-400 hover:text-white transition-colors text-sm">
                Giới thiệu
              </Link>
            </nav>
            <div className="text-gray-400 text-sm">
              © 2026 ChúngTôiXâyWeb. Tất cả quyền được bảo lưu.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

