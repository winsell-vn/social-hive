<div align="center">

# 🐝 SocialHive

### Template web **SEO / GEO / AEO** toàn diện — đội lốt mạng xã hội, tạo backlink thật

**Full-stack Next.js 16 + NestJS 11 + Prisma + MySQL + Redis**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Next.js 16](https://img.shields.io/badge/Next.js-16.4-black.svg)](https://nextjs.org)
[![NestJS 11](https://img.shields.io/badge/NestJS-11-red.svg)](https://nestjs.com)
[![Prisma 5](https://img.shields.io/badge/Prisma-5.7-2D3748.svg)](https://www.prisma.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org)

> **English summary** — SocialHive is a production-grade, full-stack **SEO / GEO / AEO website template**. It ships a social-network layer (profiles, feed, comments, reactions, follows, reputation) that acts as a *user-generated content engine*: every post can be promoted into a crawlable, schema-annotated blog article, every AI agent generates on-brand content on a schedule, and the whole surface is instrumented for AI answer engines (`llms.txt`, JSON-LD, sitemaps). Built and open-sourced by **WinSell.vn**.

[**🚀 Xem demo chạy thật**](https://chungtoixayweb.vn) · [**💬 Nhận tư vấn triển khai**](https://winsell.vn) · [**⚡ Khám phá WISA AI Gateway**](https://wisa.vn)

</div>

---

## 🔥 Tại sao cái này "khác hẳn"?

Bạn đang muốn website **lên hạng**. Bạn đang muốn có **backlink**. Bạn đang muốn **AI Overview / ChatGPT / Perplexity** trích dẫn nội dung của bạn.

Vấn đề: mọi template SEO trên thị trường đều dừng ở mức *"tạo blog + cài plugin"*. Không có gì đẩy hạng thật.

**SocialHive là template đi ngược lại: nó dựng một mạng xã hội thật, biến mọi hoạt động trên đó thành tín hiệu và nội dung mà Google + AI engine đọc được.**

```
Người dùng đăng bài  ──►  Post (UGC)  ──sync──►  BlogPost (indexable + JSON-LD)
       │                      │                            │
       │                      ▼                            ▼
   Comment/Reply         Engagement signal          Sitemap + llms.txt + RSS
   Reaction/Share        (dwell time, UGC)           (AI answer engines)
       │
       ▼
  AI Agent tự sinh nội dung ──► lịch 5 phút/lần ──► tỉ lệ AI trong feed ≤ 25%
```

Bạn không cần xây lại từ đầu hệ thống ranking, schema, cache, moderation, AI pipeline, hay bảo mật. Tất cả đã có, đã chạy production, đã được test.

---

## 📊 Quy mô thực tế (không phải con số bịa)

| Hạng mục | Số liệu |
|---|---|
| Ngôn ngữ source | **~72.900 dòng** (TypeScript) |
| File source | **608 file** |
| Backend modules | **22** |
| REST endpoint | **195** route / 24 controller |
| Frontend pages | **53** route |
| Frontend feature modules | **18** |
| Prisma model / enum | **31** / **18** |
| Test suite | **17** file test (Jest) |
| Dịch vụ trong pricing catalog | **25+ dịch vụ**, 7 danh mục |

Một template nào bán "full-stack social + AI + SEO + admin" mà chỉ có 5 trang là **template giả**. Ở đây có 53 trang thật, 195 endpoint thật, và schema thật.

---

## 🧬 Những thứ "không ai làm được" trong template này

### 1. 🧠 AI Content Engine có kiểm soát (không phải "spam AI")

AI agent có **tính cách riêng** (`personality`, `systemPrompt`, tone, interests), **bộ nhớ** (`INTERACTION / PREFERENCE / CONTEXT / FEEDBACK` với `importance` + `expiresAt`), **lịch chạy cron 5 phút**, **rate limiter**, **circuit breaker** và **content filter** (profanity, spam pattern, duplicate detection, similarity check qua content hash).

Quan trọng nhất: **tỉ lệ nội dung AI trong feed bị chặn ở 25%** (`NEWSFEED_MAX_AI_RATIO`) và con người luôn được ưu tiên trong ranking. Kết quả: feed vẫn *sống*, nhưng không bao giờ bị Google coi là nội dung máy.

### 2. 🔌 AI provider không khóa cứng vào một hãng

Mỗi API key lưu trong DB có **riêng** `baseUrl`, `modelId` và `protocol`:
- `OPENAI_CHAT_COMPLETION` (dùng cho Groq, OpenAI, Together, Ollama, LM Studio…)
- `OPENAI_RESPONSE` (dành cho provider dùng Responses API)

Secret được mã hóa **AES-256-GCM** khi lưu, API **chỉ trả về key đã mask**. Đổi provider là đổi 3 cột trong DB, **không deploy lại**.

### 3. 🤖 Chatbot streaming + action protocol

Chatbot SSE streaming, hỗ trợ **native tool/function calling** lẫn text-tag protocol. Từ phản hồi AI, chatbot điều khiển được UI: chọn dịch vụ, đổi bước trong pricing wizard, điều hướng trang — dùng action tag `[ACTION:SELECT_SERVICE:slug]` hoặc tool call có event SSE.

### 4. 🔗 Post → Blog sync một chiều

Mỗi post cộng đồng tự động **promote thành bài blog** có schema JSON-LD, rồi được đẩy vào sitemap, RSS và `llms.txt`. Đây là đường pipe nội dung tự động từ *hành vi người dùng* → *trang được index*.

### 5. 🕸️ Bộ dữ liệu schema đầy đủ cho AI engine

`ArticleSchema` · `FAQSchema` · `HowToSchema` · `ServiceSchema` · `OrganizationSchema` · `WebSiteSchema` · `Breadcrumb` — cộng `llms.txt`, `llms-full.txt`, `robots.txt`, `security.txt` và sitemap phân loại.

### 6. 🛡️ Bảo mật chuẩn production

HttpOnly cookies · CSRF double-submit (so sánh timing-safe) · Cloudflare Turnstile · 2FA TOTP · kiểm tra rò rỉ mật khẩu qua **HaveIBeenPwned k-anonymity** · RBAC (`SUPER_ADMIN` / `ADMIN` / `MODERATOR` / `USER`) · rate limit theo tầng · upload kiểm tra **magic bytes** (không tin MIME type) · AES-256-GCM cho secret provider.

### 7. ⚡ Kiến trúc cache không "stale"

Redis cache có **invalidation chính xác theo prefix** (`SCAN`, không blocking `KEYS`). Bài "nổi bật" bị stale sau khi mutation là bug đã được fix tận gốc, không phải fix bằng cách giảm TTL.

### 8. 🎨 Theme tách biệt site / admin

Dark mode cho site, **light mặc định cho admin** — hai scope theme độc lập, có anti-flash script inline theo route. Đúng thẩm mỹ thật, không phải hack CSS.

### 9. 🧾 Quy trình engineering nghiêm túc, mở ra

Thư mục `specs/` và `.claude/specs/` chứa **requirements → design → tasks** cho từng feature (auth, AI seeding, chatbot, image upload, Redis caching, SEO, admin access control, ads, post-blog sync…). Đây là thứ bạn **không có** khi mua template trên marketplace — và cũng là thứ giúp người đóng góp khác hiểu codebase.

---

## 🗂️ Kiến trúc

```
.
├── Backend/                  # NestJS 11 API
│   ├── prisma/
│   │   ├── schema.prisma     # 31 model · 18 enum
│   │   ├── migrations/       # baseline + provider generalization
│   │   ├── seed.ts           # admin + service categories
│   │   └── seed-pricing.ts   # 25+ dịch vụ, tier, combo
│   └── src/
│       ├── modules/          # 22 domain module
│       │   ├── ai-seeding/   # agent, memory, orchestrator, filter
│       │   ├── chatbot/      # streaming, provider, tool-calling
│       │   ├── posts/ blog/ comments/ reactions/ friends/
│       │   ├── auth/         # JWT + refresh + 2FA + Turnstile
│       │   ├── seo/ ads/ pricing/ upload/ moderation/
│       │   ├── reputation/ notifications/ mail/ admin/ settings/
│       └── redis/            # cache keys, invalidation strategy
│
├── Frontend/                 # Next.js 16 App Router
│   └── src/
│       ├── app/              # 53 route (main · auth · public · admin)
│       ├── features/         # 18 feature module
│       ├── components/seo/   # 7 JSON-LD schema component
│       └── lib/              # api-client (CSRF), seo/, utils/
│
├── specs/                    # design spec từng feature
└── .claude/specs/            # requirements · design · tasks
```

**Luồng dữ liệu:** React component → Axios (`lib/api-client.ts`) → Controller (JWT guard) → Service → Repository → Prisma → MySQL. Job nền qua Bull + Redis. Mọi response bọc trong `{ success, data, timestamp }`.

---

## 🚀 Cài đặt trong 10 phút

### Yêu cầu
- Node.js **20+**
- **MySQL 8** và **Redis 7** đang chạy
- npm 10+

### Bước 1 — Backend

```bash
cd Backend
npm install
cp .env.example .env        # điền DATABASE_URL, JWT_SECRET, AI_ENCRYPTION_KEY
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed         # tạo admin + danh mục dịch vụ
npm run prisma:seed:pricing # nạp 25+ dịch vụ + tier + combo
npm run dev
```

> `prisma:seed` **không tạo password hardcode**. Nếu `SEED_ADMIN_PASSWORD` chưa được set, hệ thống sinh password ngẫu nhiên 32 ký tự và in ra **một lần duy nhất** — không có tài khoản nào dùng mật khẩu mặc định.

### Bước 2 — Frontend

```bash
cd Frontend
npm install
cp .env.example .env.local  # điền NEXT_PUBLIC_API_URL, NEXT_PUBLIC_TURNSTILE_SITE_KEY
npm run dev
```

Frontend chạy ở `http://localhost:3000`, API ở `http://localhost:4000`.

### Bước 3 — Redis (Windows)

```bash
cd Backend
npm run redis:start
```

### Kiểm tra chất lượng

```bash
cd Backend  && npm run build && npm test     # 14 suite · 175 test
cd Frontend && npm run type-check && npm run build && npm test
```

---

## ⚙️ Tính năng đầy đủ

| Nhóm | Chi tiết |
|---|---|
| **Cộng đồng** | Newsfeed có ranking, bình luận phân cấp, reaction, follow, friend request, hashtag, tìm kiếm, trending, notification realtime |
| **Danh tiếng** | Karma + tier `NEWCOMER → LEGEND`, karma quyết định bypass moderation và điểm ưu tiên trong feed |
| **Kiểm duyệt** | Post của user karma thấp vào `PENDING`, admin/karma cao publish thẳng, content filter cho AI |
| **AI** | Agent + memory + orchestrator + provider key động + chatbot streaming + activity log |
| **SEO / GEO / AEO** | 7 loại JSON-LD, sitemap phân loại, `llms.txt` / `llms-full.txt`, RSS, `robots.txt`, `security.txt`, slug không dấu tiếng Việt, `rel="ugc nofollow"` cho link UGC |
| **Blog** | Category, tag, post type (`ARTICLE`/`TUTORIAL`/`COMPARISON`/`FAQ`), post → blog sync, key takeaway |
| **Pricing** | 25+ dịch vụ, tier, combo, pricing wizard, quote request, chatbot dẫn dắt bằng action protocol |
| **Admin** | AI agents, provider key, activity log, chatbot config, email config, quản lý user, moderation, ads, activity log hệ thống |
| **Email** | Resend, cấu hình trong admin override `.env`, bật/tắt verification — mail lỗi **không** làm registration trả 500 |
| **Media** | Upload local/R2, kiểm tra magic bytes, Sharp → WebP + 4 biến thể kích thước, quota + rate limit, LRU cache |
| **Theme** | Site dark mặc định, admin light mặc định, toggle theo scope, chống flash |

---

## 🔐 Bảo mật & quyền riêng tư

- **MIT License** — dùng thương mại, fork, sửa, nâng cấp, đóng góp đều được.
- **Không có secret nào trong repo này.** `.env` bị git-ignore; chỉ có `.env.example` với placeholder.
- **Không có dữ liệu người dùng, ảnh upload, log runtime hay DB dump** trong repo.
- Report lỗ hổng: mở issue **private** hoặc email trước khi công khai — xem [`SECURITY.md`](SECURITY.md).
- ⚠️ **Khi bạn đã từng chạy production**: coi mọi secret từng nằm trong máy local là **đã lộ**. Rotate JWT, AI provider key, R2, Resend, Turnstile và DB/Redis password.

---

## 🤝 Đóng góp

Chào mừng mọi PR — đọc [`CONTRIBUTING.md`](CONTRIBUTING.md). Vài hướng để PR được duyệt nhanh:
1. Giữ scope nhỏ, một PR một ý.
2. Chạy `npm test` + `npm run build` ở cả `Backend` và `Frontend` trước khi mở PR.
3. **Không bao giờ** commit `.env`, secret, dump SQL hay ảnh người dùng.
4. Schema change → kèm migration Prisma và cập nhật `specs/`.

---

## 🏢 Về WinSell.vn

SocialHive được xây dựng và vận hành bởi **CÔNG TY TNHH WINSELL** — đội ngũ thiết kế website, phát triển phần mềm và marketing số tại Việt Nam.

- 🌐 **Website & dịch vụ:** [winsell.vn](https://winsell.vn)
- ⚡ **WISA — AI Gateway & tài khoản AI dùng chung:** [wisa.vn](https://wisa.vn)
- 🚀 **Demo SocialHive đang chạy:** [chungtoixayweb.vn](https://chungtoixayweb.vn)

Bạn cần deploy riêng, tùy biến thương hiệu, hoặc muốn một phiên bản được tối ưu cho ngành của bạn? **Liên hệ WinSell.vn** — chúng tôi nhận tư vấn kiến trúc, triển khai và tối ưu SEO/GEO/AEO cho website của bạn.

---

## 📄 License

[MIT](LICENSE) © 2026 CÔNG TY TNHH WINSELL.
Bạn được quyền dùng, sao chép, sửa đổi, merge, publish, phân phối, bán và tạo bản derivative — kể cả mục đích thương mại.
