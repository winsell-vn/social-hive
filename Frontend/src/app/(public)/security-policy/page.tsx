import type { Metadata } from 'next';
import { Breadcrumb } from '@/components/seo';

export const metadata: Metadata = {
  title: 'Chính sách Bảo mật Hệ thống | ChungToiXayWeb',
  description: 'Chính sách bảo mật hệ thống của ChungToiXayWeb - Tìm hiểu các biện pháp bảo mật chúng tôi áp dụng để bảo vệ hệ thống và dữ liệu người dùng.',
  keywords: ['chính sách bảo mật', 'bảo mật hệ thống', 'an toàn thông tin', 'ChungToiXayWeb', 'security policy'],
  openGraph: {
    title: 'Chính sách Bảo mật Hệ thống | ChungToiXayWeb',
    description: 'Chính sách bảo mật hệ thống và các biện pháp bảo vệ dữ liệu của ChungToiXayWeb.',
    type: 'website',
    locale: 'vi_VN',
  },
  alternates: {
    canonical: 'https://chungtoixayweb.vn/security-policy',
  },
};

export default function SecurityPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Breadcrumb
        items={[
          { label: 'Trang chủ', href: '/' },
          { label: 'Chính sách Bảo mật Hệ thống' },
        ]}
      />

      <h1 className="text-3xl font-bold text-foreground mt-6 mb-8">
        Chính sách Bảo mật Hệ thống
      </h1>

      <div className="prose prose-invert max-w-none">
        <p className="text-muted-foreground mb-6">
          Cập nhật lần cuối: 21/02/2026
        </p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">1. Giới thiệu</h2>
          <p className="text-muted-foreground leading-relaxed">
            ChungToiXayWeb cam kết bảo vệ an toàn hệ thống và dữ liệu người dùng. 
            Chính sách này mô tả các biện pháp bảo mật chúng tôi áp dụng.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">2. Báo cáo Lỗ hổng Bảo mật</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Nếu bạn phát hiện lỗ hổng bảo mật, vui lòng liên hệ qua email{' '}
            <a href="mailto:support@chungtoixayweb.vn" className="text-primary hover:underline">
              support@chungtoixayweb.vn
            </a>
            . Chúng tôi cam kết:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
            <li>Phản hồi trong vòng 48 giờ</li>
            <li>Không truy cứu pháp lý đối với người báo cáo thiện chí</li>
            <li>Cập nhật tiến độ xử lý định kỳ</li>
            <li>Ghi nhận đóng góp của người báo cáo (nếu được đồng ý)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">3. Biện pháp Bảo mật Kỹ thuật</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Các biện pháp bảo mật chúng tôi áp dụng:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
            <li>Mã hóa dữ liệu truyền tải bằng HTTPS/TLS</li>
            <li>Xác thực JWT với token refresh tự động</li>
            <li>Bảo vệ CSRF và XSS</li>
            <li>Rate limiting và chống brute-force</li>
            <li>Mã hóa mật khẩu bằng bcrypt</li>
            <li>Xác thực CAPTCHA (Cloudflare Turnstile)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">4. Bảo vệ Dữ liệu Người dùng</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Chúng tôi bảo vệ dữ liệu cá nhân bằng:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
            <li>Phân quyền truy cập theo vai trò (RBAC)</li>
            <li>Kiểm soát truy cập API nghiêm ngặt</li>
            <li>Sao lưu dữ liệu định kỳ</li>
            <li>Giám sát hệ thống 24/7</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">5. Quản lý Sự cố Bảo mật</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Quy trình xử lý sự cố:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
            <li>Phát hiện và đánh giá mức độ nghiêm trọng</li>
            <li>Cô lập và khắc phục sự cố</li>
            <li>Thông báo cho người dùng bị ảnh hưởng</li>
            <li>Phân tích nguyên nhân và cải thiện hệ thống</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">6. Cập nhật và Bảo trì</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Chúng tôi thường xuyên:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
            <li>Cập nhật các bản vá bảo mật</li>
            <li>Kiểm tra và đánh giá bảo mật định kỳ</li>
            <li>Nâng cấp hệ thống và thư viện phần mềm</li>
            <li>Đào tạo nhân viên về bảo mật thông tin</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">7. Liên hệ</h2>
          <p className="text-muted-foreground leading-relaxed">
            Nếu bạn có câu hỏi về chính sách bảo mật hệ thống hoặc muốn báo cáo vấn đề bảo mật, 
            vui lòng liên hệ:
          </p>
          <ul className="list-none text-muted-foreground space-y-2 mt-4">
            <li>📧 Email: <a href="mailto:support@chungtoixayweb.vn" className="text-primary hover:underline">support@chungtoixayweb.vn</a></li>
            <li>🔐 Security.txt: <a href="/.well-known/security.txt" className="text-primary hover:underline">/.well-known/security.txt</a></li>
          </ul>
        </section>
      </div>
    </div>
  );
}

