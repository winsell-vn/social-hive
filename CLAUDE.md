# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Backend (NestJS) — `cd Backend`
```bash
npm run dev                    # Dev server with watch mode
npm run build                  # Compile TypeScript
npm run start:prod             # Production server (node dist/main.js)
npm run lint                   # ESLint with auto-fix
npm run format                 # Prettier formatting
npm test                       # Run Jest tests
npm test -- path/to/test.spec.ts  # Run single test
npm run prisma:generate        # Generate Prisma Client (run after schema changes)
npm run prisma:migrate         # Run database migrations
npm run prisma:studio          # Open Prisma Studio GUI
npm run prisma:seed            # Seed database
npm run redis:start            # Start Redis (Windows only)
```

### Frontend (Next.js 16) — `cd Frontend`
```bash
npm run dev                    # Dev server on port 3000
npm run build                  # Production build
npm run start:prod             # Production server (next start)
npm run type-check             # TypeScript check (no emit)
npm run lint                   # Next.js ESLint
npm test                       # Run Jest tests
npm test -- path/to/test.test.tsx  # Run single test
```

## Architecture Overview

Two-project structure (not a monorepo): `Backend/` (NestJS + Prisma + MySQL) and `Frontend/` (Next.js App Router + React).

**Data flow**: React component → Axios API client (`lib/api-client.ts`) → NestJS controller (JWT guard) → service layer → Prisma repository → MySQL. Background jobs via Bull queues + Redis. All API responses wrapped in `{ success, data, timestamp }` by TransformInterceptor.

**Auth flow**: JWT access token (15min) + refresh token (7d) stored in HttpOnly cookies. Optional 2FA via TOTP. Cloudflare Turnstile CAPTCHA on registration/login. Sessions backed by MySQL + Redis cache. Guards: `JwtAuthGuard`, `RolesGuard`. Decorators: `@Public()`, `@Roles()`, `@CurrentUser()`.

**Frontend state**: TanStack React Query v5 for server state, Zustand with persist for client state (auth, theme, wizard, chat, settings). Forms via React Hook Form + Zod.

**Frontend routing**: App Router with route groups — `(main)/` for authenticated pages, `(auth)/` for login/register, `(public)/` for pricing/blog, `admin/` for dashboard.

**Styling**: Tailwind CSS 3.4 + Radix UI primitives + `cn()` helper (clsx + tailwind-merge). Dark mode via class strategy. Animations with tailwindcss-animate + Framer Motion. Icons from Lucide React.

## Project-Specific Patterns

### Feature-based organization
Both Frontend and Backend use feature folders. Frontend features live in `src/features/` with barrel exports (`index.ts`). Backend modules in `src/modules/` follow NestJS module pattern (controller → service → repository).

### Path aliases
Both projects use `@/*` → `src/*`. Always use `@/` imports, never relative paths across features.

### Vietnamese slug generation
`Backend/src/common/utils/slug.util.ts` has a custom Vietnamese diacritics map (ă→a, đ→d, etc.) for SEO-friendly URLs. Always use this utility for any user-facing slugs.

### Post moderation workflow
New posts from low-karma users start as `PENDING`, require moderator approval to become `PUBLISHED`. High-karma users and admins bypass moderation.

### Newsfeed AI ratio cap
The newsfeed algorithm caps AI-generated content at 25% (`NEWSFEED_MAX_AI_RATIO=0.25`). Human posts get priority scoring: ADMIN=100, high-tier=80, regular=60. Feed cached in Redis with 5min TTL.

### Chatbot action tags
AI chatbot responses can embed UI control commands: `[ACTION:SELECT_SERVICE:slug]`. The frontend parser in `features/chatbot/utils/action-parser.ts` extracts these to drive the pricing wizard.

### Image upload security
`Backend/src/modules/upload/utils/validation.utils.ts` validates files by magic bytes (file signature), not just MIME type. Images processed through Sharp → WebP conversion with thumbnail/medium variants.

### UGC link processing
`Frontend/src/lib/seo/link-processor.ts` adds `rel="ugc nofollow noopener noreferrer"` to user-generated links for Google SEO compliance. Apply this to any new user content rendering.

### INP optimization
`Frontend/src/lib/utils/inp-optimization.ts` provides `yieldToMain()` to break long tasks. Uses Scheduler API with setTimeout fallback. Use this in heavy UI interactions.

### Redis
Redis must be running before the backend boots. The app checks connection on startup and exits with an error if Redis is unavailable.
- **Development (Windows)**: Use `npm run redis:start` or `start-redis.bat`
- **Production (VPS/Linux)**: Redis should be managed via systemd (`sudo systemctl start redis-server`)

### Environment setup
- Backend runs on port 4000, Frontend on port 3000
- Production: Use `npm run start:prod` in both Frontend and Backend (uses native servers for maximum performance)
- `Frontend/next.config.js` proxies `/uploads/*` requests to the backend
- Backend image remote patterns: `localhost:4000` (dev), `gateway.chungtoixayweb.vn` (prod)
- Groq API powers the AI chatbot and content seeding system
- Email via Resend API

### Database
MySQL with Prisma ORM. Schema at `Backend/prisma/schema.prisma`. Run `prisma:generate` after any schema change. Key models: User, Profile, Post, Comment, Like, Follow, FriendRequest, Notification, BlogPost, Service, PricingTier, QuoteRequest, Ad, AiAgent.

### Reputation system
Users earn karma through interactions. Tiers: NEWCOMER → LEGEND. Karma affects post moderation bypass and newsfeed priority scoring.

