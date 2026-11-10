import type { Metadata } from 'next';
import { Breadcrumb } from '@/components/seo';

export const metadata: Metadata = {
  title: 'Điều khoản sử dụng',
  description: 'Điều khoản sử dụng của ChungToiXayWeb - Quy định về trách nhiệm người dùng, chính sách nội dung, quyền sở hữu trí tuệ và các điều khoản pháp lý khi sử dụng dịch vụ.',
  keywords: ['điều khoản sử dụng', 'điều khoản dịch vụ', 'quy định', 'ChungToiXayWeb', 'terms of service'],
  openGraph: {
    title: 'Điều khoản sử dụng | ChungToiXayWeb',
    description: 'Điều khoản sử dụng và quy định của ChungToiXayWeb.',
    type: 'website',
    locale: 'vi_VN',
  },
  alternates: {
    canonical: 'https://chungtoixayweb.vn/dieu-khoan',
  },
};

const tocItems = [
  { id: 'chap-nhan', label: '1. Chấp nhận điều khoản' },
  { id: 'mo-ta-dich-vu', label: '2. Mô tả dịch vụ' },
  { id: 'tai-khoan', label: '3. Tài khoản người dùng' },
  { id: 'noi-dung-ugc', label: '4. Nội dung người dùng (UGC)' },
  { id: 'so-huu-tri-tue', label: '5. Quyền sở hữu trí tuệ' },
  { id: 'hanh-vi-cam', label: '6. Hành vi bị cấm' },
  { id: 'quyen-rieng-tu', label: '7. Quyền riêng tư và bảo mật dữ liệu' },
  { id: 'gioi-han-trach-nhiem', label: '8. Giới hạn trách nhiệm' },
  { id: 'cham-dut', label: '9. Chấm dứt tài khoản' },
  { id: 'thay-doi', label: '10. Thay đổi điều khoản' },
  { id: 'luat-ap-dung', label: '11. Luật áp dụng' },
  { id: 'lien-he', label: '12. Liên hệ' },
];

export default function DieuKhoanPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Breadcrumb
        items={[
          { label: 'Trang chủ', href: '/' },
          { label: 'Điều khoản sử dụng' },
        ]}
      />

      <h1 className="text-3xl font-bold text-foreground mt-6 mb-8">
        Điều khoản sử dụng
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
          <h2 id="chap-nhan" className="text-xl font-semibold text-foreground mb-4 scroll-mt-24">
            1. Chấp nhận điều khoản
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Bằng việc truy cập và sử dụng ChungToiXayWeb (&quot;Nền tảng&quot;), bạn đồng ý tuân thủ 
            các điều khoản và điều kiện được nêu trong tài liệu này. Nếu bạn không đồng ý với 
            bất kỳ phần nào của các điều khoản này, vui lòng không sử dụng dịch vụ của chúng tôi.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Các điều khoản này áp dụng cho tất cả người dùng, bao gồm khách truy cập, người dùng 
            đã đăng ký, và khách hàng sử dụng dịch vụ thiết kế website, marketing số và các 
            dịch vụ khác của ChungToiXayWeb.
          </p>
        </section>

        <section className="mb-8">
          <h2 id="mo-ta-dich-vu" className="text-xl font-semibold text-foreground mb-4 scroll-mt-24">
            2. Mô tả dịch vụ
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            ChungToiXayWeb cung cấp:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
            <li>Nền tảng mạng xã hội cho cộng đồng công nghệ và kinh doanh</li>
            <li>Dịch vụ thiết kế website và phát triển phần mềm</li>
            <li>Dịch vụ SEO, marketing số và quảng cáo trực tuyến</li>
            <li>Chatbot AI tư vấn (Hưng DPS) hỗ trợ 24/7</li>
            <li>Đăng ký tên miền, hosting và các dịch vụ hạ tầng</li>
            <li>Giải pháp AI và tự động hóa quy trình</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 id="tai-khoan" className="text-xl font-semibold text-foreground mb-4 scroll-mt-24">
            3. Tài khoản người dùng
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Khi đăng ký tài khoản, bạn cam kết:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
            <li>Cung cấp thông tin chính xác, đầy đủ và cập nhật</li>
            <li>Bảo mật thông tin đăng nhập và không chia sẻ với người khác</li>
            <li>Chịu trách nhiệm về mọi hoạt động diễn ra trên tài khoản của bạn</li>
            <li>Thông báo ngay cho chúng tôi nếu phát hiện truy cập trái phép</li>
            <li>Chỉ tạo một tài khoản duy nhất cho mục đích cá nhân</li>
          </ul>
          <p className="text-muted-foreground leading-relaxed mt-4">
            Người dùng phải từ 16 tuổi trở lên để đăng ký tài khoản. Nếu dưới 18 tuổi, 
            cần có sự đồng ý của phụ huynh hoặc người giám hộ.
          </p>
        </section>

        <section className="mb-8">
          <h2 id="noi-dung-ugc" className="text-xl font-semibold text-foreground mb-4 scroll-mt-24">
            4. Nội dung người dùng (UGC)
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Bạn giữ quyền sở hữu đối với nội dung bạn tạo ra. Tuy nhiên, bằng việc đăng tải 
            nội dung lên Nền tảng, bạn cấp cho ChungToiXayWeb:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
            <li>Quyền sử dụng, hiển thị, phân phối và lưu trữ nội dung trên Nền tảng</li>
            <li>Quyền tạo các phiên bản phái sinh (như thumbnail, preview)</li>
            <li>Quyền sử dụng nội dung cho mục đích quảng bá Nền tảng</li>
          </ul>
          <p className="text-muted-foreground leading-relaxed mt-4">
            Nội dung bạn đăng tải phải tuân thủ quy định tại Mục 6 (Hành vi bị cấm). 
            Chúng tôi có quyền xóa nội dung vi phạm mà không cần thông báo trước.
          </p>
        </section>

        <section className="mb-8">
          <h2 id="so-huu-tri-tue" className="text-xl font-semibold text-foreground mb-4 scroll-mt-24">
            5. Quyền sở hữu trí tuệ
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Thương hiệu &quot;ChungToiXayWeb&quot;, logo, giao diện, mã nguồn và tất cả tài sản
            trí tuệ khác của Nền tảng thuộc sở hữu của chúng tôi và được bảo hộ bởi pháp luật
            Việt Nam và quốc tế về sở hữu trí tuệ.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Bạn không được sao chép, sửa đổi, phân phối, bán hoặc cho thuê bất kỳ phần nào
            của Nền tảng mà không có sự cho phép bằng văn bản từ chúng tôi.
          </p>
        </section>

        <section className="mb-8">
          <h2 id="hanh-vi-cam" className="text-xl font-semibold text-foreground mb-4 scroll-mt-24">
            6. Hành vi bị cấm
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Khi sử dụng Nền tảng, bạn không được:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
            <li>Đăng nội dung vi phạm pháp luật, khiêu dâm, bạo lực hoặc thù địch</li>
            <li>Xâm phạm quyền sở hữu trí tuệ của bên thứ ba</li>
            <li>Spam, quảng cáo trái phép hoặc lừa đảo</li>
            <li>Đăng thông tin sai lệch, tin giả hoặc gây hiểu lầm</li>
            <li>Quấy rối, đe dọa hoặc phân biệt đối xử với người dùng khác</li>
            <li>Cố gắng truy cập trái phép vào hệ thống hoặc tài khoản người khác</li>
            <li>Sử dụng bot, script hoặc công cụ tự động để thao túng Nền tảng</li>
            <li>Thu thập thông tin cá nhân của người dùng khác mà không được phép</li>
            <li>Phát tán virus, malware hoặc mã độc hại</li>
            <li>Vi phạm các quy định pháp luật hiện hành của Việt Nam</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 id="quyen-rieng-tu" className="text-xl font-semibold text-foreground mb-4 scroll-mt-24">
            7. Quyền riêng tư và bảo mật dữ liệu
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Việc thu thập và xử lý dữ liệu cá nhân của bạn được quy định chi tiết trong{' '}
            <a href="/chinh-sach-bao-mat" className="text-primary hover:underline">
              Chính sách bảo mật
            </a>
            . Bằng việc sử dụng Nền tảng, bạn đồng ý với các điều khoản trong Chính sách bảo mật.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Chúng tôi cam kết bảo vệ thông tin cá nhân của bạn và tuân thủ các quy định
            về bảo vệ dữ liệu cá nhân theo pháp luật Việt Nam.
          </p>
        </section>

        <section className="mb-8">
          <h2 id="gioi-han-trach-nhiem" className="text-xl font-semibold text-foreground mb-4 scroll-mt-24">
            8. Giới hạn trách nhiệm
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            ChungToiXayWeb cung cấp dịch vụ &quot;nguyên trạng&quot; (as-is) và không đảm bảo:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
            <li>Dịch vụ sẽ hoạt động liên tục, không gián đoạn hoặc không có lỗi</li>
            <li>Nội dung do người dùng đăng tải là chính xác hoặc đáng tin cậy</li>
            <li>Kết quả từ việc sử dụng dịch vụ sẽ đáp ứng mong đợi của bạn</li>
            <li>Các lỗi trong phần mềm sẽ được sửa chữa kịp thời</li>
          </ul>
          <p className="text-muted-foreground leading-relaxed mt-4">
            Trong phạm vi pháp luật cho phép, chúng tôi không chịu trách nhiệm về bất kỳ
            thiệt hại trực tiếp, gián tiếp, ngẫu nhiên, đặc biệt hoặc hậu quả nào phát sinh
            từ việc sử dụng hoặc không thể sử dụng dịch vụ.
          </p>
        </section>

        <section className="mb-8">
          <h2 id="cham-dut" className="text-xl font-semibold text-foreground mb-4 scroll-mt-24">
            9. Chấm dứt tài khoản
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Chúng tôi có quyền đình chỉ hoặc chấm dứt tài khoản của bạn nếu:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
            <li>Vi phạm các điều khoản sử dụng này</li>
            <li>Có hành vi gian lận hoặc lạm dụng dịch vụ</li>
            <li>Không hoạt động trong thời gian dài (trên 24 tháng)</li>
            <li>Theo yêu cầu của cơ quan có thẩm quyền</li>
          </ul>
          <p className="text-muted-foreground leading-relaxed mt-4">
            Bạn có thể xóa tài khoản bất cứ lúc nào thông qua cài đặt tài khoản hoặc
            liên hệ với chúng tôi qua email.
          </p>
        </section>

        <section className="mb-8">
          <h2 id="thay-doi" className="text-xl font-semibold text-foreground mb-4 scroll-mt-24">
            10. Thay đổi điều khoản
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Chúng tôi có thể cập nhật các điều khoản này theo thời gian. Những thay đổi quan trọng
            sẽ được thông báo qua email hoặc thông báo trên website ít nhất 7 ngày trước khi có hiệu lực.
            Việc tiếp tục sử dụng dịch vụ sau khi thay đổi có hiệu lực đồng nghĩa với việc
            bạn chấp nhận các điều khoản mới.
          </p>
        </section>

        <section className="mb-8">
          <h2 id="luat-ap-dung" className="text-xl font-semibold text-foreground mb-4 scroll-mt-24">
            11. Luật áp dụng
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Các điều khoản này được điều chỉnh và giải thích theo pháp luật nước Cộng hòa
            Xã hội Chủ nghĩa Việt Nam. Mọi tranh chấp phát sinh từ hoặc liên quan đến các
            điều khoản này sẽ được giải quyết tại Tòa án nhân dân có thẩm quyền tại
            Thành phố Hồ Chí Minh, Việt Nam.
          </p>
        </section>

        <section className="mb-8">
          <h2 id="lien-he" className="text-xl font-semibold text-foreground mb-4 scroll-mt-24">
            12. Liên hệ
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Nếu bạn có câu hỏi về các điều khoản này, vui lòng liên hệ:
          </p>
          <ul className="list-none text-muted-foreground space-y-2 mt-4">
            <li>📧 Email pháp lý: <a href="mailto:legal@chungtoixayweb.vn" className="text-primary hover:underline">legal@chungtoixayweb.vn</a></li>
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

