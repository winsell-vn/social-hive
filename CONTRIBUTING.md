# 🤝 Đóng góp SocialHive

Cảm ơn bạn muốn đóng góp! Đây là một template **đã chạy production**, nên chúng tôi giữ tiêu chuẩn tương đối cao cho pull request.

## 🧭 Trước khi bắt đầu

1. **Đọc `README.md`** để hiểu kiến trúc tổng thể.
2. **Đọc `CLAUDE.md`** — đây là hướng dẫn conventions của dự án (cấu trúc module, alias `@/*`, slug tiếng Việt, quy trình moderation, tỉ lệ AI trong feed…).
3. **Tìm issue đang mở** hoặc mở issue mới để thảo luận trước khi code — đặc biệt với thay đổi lớn.
4. Với tính năng mới, hãy cập nhật `specs/` (requirements → design → tasks) **trước hoặc kèm theo** PR.

## 🛠️ Thiết lập môi trường

```bash
# Backend
cd Backend
npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev

# Frontend (terminal khác)
cd Frontend
npm install
cp .env.example .env.local
npm run dev
```

Cần **MySQL 8** và **Redis 7** đang chạy. Trên Windows: `cd Backend && npm run redis:start`.

## ✅ Trước khi mở Pull Request

Chạy đủ bộ kiểm tra:

```bash
# Backend
cd Backend
npm run build
npm test

# Frontend
cd Frontend
npm run type-check
npm run build
npm test
```

Mọi test phải **pass**. PR có test fail sẽ không được merge.

## 📐 Quy ước code

| Vấn đề | Quy ước |
|---|---|
| Import | Luôn dùng alias `@/*` → `src/*`, không dùng đường dẫn tương đối xuyên feature |
| Slug tiếng Việt | Dùng `Backend/src/common/utils/slug.util.ts` — đừng tự viết hàm bỏ dấu |
| Backend module | Theo mẫu NestJS: `controller → service → repository` |
| Frontend feature | Đặt trong `src/features/<name>/` và export qua `index.ts` |
| Tiếng Việt trong UI | Dùng text emoticon (`:)`, `=))`, `xD`) thay vì emoji Unicode |
| Link UGC | Áp dụng `rel="ugc nofollow noopener noreferrer"` cho mọi link do người dùng tạo |
| Ảnh nặng | Dùng `yieldToMain()` từ `@/lib/utils/inp-optimization` để không chặn main thread |
| Format | Prettier (Backend) — chạy `npm run format` trước khi commit |

## 🔒 Quy tắc bảo mật (không thể vi phạm)

- ❌ **Không** commit `.env`, `.env.local`, `.env.production` hay bất kỳ file secret nào.
- ❌ **Không** commit DB dump, ảnh người dùng, log runtime, hay dữ liệu production.
- ❌ **Không** hardcode password, API key, token hay URL nội bộ.
- ❌ **Không** thêm file `.env` cụ thể — chỉ dùng `.env.example` với placeholder.
- ✅ Nếu cần biến môi trường mới, thêm vào `Backend/.env.example` **và** `Backend/src/config/configuration.ts`.

## 🗄️ Thay đổi database

```bash
cd Backend
npx prisma migrate dev --name ten_thay_doi
```

- Phải kèm file migration trong `Backend/prisma/migrations/`.
- Migration phải **forward-only** và không phá dữ liệu đã có nếu có thể tránh.
- Cập nhật `Backend/prisma/schema.prisma` **và** `full-schema.sql` ở thư mục gốc nếu schema thay đổi.

## 🧪 Viết test

- Test đặt cạnh code: `*.spec.ts` (Backend), `*.test.ts(x)` (Frontend).
- Ưu tiên unit test với mock — không cần database hay Redis thật.
- Test mới phải cover cả **case hợp lệ lẫn không hợp lệ** (edge case, unauthorized, validation fail).

## 💬 Commit message

Theo Conventional Commits:

```
feat(ai-seeding): thêm bộ nhớ dài hạn cho agent
fix(chatbot): sửa parse action tag khi model trả về JSON lồng
docs(readme): cập nhật hướng dẫn deploy
refactor(upload): tách validation magic bytes ra utils
chore(deps): bump prisma lên 5.8.0
```

## 🧠 Thêm tính năng mới?

1. Mở issue mô tả **vấn đề** cần giải quyết (không cần giải pháp chi tiết).
2. Viết spec trong `specs/<feature>/` theo mẫu hiện có.
3. Implement theo conventions sẵn có.
4. Kèm test.
5. Mở PR kèm link issue.

## ❓ Cần trợ giúp?

- Mở issue trong repo này.
- Hoặc liên hệ trực tiếp: [winsell.vn](https://winsell.vn)

## 📜 License

Khi contribute, bạn đồng ý dưới [MIT License](LICENSE).
