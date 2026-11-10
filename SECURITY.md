# 🔐 Security Policy

SocialHive là một sản phẩm **đã chạy production**. Chúng tôi coi trọng việc bảo vệ dữ liệu người dùng và không chấp nhận lỗ hổng.

## 📊 Phiên bản được hỗ trợ

| Phiên bản | Trạng thái |
|---|---|
| `main` (hiện tại) | ✅ Được hỗ trợ |
| Các phiên bản cũ hơn | ⚠️ Chỉ nhận bản vá bảo mật |

## 🚨 Báo cáo lỗ hổng

**Vui lòng KHÔNG mở public issue** cho lỗ hổng. Báo cáo qua một trong hai cách:

1. **GitHub Security Advisory** (khuyến nghị): vào tab **Security** của repo → **Report a vulnerability**.
2. **Email:** mở issue khoảng trống (không cần nội dung bí mật) để chúng tôi gửi lại địa chỉ email, hoặc liên hệ trực tiếp qua [winsell.vn](https://winsell.vn).

Khi gửi report, vui lòng kèm:

| Mục | Mô tả |
|---|---|
| **Mô tả** | Lỗ hổng là gì, tác động ra sao |
| **Bước tái hiện** | Quy trình từng bước để tái hiện |
| **Mức độ** | Critical / High / Medium / Low |
| **Môi trường** | Phiên bản Node, OS, commit hash |
| **Bằng chứng** | Screenshot, log, request/response (đã ẩn dữ liệu nhạy cảm) |

## ⏱️ Cam kết phản hồi

| Mức độ | Phản hồi đầu tiên | Bản vá dự kiến |
|---|---|---|
| Critical | 24 giờ | 7 ngày |
| High | 48 giờ | 14 ngày |
| Medium | 7 ngày | 30 ngày |
| Low | 14 ngày | Theo lịch release |

## ✅ Phạm vi được đánh giá

- Xác thực, phân quyền, leo thang đặc quyền
- CSRF, session hijacking, cookie theft
- SQL injection, XSS, SSRF, path traversal
- Upload bypass (magic-byte validation, extension spoofing)
- Rò rỉ secret (AI provider key, JWT, R2, Resend, Turnstile)
- Lỗi cache invalidation dẫn tới rò rỉ dữ liệu chéo người dùng
- Thiếu rate limit trên endpoint nhạy cảm

## 🚫 Ngoài phạm vi

- Báo cáo tự động bằng scanner không kèm tái hiện thủ công
- Tấn công DoS / volumetric
- Tìm subdomain đã được quản lý
- Báo cáo không có tác động thực tế
- Thiếu tiêu chuẩn cơ bản khi chưa cấu hình production (ví dụ: `.env` dùng giá trị mặc định)

## 🔑 Ghi chú quan trọng cho người tự triển khai

Bản mã nguồn này **không chứa bất kỳ secret nào**. Nếu bạn từng chạy production với bản local:

> **Hãy coi mọi secret từng tồn tại trên máy bạn là ĐÃ BỊ LỘ** và rotate ngay:
> `JWT_SECRET`, `JWT_REFRESH_SECRET`, `AI_ENCRYPTION_KEY`, các AI provider API key,
> `RESEND_API_KEY`, `TURNSTILE_SECRET_KEY`, R2 access key/secret, DATABASE_URL,
> `REDIS_PASSWORD`, và mật khẩu admin từ seed.

Bản `.env.example` chỉ chứa placeholder — không có giá trị nào dùng được.

## 🛡️ Công cụ bảo mật tích hợp

| Lớp | Cơ chế |
|---|---|
| Xác thực | JWT access token (15 phút) + refresh token (7 ngày) trong HttpOnly cookie |
| CSRF | Double-submit cookie, so sánh timing-safe, exempt endpoint có CAPTCHA |
| CAPTCHA | Cloudflare Turnstile trên đăng ký / đăng nhập |
| 2FA | TOTP qua otplib, khóa khi có hành động nhạy cảm |
| Mật khẩu | bcrypt cost 12 + kiểm tra rò rỉ qua HaveIBeenPwned k-anonymity |
| Secret AI provider | AES-256-GCM, API chỉ trả masked key |
| Upload | Kiểm tra magic bytes + giới hạn kích thước + quota + rate limit |
| Rate limit | @nestjs/throttler theo tầng endpoint |
| Header | CSP, HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy |
