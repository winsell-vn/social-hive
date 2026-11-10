import type { Metadata } from 'next';
import { PricingPageClient } from './client';
import { Breadcrumb, FAQSchema, ServiceSchema, type FAQItem, type ServiceItem } from '@/components/seo';

// FAQ items for pricing page
const faqItems: FAQItem[] = [
  {
    question: "Chi phí thiết kế website là bao nhiêu?",
    answer: "Chi phí thiết kế website tại ChungToiXayWeb dao động từ gói cơ bản đến gói doanh nghiệp, tùy thuộc vào yêu cầu và tính năng. Liên hệ với chúng tôi để nhận báo giá chi tiết phù hợp với nhu cầu của bạn."
  },
  {
    question: "Thời gian hoàn thành website mất bao lâu?",
    answer: "Thời gian hoàn thành phụ thuộc vào độ phức tạp của dự án. Website cơ bản thường mất 1-2 tuần, website thương mại điện tử hoặc mạng xã hội có thể mất 4-8 tuần. Chúng tôi luôn cam kết đúng tiến độ đã thỏa thuận."
  },
  {
    question: "Website có tương thích với điện thoại di động không?",
    answer: "Tất cả website do ChungToiXayWeb thiết kế đều được tối ưu responsive, hiển thị hoàn hảo trên mọi thiết bị từ điện thoại, máy tính bảng đến máy tính để bàn."
  },
  {
    question: "Có hỗ trợ SEO cho website không?",
    answer: "Có, tất cả các gói dịch vụ đều bao gồm tối ưu SEO cơ bản. Chúng tôi tối ưu tốc độ tải trang, cấu trúc URL, meta tags, và structured data để website của bạn thân thiện với công cụ tìm kiếm ngay từ đầu."
  },
  {
    question: "Sau khi bàn giao, tôi có thể tự quản lý website không?",
    answer: "Hoàn toàn có thể. Chúng tôi cung cấp hệ thống quản trị nội dung (CMS) dễ sử dụng và hướng dẫn chi tiết để bạn có thể tự cập nhật nội dung, hình ảnh, và quản lý website một cách độc lập."
  },
  {
    question: "ChungToiXayWeb có hỗ trợ bảo trì website sau khi hoàn thành không?",
    answer: "Có, chúng tôi cung cấp gói bảo trì và hỗ trợ kỹ thuật sau bàn giao. Bao gồm cập nhật bảo mật, sao lưu dữ liệu định kỳ, và hỗ trợ kỹ thuật qua nhiều kênh liên lạc."
  },
  {
    question: "Tôi có thể tích hợp tính năng mạng xã hội vào website không?",
    answer: "Đây là thế mạnh của ChungToiXayWeb! Chúng tôi chuyên tích hợp các tính năng mạng xã hội như đăng bài, bình luận, nhắn tin, và chia sẻ nội dung trực tiếp vào website của bạn, tạo cộng đồng người dùng sôi động."
  },
  {
    question: "Phương thức thanh toán như thế nào?",
    answer: "Chúng tôi hỗ trợ nhiều phương thức thanh toán linh hoạt: chuyển khoản ngân hàng, ví điện tử, và thanh toán theo giai đoạn. Thông thường chia thành 2-3 đợt thanh toán theo tiến độ dự án."
  }
];

// Service items for structured data
const serviceItems: ServiceItem[] = [
  {
    name: 'Thiết kế Website',
    description: 'Dịch vụ thiết kế website chuyên nghiệp, responsive, tối ưu SEO. Từ landing page đến website thương mại điện tử phức tạp.',
    url: 'https://chungtoixayweb.vn/bang-gia',
    category: 'Web Development',
    lowPrice: '5000000',
    highPrice: '50000000',
    offers: [{ price: '5000000', priceCurrency: 'VND' }],
  },
  {
    name: 'Zalo Mini App',
    description: 'Phát triển Zalo Mini App tích hợp hệ sinh thái Zalo, tiếp cận hàng triệu người dùng Việt Nam.',
    url: 'https://chungtoixayweb.vn/bang-gia',
    category: 'Mobile Development',
    lowPrice: '10000000',
    highPrice: '80000000',
    offers: [{ price: '10000000', priceCurrency: 'VND' }],
  },
  {
    name: 'Mobile App',
    description: 'Phát triển ứng dụng di động iOS và Android với công nghệ React Native hoặc Flutter.',
    url: 'https://chungtoixayweb.vn/bang-gia',
    category: 'Mobile Development',
    lowPrice: '20000000',
    highPrice: '150000000',
    offers: [{ price: '20000000', priceCurrency: 'VND' }],
  },
  {
    name: 'Website Mạng Xã Hội',
    description: 'Xây dựng nền tảng mạng xã hội với đầy đủ tính năng: đăng bài, bình luận, nhắn tin, theo dõi.',
    url: 'https://chungtoixayweb.vn/bang-gia',
    category: 'Web Development',
    lowPrice: '30000000',
    highPrice: '200000000',
    offers: [{ price: '30000000', priceCurrency: 'VND' }],
  },
];

export const metadata: Metadata = {
  title: 'Bảng giá dịch vụ thiết kế website',
  description: 'Bảng giá thiết kế website, Zalo Mini App, Mobile App chuyên nghiệp. Giá cả minh bạch, không phí ẩn. Liên hệ ngay để nhận báo giá chi tiết.',
  keywords: ['bảng giá website', 'thiết kế website', 'giá làm website', 'zalo mini app', 'mobile app'],
  openGraph: {
    title: 'Bảng giá dịch vụ - ChungToiXayWeb',
    description: 'Bảng giá thiết kế website, Zalo Mini App, Mobile App chuyên nghiệp tại Việt Nam.',
    type: 'website',
    locale: 'vi_VN',
  },
};

// JSON-LD Schema
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Bảng giá dịch vụ thiết kế website - ChungToiXayWeb',
  description: 'Bảng giá thiết kế website, Zalo Mini App, Mobile App chuyên nghiệp.',
  url: 'https://chungtoixayweb.vn/bang-gia',
  provider: {
    '@type': 'Organization',
    name: 'ChungToiXayWeb',
    url: 'https://chungtoixayweb.vn',
  },
};

export default function PricingPage() {
  return (
    <div className="force-light-mode">
      {/* Inline script to force light mode BEFORE React hydrates - prevents flash of dark mode */}
      <script
        key="force-light-mode"
        dangerouslySetInnerHTML={{
          __html: `(function(){
            var r=document.documentElement;
            r.classList.remove('dark');
            r.classList.add('light');
            r.style.colorScheme='light';
          })();`
        }}
      />
      <script
        key="pricing-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* SEO H1 - visually hidden but accessible to crawlers (AC-011) */}
      <h1 className="sr-only">
        Bảng giá dịch vụ thiết kế website - ChungToiXayWeb
      </h1>

      <div className="max-w-6xl mx-auto px-4">
        <Breadcrumb
          items={[
            { label: "Trang chủ", href: "/" },
            { label: "Bảng giá" },
          ]}
        />
      </div>
      <PricingPageClient />

      {/* FAQ Schema for SEO structured data */}
      <FAQSchema items={faqItems} />

      {/* Service Schema for SEO structured data */}
      <ServiceSchema services={serviceItems} />

      {/* FAQ Section - extra bottom padding for mobile fixed navigation */}
      <section className="mt-16 max-w-3xl mx-auto px-4 pb-32 md:pb-16">
        <h2 className="text-2xl font-bold text-center mb-8">Câu hỏi thường gặp</h2>
        <div className="space-y-4">
          {faqItems.map((item, index) => (
            <details key={index} className="group border border-border rounded-lg">
              <summary className="flex items-center justify-between p-4 cursor-pointer font-medium text-foreground hover:bg-accent/50 rounded-lg transition-colors">
                {item.question}
                <svg
                  className="h-5 w-5 text-muted-foreground transition-transform group-open:rotate-180"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="px-4 pb-4 text-muted-foreground leading-relaxed">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}

