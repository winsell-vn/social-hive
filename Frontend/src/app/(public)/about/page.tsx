import type { Metadata } from 'next';
import { Breadcrumb, FAQSchema } from '@/components/seo';
import type { FAQItem } from '@/components/seo';

export const metadata: Metadata = {
  title: 'Giới thiệu',
  description: 'Tìm hiểu về ChungToiXayWeb - Nền tảng mạng xã hội và thiết kế website chuyên nghiệp tại Việt Nam. Sứ mệnh kết nối cộng đồng và hỗ trợ doanh nghiệp phát triển trực tuyến.',
  keywords: ['giới thiệu', 'về chúng tôi', 'ChungToiXayWeb', 'thiết kế website', 'mạng xã hội Việt Nam'],
  openGraph: {
    title: 'Giới thiệu | ChungToiXayWeb',
    description: 'Nền tảng mạng xã hội và thiết kế website chuyên nghiệp tại Việt Nam.',
    type: 'website',
    locale: 'vi_VN',
  },
};

// Enhanced Organization JSON-LD schema (per design.md)
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'ChungToiXayWeb',
  url: 'https://chungtoixayweb.vn',
  logo: 'https://chungtoixayweb.vn/android-chrome-512x512.png',
  description: 'Nền tảng mạng xã hội và thiết kế website chuyên nghiệp tại Việt Nam',
  foundingDate: '2024',
  founders: [{ '@type': 'Person', name: 'ChungToiXayWeb Team' }],
  numberOfEmployees: { '@type': 'QuantitativeValue', value: 10 },
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Hồ Chí Minh',
    addressCountry: 'VN',
  },
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+84-817-771-184',
    email: 'contact@chungtoixayweb.vn',
    contactType: 'customer service',
    availableLanguage: 'Vietnamese',
  },
  sameAs: [
    'https://www.facebook.com/chungtoixayweb.vn',
    'https://zalo.me/0817771184',
  ],
};

// FAQ data for About page
const aboutFAQs: FAQItem[] = [
  {
    question: 'ChungToiXayWeb là gì?',
    answer: 'ChungToiXayWeb là nền tảng mạng xã hội và dịch vụ thiết kế website chuyên nghiệp tại Việt Nam. Chúng tôi kết nối cộng đồng những người đam mê công nghệ, thiết kế web và cung cấp các giải pháp số hóa cho doanh nghiệp.',
  },
  {
    question: 'Làm sao để bắt đầu sử dụng ChungToiXayWeb?',
    answer: 'Bạn có thể đăng ký tài khoản miễn phí trên website của chúng tôi. Sau khi đăng ký, bạn có thể tham gia cộng đồng, chia sẻ bài viết, và khám phá các dịch vụ thiết kế website.',
  },
  {
    question: 'Chi phí sử dụng ChungToiXayWeb là bao nhiêu?',
    answer: 'Việc tham gia mạng xã hội ChungToiXayWeb hoàn toàn miễn phí. Đối với dịch vụ thiết kế website, chi phí sẽ tùy thuộc vào yêu cầu cụ thể của dự án. Vui lòng liên hệ để được tư vấn và báo giá chi tiết.',
  },
  {
    question: 'ChungToiXayWeb có hỗ trợ thiết kế website không?',
    answer: 'Có, chúng tôi cung cấp dịch vụ thiết kế website chuyên nghiệp từ landing page đến hệ thống thương mại điện tử. Đội ngũ của chúng tôi có kinh nghiệm trong việc tối ưu SEO và trải nghiệm người dùng.',
  },
  {
    question: 'Làm sao để liên hệ hỗ trợ?',
    answer: 'Bạn có thể liên hệ với chúng tôi qua email contact@chungtoixayweb.vn, điện thoại +84 817 771 184, hoặc truy cập trang Liên hệ trên website. Đội ngũ hỗ trợ làm việc từ Thứ 2 đến Thứ 6, 9:00 - 18:00.',
  },
];

export default function AboutPage() {
  return (
    <>
      <script
        key="about-organization-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <FAQSchema items={aboutFAQs} />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <Breadcrumb
          items={[
            { label: 'Trang chủ', href: '/' },
            { label: 'Giới thiệu' },
          ]}
        />

        <h1 className="text-3xl font-bold text-foreground mt-6 mb-8">
          Giới thiệu về ChungToiXayWeb
        </h1>

        {/* Mission Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Sứ mệnh của chúng tôi</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            ChungToiXayWeb ra đời với sứ mệnh kết nối cộng đồng những người đam mê công nghệ, 
            thiết kế web và mạng xã hội tại Việt Nam. Chúng tôi tin rằng mỗi doanh nghiệp, 
            mỗi cá nhân đều xứng đáng có một không gian trực tuyến chuyên nghiệp để thể hiện 
            bản thân và phát triển.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Nền tảng của chúng tôi không chỉ là nơi chia sẻ kiến thức về thiết kế website, 
            mà còn là cộng đồng nơi các chuyên gia, nhà phát triển và người dùng có thể 
            trao đổi, học hỏi và cùng nhau phát triển.
          </p>
        </section>

        {/* What We Do Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Chúng tôi làm gì</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="p-6 rounded-lg border border-border bg-card">
              <h3 className="text-lg font-medium text-foreground mb-2">🌐 Mạng xã hội</h3>
              <p className="text-muted-foreground text-sm">
                Nền tảng kết nối cộng đồng yêu thích công nghệ và thiết kế web tại Việt Nam. 
                Chia sẻ bài viết, thảo luận và xây dựng mối quan hệ chuyên nghiệp.
              </p>
            </div>
            <div className="p-6 rounded-lg border border-border bg-card">
              <h3 className="text-lg font-medium text-foreground mb-2">💻 Thiết kế Website</h3>
              <p className="text-muted-foreground text-sm">
                Dịch vụ thiết kế website chuyên nghiệp, từ landing page đến hệ thống 
                thương mại điện tử phức tạp. Tối ưu SEO và trải nghiệm người dùng.
              </p>
            </div>
            <div className="p-6 rounded-lg border border-border bg-card">
              <h3 className="text-lg font-medium text-foreground mb-2">📱 Ứng dụng di động</h3>
              <p className="text-muted-foreground text-sm">
                Phát triển Zalo Mini App và ứng dụng di động đa nền tảng, 
                giúp doanh nghiệp tiếp cận khách hàng mọi lúc mọi nơi.
              </p>
            </div>
            <div className="p-6 rounded-lg border border-border bg-card">
              <h3 className="text-lg font-medium text-foreground mb-2">📚 Chia sẻ kiến thức</h3>
              <p className="text-muted-foreground text-sm">
                Blog và tài liệu hướng dẫn về thiết kế web, SEO, và phát triển phần mềm. 
                Cập nhật xu hướng công nghệ mới nhất.
              </p>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Đội ngũ của chúng tôi</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            ChungToiXayWeb được xây dựng bởi đội ngũ các chuyên gia công nghệ đam mê và 
            giàu kinh nghiệm. Chúng tôi đến từ nhiều lĩnh vực khác nhau: phát triển web, 
            thiết kế UI/UX, marketing số và quản lý sản phẩm.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Với hơn 10 thành viên cốt lõi và mạng lưới cộng tác viên rộng khắp, 
            chúng tôi cam kết mang đến những sản phẩm và dịch vụ chất lượng cao nhất 
            cho cộng đồng Việt Nam.
          </p>
        </section>

        {/* FAQ Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-foreground mb-6">Câu hỏi thường gặp</h2>
          <div className="space-y-4">
            {aboutFAQs.map((faq, idx) => (
              <details
                key={idx}
                className="group rounded-lg border border-border bg-card"
              >
                <summary className="flex cursor-pointer items-center justify-between p-4 font-medium text-foreground hover:bg-muted/50 rounded-lg transition-colors">
                  <span>{faq.question}</span>
                  <span className="ml-4 flex-shrink-0 text-muted-foreground group-open:rotate-180 transition-transform">
                    ▼
                  </span>
                </summary>
                <div className="px-4 pb-4 text-muted-foreground leading-relaxed">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* Contact CTA */}
        <section className="p-6 rounded-lg border border-border bg-card text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Liên hệ với chúng tôi</h2>
          <p className="text-muted-foreground mb-4">
            Bạn có câu hỏi hoặc muốn hợp tác? Chúng tôi luôn sẵn sàng lắng nghe.
          </p>
          <a
            href="/contact"
            className="inline-flex items-center justify-center px-6 py-2 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            Liên hệ ngay
          </a>
        </section>
      </div>
    </>
  );
}

