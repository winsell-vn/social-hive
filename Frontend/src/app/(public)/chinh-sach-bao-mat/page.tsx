import type { Metadata } from 'next';
import { Breadcrumb } from '@/components/seo/Breadcrumb';

export const metadata: Metadata = {
  title: 'Chính sách bảo mật',
  description: 'Chính sách bảo mật của ChungToiXayWeb - Tìm hiểu cách chúng tôi thu thập, sử dụng, bảo vệ thông tin cá nhân và quyền của bạn đối với dữ liệu.',
  keywords: ['chính sách bảo mật', 'quyền riêng tư', 'bảo vệ dữ liệu', 'ChungToiXayWeb', 'privacy policy'],
  openGraph: {
    title: 'Chính sách bảo mật | ChungToiXayWeb',
    description: 'Chính sách bảo mật và quyền riêng tư của ChungToiXayWeb.',
    type: 'website',
    locale: 'vi_VN',
  },
  alternates: {
    canonical: 'https://chungtoixayweb.vn/chinh-sach-bao-mat',
  },
};

const tocItems = [
  { id: 'gioi-thieu', label: '1. Giới thiệu' },
  { id: 'thong-tin-thu-thap', label: '2. Thông tin chúng tôi thu thập' },
  { id: 'cach-su-dung', label: '3. Cách chúng tôi sử dụng thông tin' },
  { id: 'chia-se-ben-thu-ba', label: '4. Chia sẻ thông tin với bên thứ ba' },
  { id: 'cookie', label: '5. Cookie và công nghệ theo dõi' },
  { id: 'bao-mat-du-lieu', label: '6. Bảo mật dữ liệu' },
  { id: 'quyen-nguoi-dung', label: '7. Quyền của người dùng' },
  { id: 'luu-tru', label: '8. Lưu trữ dữ liệu' },
  { id: 'tre-em', label: '9. Trẻ em và quyền riêng tư' },
  { id: 'thay-doi', label: '10. Thay đổi chính sách' },
  { id: 'lien-he', label: '11. Liên hệ về quyền riêng tư' },
];

export default function ChinhSachBaoMatPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Breadcrumb
        items={[
          { label: 'Trang chủ', href: '/' },
          { label: 'Chính sách bảo mật' },
        ]}
      />

      <h1 className="text-3xl font-bold text-foreground mt-6 mb-8">
        Chính sách bảo mật
      </h1>

      <div className="prose prose-invert max-w-none">
        <p className="text-muted-foreground mb-6">
          Cập nhật lần cuối: 27/02/2026
        </p>

        {/* Table of Contents */}
        <nav className="mb-8 p-4 bg-muted/30 rounded-lg">
          <h2 className="text-lg font-semibold text-foreground mb-3">Mục lục</h2>
          <ul className="list-none space-y-1 text-sm">
            {tocItems.map((item) => (
              <li key={item.id}>
                <a href={`#${item.id}`} className="text-primary hover:underline">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <section className="mb-8">
          <h2 id="gioi-thieu" className="text-xl font-semibold text-foreground mb-4 scroll-mt-24">
            1. Giới thiệu
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            ChungToiXayWeb (&quot;chúng tôi&quot;, &quot;của chúng tôi&quot;) cam kết bảo vệ quyền 
            riêng tư của bạn. Chính sách bảo mật này giải thích cách chúng tôi thu thập, sử dụng, 
            lưu trữ và bảo vệ thông tin cá nhân của bạn khi sử dụng website chungtoixayweb.vn 
            và các dịch vụ liên quan.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Bằng việc sử dụng Nền tảng, bạn đồng ý với các điều khoản trong Chính sách bảo mật này. 
            Vui lòng đọc kỹ trước khi cung cấp thông tin cá nhân.
          </p>
        </section>

        <section className="mb-8">
          <h2 id="thong-tin-thu-thap" className="text-xl font-semibold text-foreground mb-4 scroll-mt-24">
            2. Thông tin chúng tôi thu thập
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Chúng tôi thu thập các loại thông tin sau:
          </p>
          
          <h3 className="text-lg font-medium text-foreground mb-2 mt-4">2.1. Thông tin bạn cung cấp trực tiếp</h3>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
            <li>Thông tin đăng ký: họ tên, email, số điện thoại, mật khẩu (được mã hóa)</li>
            <li>Thông tin hồ sơ: ảnh đại diện, tiểu sử, liên kết mạng xã hội</li>
            <li>Nội dung bạn tạo: bài viết, bình luận, tin nhắn, phản hồi</li>
            <li>Thông tin giao dịch: yêu cầu báo giá, đơn hàng dịch vụ</li>
            <li>Thông tin liên hệ: nội dung form liên hệ, email hỗ trợ</li>
          </ul>

          <h3 className="text-lg font-medium text-foreground mb-2 mt-4">2.2. Thông tin thu thập tự động</h3>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
            <li>Địa chỉ IP và vị trí địa lý ước tính</li>
            <li>Loại trình duyệt, hệ điều hành, thiết bị</li>
            <li>Trang web giới thiệu (referrer)</li>
            <li>Thời gian truy cập và các trang đã xem</li>
            <li>Hành vi tương tác trên Nền tảng</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 id="cach-su-dung" className="text-xl font-semibold text-foreground mb-4 scroll-mt-24">
            3. Cách chúng tôi sử dụng thông tin
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Chúng tôi sử dụng thông tin thu thập được để:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
            <li>Cung cấp, duy trì và cải thiện dịch vụ</li>
            <li>Xác thực tài khoản và bảo mật đăng nhập</li>
            <li>Cá nhân hóa trải nghiệm người dùng và newsfeed</li>
            <li>Gửi thông báo về tài khoản, cập nhật dịch vụ</li>
            <li>Xử lý yêu cầu báo giá và đơn hàng dịch vụ</li>
            <li>Phân tích xu hướng và cải thiện Nền tảng</li>
            <li>Phát hiện và ngăn chặn gian lận, spam, lạm dụng</li>
            <li>Tuân thủ các nghĩa vụ pháp lý</li>
            <li>Hỗ trợ khách hàng qua chatbot AI và email</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 id="chia-se-ben-thu-ba" className="text-xl font-semibold text-foreground mb-4 scroll-mt-24">
            4. Chia sẻ thông tin với bên thứ ba
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Chúng tôi <strong>không bán</strong> thông tin cá nhân của bạn. Chúng tôi chỉ chia sẻ
            thông tin trong các trường hợp sau:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
            <li><strong>Với sự đồng ý của bạn:</strong> Khi bạn cho phép chia sẻ rõ ràng</li>
            <li><strong>Nhà cung cấp dịch vụ:</strong> Hosting, email, thanh toán, phân tích (có ràng buộc bảo mật)</li>
            <li><strong>Yêu cầu pháp lý:</strong> Khi được yêu cầu bởi pháp luật hoặc cơ quan có thẩm quyền</li>
            <li><strong>Bảo vệ quyền lợi:</strong> Để bảo vệ quyền, tài sản hoặc an toàn của chúng tôi và người dùng</li>
            <li><strong>Chuyển nhượng kinh doanh:</strong> Trong trường hợp sáp nhập, mua lại (với thông báo trước)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 id="cookie" className="text-xl font-semibold text-foreground mb-4 scroll-mt-24">
            5. Cookie và công nghệ theo dõi
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Chúng tôi sử dụng cookie và các công nghệ tương tự để:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
            <li><strong>Cookie thiết yếu:</strong> Duy trì phiên đăng nhập, bảo mật</li>
            <li><strong>Cookie chức năng:</strong> Ghi nhớ tùy chọn, cài đặt giao diện (dark mode)</li>
            <li><strong>Cookie phân tích:</strong> Phân tích lưu lượng truy cập, hành vi người dùng</li>
            <li><strong>Cookie hiệu suất:</strong> Cải thiện tốc độ và hiệu suất website</li>
          </ul>
          <p className="text-muted-foreground leading-relaxed mt-4">
            Bạn có thể kiểm soát cookie thông qua cài đặt trình duyệt. Tuy nhiên, việc vô hiệu hóa
            cookie thiết yếu có thể ảnh hưởng đến khả năng sử dụng một số tính năng của Nền tảng.
          </p>
        </section>

        <section className="mb-8">
          <h2 id="bao-mat-du-lieu" className="text-xl font-semibold text-foreground mb-4 scroll-mt-24">
            6. Bảo mật dữ liệu
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Chúng tôi áp dụng các biện pháp bảo mật kỹ thuật và tổ chức để bảo vệ thông tin của bạn:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
            <li>Mã hóa dữ liệu truyền tải qua HTTPS/TLS</li>
            <li>Mã hóa mật khẩu bằng thuật toán bcrypt</li>
            <li>Xác thực hai yếu tố (2FA) tùy chọn</li>
            <li>Xác thực file upload bằng magic bytes (không chỉ MIME type)</li>
            <li>Giám sát và phát hiện truy cập bất thường</li>
            <li>Sao lưu dữ liệu định kỳ</li>
            <li>Kiểm soát truy cập theo nguyên tắc tối thiểu quyền</li>
          </ul>
          <p className="text-muted-foreground leading-relaxed mt-4">
            Tuy nhiên, không có phương thức truyền tải qua Internet nào là an toàn tuyệt đối.
            Chúng tôi không thể đảm bảo an ninh 100% cho dữ liệu của bạn.
          </p>
        </section>

        <section className="mb-8">
          <h2 id="quyen-nguoi-dung" className="text-xl font-semibold text-foreground mb-4 scroll-mt-24">
            7. Quyền của người dùng
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Bạn có các quyền sau đối với thông tin cá nhân của mình:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
            <li><strong>Quyền truy cập:</strong> Xem thông tin chúng tôi lưu trữ về bạn</li>
            <li><strong>Quyền chỉnh sửa:</strong> Cập nhật hoặc sửa đổi thông tin không chính xác</li>
            <li><strong>Quyền xóa:</strong> Yêu cầu xóa tài khoản và dữ liệu cá nhân</li>
            <li><strong>Quyền hạn chế:</strong> Hạn chế việc xử lý thông tin của bạn</li>
            <li><strong>Quyền phản đối:</strong> Phản đối việc sử dụng thông tin cho mục đích marketing</li>
            <li><strong>Quyền di chuyển:</strong> Yêu cầu xuất dữ liệu của bạn ở định dạng phổ biến</li>
            <li><strong>Quyền rút đồng ý:</strong> Rút lại sự đồng ý đã cấp trước đó</li>
          </ul>
          <p className="text-muted-foreground leading-relaxed mt-4">
            Để thực hiện các quyền này, vui lòng liên hệ qua email{' '}
            <a href="mailto:privacy@chungtoixayweb.vn" className="text-primary hover:underline">
              privacy@chungtoixayweb.vn
            </a>
            . Chúng tôi sẽ phản hồi trong vòng 30 ngày làm việc.
          </p>
        </section>

        <section className="mb-8">
          <h2 id="luu-tru" className="text-xl font-semibold text-foreground mb-4 scroll-mt-24">
            8. Lưu trữ dữ liệu
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Chúng tôi lưu trữ thông tin của bạn trong thời gian:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
            <li>Thông tin tài khoản: Cho đến khi bạn xóa tài khoản</li>
            <li>Nội dung đăng tải: Cho đến khi bạn xóa hoặc xóa tài khoản</li>
            <li>Log hệ thống: Tối đa 90 ngày</li>
            <li>Dữ liệu giao dịch: Theo yêu cầu pháp luật (tối thiểu 5 năm)</li>
          </ul>
          <p className="text-muted-foreground leading-relaxed mt-4">
            Khi bạn xóa tài khoản, chúng tôi sẽ xóa hoặc ẩn danh hóa thông tin cá nhân trong vòng
            30 ngày, trừ khi cần giữ lại để tuân thủ nghĩa vụ pháp lý hoặc giải quyết tranh chấp.
          </p>
        </section>

        <section className="mb-8">
          <h2 id="tre-em" className="text-xl font-semibold text-foreground mb-4 scroll-mt-24">
            9. Trẻ em và quyền riêng tư
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Nền tảng không dành cho trẻ em dưới 16 tuổi. Chúng tôi không cố ý thu thập thông tin
            cá nhân từ trẻ em dưới 16 tuổi. Nếu bạn là phụ huynh hoặc người giám hộ và phát hiện
            con em mình đã cung cấp thông tin cho chúng tôi, vui lòng liên hệ ngay để chúng tôi
            xóa thông tin đó.
          </p>
        </section>

        <section className="mb-8">
          <h2 id="thay-doi" className="text-xl font-semibold text-foreground mb-4 scroll-mt-24">
            10. Thay đổi chính sách
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Chúng tôi có thể cập nhật Chính sách bảo mật này theo thời gian. Những thay đổi quan trọng
            sẽ được thông báo qua email hoặc thông báo trên website ít nhất 7 ngày trước khi có hiệu lực.
            Ngày &quot;Cập nhật lần cuối&quot; ở đầu trang sẽ được cập nhật tương ứng.
          </p>
        </section>

        <section className="mb-8">
          <h2 id="lien-he" className="text-xl font-semibold text-foreground mb-4 scroll-mt-24">
            11. Liên hệ về quyền riêng tư
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Nếu bạn có câu hỏi về Chính sách bảo mật này hoặc muốn thực hiện quyền của mình,
            vui lòng liên hệ:
          </p>
          <ul className="list-none text-muted-foreground space-y-2 mt-4">
            <li>📧 Email quyền riêng tư: <a href="mailto:privacy@chungtoixayweb.vn" className="text-primary hover:underline">privacy@chungtoixayweb.vn</a></li>
            <li>📧 Email hỗ trợ: <a href="mailto:support@chungtoixayweb.vn" className="text-primary hover:underline">support@chungtoixayweb.vn</a></li>
            <li>📞 Điện thoại: <a href="tel:+84817771184" className="text-primary hover:underline">+84 817 771 184</a></li>
            <li>📍 Địa chỉ: Thành phố Hồ Chí Minh, Việt Nam</li>
          </ul>
        </section>

        <div className="mt-8 pt-6 border-t border-border">
          <p className="text-sm text-muted-foreground">
            © 2026 ChungToiXayWeb. Bảo lưu mọi quyền.
          </p>
        </div>
      </div>
    </div>
  );
}

