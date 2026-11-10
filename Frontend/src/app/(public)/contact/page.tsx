import type { Metadata } from 'next';
import { Breadcrumb, FAQSchema } from '@/components/seo';
import type { FAQItem } from '@/components/seo';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Liên hệ',
  description: 'Liên hệ với ChungToiXayWeb - Hỗ trợ khách hàng, tư vấn dịch vụ thiết kế website và giải đáp thắc mắc. Email: contact@chungtoixayweb.vn',
  keywords: ['liên hệ', 'hỗ trợ', 'tư vấn', 'ChungToiXayWeb', 'thiết kế website'],
  openGraph: {
    title: 'Liên hệ | ChungToiXayWeb',
    description: 'Liên hệ với ChungToiXayWeb để được hỗ trợ và tư vấn dịch vụ.',
    type: 'website',
    locale: 'vi_VN',
  },
};

// ContactPoint JSON-LD schema (per design.md)
const contactPointSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'ChungToiXayWeb',
  url: 'https://chungtoixayweb.vn',
  contactPoint: [
    {
      '@type': 'ContactPoint',
      telephone: '+84-817-771-184',
      email: 'contact@chungtoixayweb.vn',
      contactType: 'customer service',
      availableLanguage: 'Vietnamese',
      hoursAvailable: {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '09:00',
        closes: '18:00',
      },
    },
    {
      '@type': 'ContactPoint',
      email: 'support@chungtoixayweb.vn',
      contactType: 'technical support',
      availableLanguage: 'Vietnamese',
    },
  ],
};

// FAQ data for Contact page
const contactFAQs: FAQItem[] = [
  {
    question: 'Thời gian phản hồi là bao lâu?',
    answer: 'Chúng tôi cam kết phản hồi trong vòng 24 giờ làm việc đối với email. Đối với các yêu cầu khẩn cấp, bạn có thể liên hệ qua điện thoại để được hỗ trợ nhanh hơn.',
  },
  {
    question: 'Tôi có thể liên hệ qua kênh nào?',
    answer: 'Bạn có thể liên hệ với chúng tôi qua email contact@chungtoixayweb.vn, điện thoại +84 817 771 184, hoặc điền form liên hệ trên trang này. Chúng tôi cũng có mặt trên Facebook và Zalo.',
  },
  {
    question: 'Làm sao để báo cáo lỗi?',
    answer: 'Để báo cáo lỗi kỹ thuật, vui lòng gửi email đến support@chungtoixayweb.vn với mô tả chi tiết về lỗi, bao gồm ảnh chụp màn hình nếu có. Đội ngũ kỹ thuật sẽ xem xét và phản hồi trong thời gian sớm nhất.',
  },
  {
    question: 'Có hỗ trợ ngoài giờ làm việc không?',
    answer: 'Giờ làm việc chính thức của chúng tôi là Thứ 2 - Thứ 6, 9:00 - 18:00 và Thứ 7, 9:00 - 12:00. Ngoài giờ làm việc, bạn vẫn có thể gửi email và chúng tôi sẽ phản hồi vào ngày làm việc tiếp theo.',
  },
];

export default function ContactPage() {
  return (
    <>
      <script
        key="contact-point-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactPointSchema) }}
      />
      <FAQSchema items={contactFAQs} />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <Breadcrumb
          items={[
            { label: 'Trang chủ', href: '/' },
            { label: 'Liên hệ' },
          ]}
        />

        <h1 className="text-3xl font-bold text-foreground mt-6 mb-8">
          Liên hệ với chúng tôi
        </h1>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Contact Information */}
          <div className="space-y-6">
            <p className="text-muted-foreground leading-relaxed">
              Bạn có câu hỏi hoặc cần hỗ trợ? Đội ngũ ChungToiXayWeb luôn sẵn sàng 
              lắng nghe và giúp đỡ bạn. Hãy liên hệ với chúng tôi qua các kênh dưới đây.
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 rounded-lg border border-border bg-card">
                <Mail className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-foreground">Email</h3>
                  <a 
                    href="mailto:contact@chungtoixayweb.vn" 
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    contact@chungtoixayweb.vn
                  </a>
                  <p className="text-sm text-muted-foreground mt-1">
                    Phản hồi trong vòng 24 giờ làm việc
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-lg border border-border bg-card">
                <Phone className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-foreground">Điện thoại</h3>
                  <a
                    href="tel:+84817771184"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    +84 817 771 184
                  </a>
                  <p className="text-sm text-muted-foreground mt-1">
                    Thứ 2 - Thứ 6, 9:00 - 18:00
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-lg border border-border bg-card">
                <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-foreground">Địa chỉ</h3>
                  <p className="text-muted-foreground">
                    Thành phố Hồ Chí Minh, Việt Nam
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-lg border border-border bg-card">
                <Clock className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-foreground">Giờ làm việc</h3>
                  <p className="text-muted-foreground">
                    Thứ 2 - Thứ 6: 9:00 - 18:00
                  </p>
                  <p className="text-muted-foreground">
                    Thứ 7: 9:00 - 12:00
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Chủ nhật và ngày lễ: Nghỉ
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="p-6 rounded-lg border border-border bg-card">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Gửi tin nhắn
            </h2>
            <form className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">
                  Họ và tên
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Nhập họ và tên"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Nhập địa chỉ email"
                />
              </div>
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-foreground mb-1">
                  Chủ đề
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Nhập chủ đề"
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-foreground mb-1">
                  Nội dung
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  placeholder="Nhập nội dung tin nhắn"
                />
              </div>
              <button
                type="submit"
                className="w-full px-4 py-2 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                Gửi tin nhắn
              </button>
            </form>
            <p className="text-xs text-muted-foreground mt-4 text-center">
              Bằng việc gửi tin nhắn, bạn đồng ý với{' '}
              <a href="/privacy" className="text-primary hover:underline">
                Chính sách bảo mật
              </a>{' '}
              của chúng tôi.
            </p>
          </div>
        </div>

        {/* FAQ Section */}
        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-foreground mb-6">Câu hỏi thường gặp về hỗ trợ</h2>
          <div className="space-y-4">
            {contactFAQs.map((faq, idx) => (
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
      </div>
    </>
  );
}

