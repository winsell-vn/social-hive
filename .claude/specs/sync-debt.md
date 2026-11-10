---
2026-03-02 10:30 api-change
Chatbot: Migrated from text-based [ACTION:...] tags to Groq native tool/function calling (show_service, navigate_step). SSE stream now emits action events. Added API key debug logging. Simplified system prompt by ~60 lines.
Files: Backend/src/modules/chatbot/services/chatbot-groq.service.ts, Backend/src/modules/chatbot/prompts/hung-dps-persona.ts, Frontend/src/features/chatbot/api/chat.ts, Frontend/src/features/chatbot/hooks/useChat.ts
---

---
2026-03-02 10:15 workflow-change
Chatbot action tags: Added exact slug reference table to AI prompt, added fuzzy slug matching fallback in action executor for SHOW_SERVICE/SELECT_SERVICE/SELECT_TIER
Files: Backend/src/modules/chatbot/prompts/hung-dps-persona.ts, Frontend/src/features/pricing/constants/categories.ts, Frontend/src/features/chatbot/utils/action-executor.ts
---


---
[2026-02-28 12:10] config-change
Auth pages cache fix: Added Cache-Control s-maxage=0 headers for /login, /register, /forgot-password, /reset-password to prevent Cloudflare stale cache. Added export dynamic='force-dynamic' to auth pages. Added CSRF initCsrfToken() in providers.tsx as safety net. Created deploy.sh and purge-cache.sh for Cloudflare cache purge automation. Added deploy npm scripts.
Files: Frontend/next.config.js, Frontend/src/app/(auth)/login/page.tsx, Frontend/src/app/(auth)/register/page.tsx, Frontend/src/app/(auth)/forgot-password/page.tsx, Frontend/src/app/(auth)/reset-password/page.tsx, Frontend/src/app/providers.tsx, Frontend/deploy.sh, Frontend/purge-cache.sh, Frontend/package.json
---
---
[2026-02-27 14:30] workflow-change
AI Seeding resource optimization: scheduler checks circuit breaker before queuing, exponential backoff for circuit breaker (60s→1h cap), removeOnFail reduced 500→50, activity log cleanup daily instead of weekly, error messages truncated to 500 chars
Files: Backend/src/modules/ai-seeding/services/ai-orchestrator.service.ts, Backend/src/modules/ai-seeding/services/groq-client.service.ts, Backend/src/modules/ai-seeding/ai-seeding.module.ts, Backend/src/modules/ai-seeding/services/ai-activity-log.service.ts
---

---
[2026-02-27 21:15] small-feature
Code review fixes: (1) Deleted dead code files AuthParticlesBackground.tsx and AuthFloatingShapes.tsx, (2) Uninstalled unused @tsparticles/react and @tsparticles/slim packages, (3) Extracted duplicated floating label input pattern into shared FloatingLabelInput.tsx component, refactored LoginForm, RegisterForm, ForgotPasswordForm to use it.
Files: Frontend/src/features/auth/components/FloatingLabelInput.tsx, Frontend/src/features/auth/components/LoginForm.tsx, Frontend/src/features/auth/components/RegisterForm.tsx, Frontend/src/features/auth/components/ForgotPasswordForm.tsx, Frontend/package.json, Frontend/package-lock.json
---

---
[2026-02-27 20:30] small-feature
Replaced Three.js 3D auth background with pure Canvas 2D implementation to fix ReactCurrentOwner error. Removed @react-three/fiber, @react-three/drei, three packages. Cleaned up npm overrides and webpack aliases.
Files: Frontend/package.json, Frontend/next.config.js, Frontend/src/features/auth/components/AuthScene3D.tsx
---
---
[2026-02-27 17:00] bug-fix
Code review fixes: (1) Added missing LoginAttemptService + PasswordBreachService mock providers in auth.service.spec.ts, (2) Added invalidatePasswordResets to UserRepository mock, (3) Added breaking change comment to session.service.ts for SHA-256 token hashing, (4) Extracted duplicate security headers into shared middleware, (5) Fixed auth layout pre-hydration flash
Files: Backend/src/modules/auth/services/auth.service.spec.ts, Backend/src/modules/auth/services/session.service.ts, Backend/src/common/middleware/security-headers.middleware.ts, Backend/src/main.ts, Backend/app.js, Frontend/src/app/(auth)/layout.tsx
---

---
[2026-02-27 16:00] workflow-change
Auth security: (1) CSRF Double Submit Cookie protection - middleware validates X-CSRF-Token header against csrf-token cookie on state-changing requests, exempt paths for CAPTCHA-protected endpoints, timing-safe comparison; (2) Password breach check via HaveIBeenPwned k-Anonymity API - SHA-1 prefix/suffix split, threshold=3, fail-open, 5s timeout, integrated in register/resetPassword/changePassword
Files: Backend/src/common/middleware/csrf.middleware.ts, Backend/src/modules/auth/services/password-breach.service.ts, Backend/src/app.module.ts, Backend/src/modules/auth/auth.module.ts, Backend/src/modules/auth/controllers/auth.controller.ts, Backend/src/modules/auth/services/auth.service.ts, Frontend/src/lib/api-client.ts
---


---
[2026-02-27 15:00] workflow-change
Auth security hardening: (1) Rate limiting added to register/login/forgot-password/reset-password replacing @SkipThrottle, (2) Account lockout via Redis after 5 failed attempts with 15min TTL, (3) Email enumeration prevention on register (fake success) and login (generic error for inactive), (4) Tokens stripped from JSON response body (HttpOnly cookies only), (5) Frontend password validation synced with backend regex, (6) Old password reset tokens invalidated on new request, (7) Refresh tokens hashed (SHA-256) before DB storage, (8) Auth layout redirects authenticated users, (9) Security headers middleware added to backend
Files: Backend/src/modules/auth/controllers/auth.controller.ts, Backend/src/modules/auth/services/auth.service.ts, Backend/src/modules/auth/services/session.service.ts, Backend/src/modules/auth/services/login-attempt.service.ts, Backend/src/modules/auth/auth.module.ts, Backend/src/modules/auth/repositories/user.repository.ts, Backend/src/main.ts, Backend/app.js, Frontend/src/features/auth/components/RegisterForm.tsx, Frontend/src/features/auth/components/ResetPasswordForm.tsx, Frontend/src/features/auth/stores/auth-store.ts, Frontend/src/features/auth/api/auth.ts, Frontend/src/lib/api-client.ts, Frontend/src/app/(auth)/layout.tsx
---


---
2026-02-27 09:00 bug-fix
Fixed sitemap image Vietnamese encoding (charset=utf-8), relative image URLs → absolute URLs via toAbsoluteUrl(), and ensured domain consistency across all sitemaps
Files: Backend/src/modules/seo/controllers/sitemap.controller.ts, Backend/src/modules/seo/services/sitemap.service.ts
---

---

---
[2026-02-22 00:00] small-feature
Wired useAdImpressionTracker into PromotedPostCard + SidebarAdCard, added clickCount increment to recordClick, exported hook from barrel
Files: Frontend/src/features/ads/index.ts, Frontend/src/features/ads/components/PromotedPostCard.tsx, Frontend/src/features/ads/components/SidebarAdCard.tsx, Backend/src/modules/ads/services/ads.service.ts, Frontend/src/features/ads/api/ads.ts
---
2026-02-21 14:30 config-change
Added Next.js rewrites to proxy /uploads/* to backend server; fixed Tiptap toolbar dark mode visibility
Files: Frontend/next.config.js, Frontend/src/components/editor/EditorToolbar.tsx, Frontend/src/components/editor/RichTextEditor.tsx, Frontend/src/components/editor/EditorMenuBar.tsx
---


---
[2026-02-15 12:00] workflow-change
Fix 9 remaining UI/UX issues on /bang-gia: ARIA violation (TierCard role=option), dynamic mobile padding, force-light-mode slate overrides, hide nav/summary after submit (isQuoteSubmitted in wizard store), remove drag on QuoteSummary, refactor progress line positioning, remove duplicate back button, fix accent CSS variable
Files: Step3Tier.tsx, WizardContainer.tsx, globals.css, wizard-store.ts, Step4Quote.tsx, QuoteSummary.tsx, WizardProgress.tsx
---
# Spec Sync Debt

---
[2026-02-11 00:00] api-change
Admin pricing quotes: Added pagination (page/limit), status filter validation (BadRequestException), CSV export with service/tier names instead of UUIDs, detail dialog tier name resolution
Files: Backend/src/modules/pricing/controllers/quote.controller.ts, Backend/src/modules/pricing/services/pricing.service.ts, Frontend/src/app/admin/pricing/quotes/page.tsx, Frontend/src/features/pricing/api/pricing-admin.ts
---

---
[2026-02-11 01:00] workflow-change
Pricing seed data: Rewrote ALL 25 services with realistic comparable features using !prefix pattern for excluded features. 3-4 tiers per service, realistic Vietnamese market pricing, proper feature comparison support.
Files: Backend/prisma/seed-pricing.ts
---



---
[2026-02-12 00:00] workflow-change
Removed entire CloudFlare R2 storage system - deleted r2.config.ts, test-r2.js, r2-cdn-optimization spec; stubbed upload service/controller; removed R2 image cleanup from posts and blog services; removed R2 env vars and @aws-sdk/client-s3 dependency
Files: Backend/src/config/r2.config.ts, Backend/test-r2.js, Backend/.env.example, Backend/src/config/configuration.ts, Backend/src/modules/upload/services/upload.service.ts, Backend/src/modules/upload/controllers/upload.controller.ts, Backend/src/modules/posts/services/posts.service.ts, Backend/src/modules/posts/posts.module.ts, Backend/src/modules/blog/services/blog.service.ts, Backend/src/modules/blog/blog.module.ts, Backend/src/modules/profiles/services/profiles.service.ts
---

---
[2026-02-12 01:00] workflow-change
Removed remaining CloudFlare R2 remnants: R2 CDN remotePatterns + minimumCacheTTL from next.config.js; UploadService/UploadModule + R2 image cleanup from ads service/module; deleted stale Backend/coverage/ directory
Files: Frontend/next.config.js, Backend/src/modules/ads/services/ads.service.ts, Backend/src/modules/ads/ads.module.ts, Backend/coverage/
---
---
[2026-02-12 00:00] workflow-change
Profile page redesigned: GitHub-inspired flex layout with 280px fixed sidebar, responsive post grid (1/2/3 cols), new PostCardCompact component, parent layout max-w-2xl->max-w-5xl
Files: Frontend/src/app/(main)/layout.tsx, Frontend/src/app/(main)/profile/[username]/ProfilePageClient.tsx, Frontend/src/features/profiles/components/ProfileSidebar.tsx, Frontend/src/features/posts/components/PostCardCompact.tsx
---

---
[2026-02-12 02:00] bug-fix
Code review fixes: Added focus trap to ProfileEditModal (accessibility regression from Radix Dialog removal), narrowed layout max-w-6xl to max-w-5xl, removed dead code (unused reaction handlers/hooks in ProfilePageClient), removed dead methods in UploadService (extractKeyFromUrl, deleteImageWithRetry, deleteImage)
Files: Frontend/src/features/profiles/components/ProfileEditModal.tsx, Frontend/src/app/(main)/layout.tsx, Frontend/src/app/(main)/profile/[username]/ProfilePageClient.tsx, Backend/src/modules/upload/services/upload.service.ts
---


---
[2026-02-13 00:00] workflow-change
Updated audit_for_seo.md with 11 new sections (PHẦN 12-22) addressing all 10 critical SEO gaps: E-E-A-T, AEO/AI Overviews, Local SEO, content diversity, topical authority, backlink detail, content velocity, programmatic SEO, content repurposing, keyword expansion. File grew from 525 to 2139 lines.
Files: audit_for_seo.md
---


---
[2026-02-13 00:00] workflow-change
Replaced hardcoded SERVICE_CATEGORIES in public pricing wizard with dynamic API data from GET /api/pricing/public/categories. Step1Category and Step2Service now use database categories. Services filtered by categoryId instead of hardcoded serviceSlugs.
Files: Frontend/src/features/pricing/api/pricing.ts, Frontend/src/features/pricing/components/wizard/Step1Category.tsx, Frontend/src/features/pricing/components/wizard/Step2Service.tsx, Frontend/src/features/pricing/components/wizard/WizardContainer.tsx, Frontend/src/features/pricing/components/wizard/CategoryCard.tsx, Frontend/src/types/pricing.ts, Frontend/src/features/pricing/index.ts
---


---
[2026-02-13 00:00] small-feature
Added Sheet (slide-in drawer) to admin pricing services page for quick tier CRUD. Clicking a service row opens a right-side panel with that service's tiers table and full create/edit/delete functionality without leaving the services page.
Files: Frontend/src/app/admin/pricing/page.tsx, Frontend/src/app/admin/pricing/components/ServiceTiersPanel.tsx
---

---
[2026-02-15 00:00] workflow-change
Fixed all 16 UI/UX issues on pricing page (/bang-gia): ChatBubble z-index overlap, bottom padding, QuoteSummary positioning, force-light-mode wrapper, duplicate FAQ removal, form id fix, duplicate sidebar conditional, ARIA roles/semantics, touch targets, badge clipping, swipe gesture, mobile button text, XSS sanitization
Files: Frontend/src/features/chatbot/components/ChatBubble.tsx, Frontend/src/features/pricing/components/wizard/WizardContainer.tsx, Frontend/src/features/pricing/components/wizard/QuoteSummary.tsx, Frontend/src/app/(public)/bang-gia/page.tsx, Frontend/src/features/pricing/components/wizard/Step3Tier.tsx, Frontend/src/features/pricing/components/wizard/Step4Quote.tsx, Frontend/src/features/pricing/components/wizard/WizardProgress.tsx, Frontend/src/features/pricing/components/wizard/WizardNavigation.tsx, Frontend/src/features/pricing/components/PricingFAQ.tsx
---

---
[2026-02-16 01:30] small-feature
Increased chatbot rate limits (5→10/min, 50→100/hour), added AI highlight system (orange border + Sparkles badge on recommended cards), auto-minimize chat on mobile after AI navigation, auto-dismiss highlights after 10s, new aiHighlightedIds state in wizard store
Files: Backend/src/modules/chatbot/services/chatbot-rate-limiter.service.ts, Frontend/src/features/pricing/stores/wizard-store.ts, Frontend/src/app/globals.css, Frontend/tailwind.config.ts, Frontend/src/features/pricing/components/wizard/CategoryCard.tsx, Frontend/src/features/pricing/components/wizard/ServiceCard.tsx, Frontend/src/features/pricing/components/wizard/Step3Tier.tsx, Frontend/src/features/chatbot/utils/action-executor.ts, Frontend/src/features/pricing/components/wizard/WizardContainer.tsx
---

---
[2026-02-16 02:00] api-change + config-change
Fixed missing categoryId in Service DTOs/API, added Redis caching for public categories, fixed rate limiter race condition with atomic INCR, updated cache invalidation to include categories
Files: Backend/src/modules/pricing/dto/create-service.dto.ts, Backend/src/modules/pricing/dto/update-service.dto.ts, Backend/src/modules/pricing/services/pricing.service.ts, Backend/src/redis/cache-keys.ts, Backend/src/modules/chatbot/services/chatbot-rate-limiter.service.ts, Backend/prisma/seed-pricing.ts, Frontend/src/types/pricing.ts
---

---
2026-02-19 bug-fix
Auth forms: changed validation mode to onBlur for real-time feedback; added Turnstile CAPTCHA bypass when NEXT_PUBLIC_TURNSTILE_SITE_KEY is empty
Files: Frontend/src/features/auth/components/RegisterForm.tsx, Frontend/src/features/auth/components/LoginForm.tsx, Frontend/src/features/auth/components/ForgotPasswordForm.tsx
---

---
2026-02-20 config-change
Migrated email system from Gmail SMTP (nodemailer) to Resend.com SDK; replaced SMTP_* env vars with RESEND_API_KEY; added resend package
Files: Backend/src/modules/mail/mail.service.ts, Backend/src/config/configuration.ts, Backend/.env, Backend/.env.example
---

---
[2026-02-20 15:45] small-feature
Comprehensive UI/UX upgrade for post creation form - Enter key submit, fixed image paste flow, draft auto-save, keyboard shortcuts panel, enhanced styling and animations
Files: Frontend/src/components/editor/RichTextEditor.tsx, Frontend/src/app/(main)/compose/page.tsx
---

---
[2026-02-20 16:00] small-feature
Synchronized homepage post composer with /compose page improvements - upgraded from Textarea to RichTextEditor, added Enter key submit, image paste flow, character count warnings, draft auto-save, keyboard shortcuts panel, enhanced styling and animations
Files: Frontend/src/features/posts/components/PostComposer.tsx
---

---
[2026-02-20 16:15] bug-fix
Fixed getInitials crash on null/undefined inputs (admin moderation error), added responsive design to post composers (mobile-friendly layouts, 44px touch targets, responsive grids)
Files: Frontend/src/lib/utils.ts, Frontend/src/features/posts/components/PostComposer.tsx, Frontend/src/app/(main)/compose/page.tsx
---

---
[2026-02-20 16:30] workflow-change
Auto-approval and auto-migration to blog for Admin/Super_Admin posts - posts created with PUBLISHED status immediately, auto-synced to blog as PUBLISHED, appear in both homepage and /blog
Files: Backend/src/modules/posts/services/posts.service.ts, Backend/src/modules/posts/controllers/posts.controller.ts
---

---
[2026-02-20 16:45] bug-fix
Fixed blog display issues - stripped HTML from excerpts, flattened author data structure (author.profile.username → author.username) to prevent charAt error, fixed TypeScript type annotations
Files: Frontend/src/app/(public)/blog/page.tsx, Backend/src/modules/blog/services/blog.service.ts, Backend/src/modules/posts/services/posts.service.ts
---

---
[2026-02-20 17:00] config-change
Migrated from CloudFlare R2 CDN to local storage - created image URL helpers (getAvatarUrl, getCoverUrl), updated 15 components to use helpers, created database migration to convert CDN URLs to local paths
Files: Frontend/src/lib/image-url.ts, Frontend/src/features/profiles/components/ProfileHeader.tsx, Frontend/src/features/profiles/components/ProfileSidebar.tsx, Frontend/src/features/friends/components/FriendCard.tsx, Frontend/src/features/friends/components/ProfileFriendsList.tsx, Frontend/src/components/layout/Sidebar.tsx, Frontend/src/components/layout/RightSidebar.tsx, Frontend/src/features/posts/components/PostCard.tsx, Frontend/src/features/blog/components/AuthorCard.tsx, Frontend/src/features/notifications/components/NotificationItem.tsx, Frontend/src/features/search/components/SearchResults.tsx, Frontend/src/features/search/components/SearchBar.tsx, Frontend/src/features/admin/components/UserTable.tsx, Frontend/src/features/admin/components/PostReviewCard.tsx, Frontend/src/features/admin/pages/AiAgentsPage.tsx, Backend/prisma/migrations/20260220000000_migrate_cdn_urls_to_local/migration.sql
---

---
[2026-02-20 17:15] bug-fix
Fixed SQL migration data corruption risk by adding LOCATE > 0 guards, added production environment validation for NEXT_PUBLIC_API_URL, improved image URL fallback logging
Files: Backend/prisma/migrations/20260220000000_migrate_cdn_urls_to_local/migration.sql, Frontend/src/lib/image-url.ts
---

---
[2026-02-20 17:30] code-quality
Improved error handling (fail-fast in production), added audit logging for admin moderation bypass, extracted helper methods to reduce code duplication (determinePostStatus, transformAuthorData, isValidName)
Files: Frontend/src/lib/image-url.ts, Frontend/src/lib/utils.ts, Backend/src/modules/posts/services/posts.service.ts, Backend/src/modules/blog/services/blog.service.ts
---

---
[2026-02-28 00:00] config-change
Removed shared hosting artifacts (Frontend/app.js, Backend/app.js), switched to native production servers (next start, node dist/main.js), removed Windows-specific Redis path from config, made start-redis.ts cross-platform, updated CLAUDE.md for VPS production
Files: Frontend/app.js (deleted), Backend/app.js (deleted), Frontend/package.json, Backend/package.json, Backend/eslint.config.mjs, Backend/src/common/middleware/security-headers.middleware.ts, Backend/src/main.ts, Backend/src/config/configuration.ts, Backend/scripts/start-redis.ts, CLAUDE.md
---

---
[2026-02-20 18:00] workflow-change
Complete CDN-to-local migration: removed cdn.chungtoixayweb.vn from next.config.js remotePatterns, fixed ALL components to use transformImageUrl() for dynamic image URLs (topics page, blog detail page, compose page, RelatedContent, RelatedPosts, PostCard, PostCardCompact), created Backend migration script to download CDN images and update DB
Files: Frontend/next.config.js, Frontend/src/app/(public)/topics/[topic]/page.tsx, Frontend/src/features/posts/components/PostCard.tsx, Frontend/src/features/posts/components/PostCardCompact.tsx, Frontend/src/app/(main)/compose/page.tsx, Frontend/src/app/(public)/blog/[category]/[slug]/page.tsx, Frontend/src/components/blog/RelatedContent.tsx, Frontend/src/features/posts/components/RelatedPosts.tsx, Backend/src/scripts/migrate-cdn-to-local.ts
---

---
[2026-02-20 23:50] api-change
Fixed PATCH /profiles/me 500 error: added missing location and website fields to Profile schema, fixed coverImage→coverPhoto DTO mismatch
Files: Backend/prisma/schema.prisma, Backend/src/modules/profiles/dto/profile.dto.ts, Frontend/src/types/profile.ts
---

---
[2026-02-20 19:00] config-change
Added HTTPS redirect and Content Security Policy headers to next.config.js
Files: Frontend/next.config.js
---

---
[2026-02-20 19:01] api-change
Added Image Sitemap generation with Redis caching and new /sitemap/images.xml endpoint
Files: Backend/src/modules/seo/services/sitemap.service.ts, Backend/src/modules/seo/controllers/sitemap.controller.ts, Backend/src/modules/seo/seo.module.ts, Backend/src/redis/cache-keys.ts
---

---
[2026-02-20 19:02] small-feature
Added topic cluster pages (/topics/[topic]) with blog+UGC content and restructured footer with topic links
Files: Frontend/src/app/(public)/topics/[topic]/page.tsx, Frontend/src/components/layout/Footer.tsx
---

---
[2026-02-20 19:03] small-feature
Enhanced 404 page with WebPage structured data, popular pages links, and search CTA
Files: Frontend/src/app/not-found.tsx
---

---
[2026-02-20 19:04] small-feature
Created RelatedContent cross-linking widget between blog and UGC posts
Files: Frontend/src/components/blog/RelatedContent.tsx, Frontend/src/app/(public)/blog/[category]/[slug]/page.tsx, Frontend/src/app/(main)/profile/[username]/[postId]/page.tsx
---

---
[2026-02-20 19:05] small-feature
Added ServiceSchema and VideoSchema structured data components, integrated ServiceSchema into pricing page
Files: Frontend/src/components/seo/ServiceSchema.tsx, Frontend/src/components/seo/VideoSchema.tsx, Frontend/src/components/seo/index.ts, Frontend/src/app/(public)/pricing/page.tsx
---

---
[2026-02-20 19:06] api-change
Created RSS feed at /feed.xml with 25 latest blog posts, added autodiscovery link tag and footer link
Files: Frontend/src/app/feed.xml/route.ts, Frontend/src/app/layout.tsx, Frontend/src/components/layout/Footer.tsx
---

---
[2026-02-20 19:07] small-feature
Added View All option, rel next/prev, canonical URLs, and noindex for page 2+ on blog and topics pages
Files: Frontend/src/app/(public)/blog/page.tsx, Frontend/src/app/(public)/topics/[topic]/page.tsx
---

---
[2026-02-20 20:00] config-change
Fix CRITICAL: Added 'blog','images' to sitemap proxy ALLOWED_TYPES + Cloudflare Turnstile domains to CSP headers
Files: Frontend/src/app/sitemap/[type]/route.ts, Frontend/next.config.js
---

---
[2026-02-20 20:05] small-feature
Fix HIGH: Landing page Footer - added missing topic cluster links (Zalo Mini App, E-commerce), enhanced LandingPage inline footer with nav links
Files: Frontend/src/features/landing/components/Footer.tsx, Frontend/src/features/landing/components/LandingPage.tsx
---

---
[2026-02-20 20:10] config-change
Fix HIGH: Added 6 topic cluster pages to static sitemap (web-design, mobile-app, zalo-mini-app, seo, ui-ux, e-commerce)
Files: Backend/src/modules/seo/services/sitemap.service.ts
---

---
[2026-02-20 20:15] bug-fix
Fix MEDIUM: Added telephone to OrganizationSchema contactPoint, replaced placeholder phone numbers with real number +84-817-771-184
Files: Frontend/src/components/seo/OrganizationSchema.tsx, Frontend/src/app/(public)/about/page.tsx, Frontend/src/app/(public)/contact/page.tsx
---

---
[2026-02-20 20:20] small-feature
Add Google Analytics GA4 integration with gtag.js component, CSP updates for GA domains
Files: Frontend/src/components/analytics/GoogleAnalytics.tsx, Frontend/src/components/analytics/index.ts, Frontend/src/app/layout.tsx, Frontend/next.config.js, Frontend/.env.example
---

---
[2026-02-20 20:25] config-change
Add Google Search Console verification meta tag + robots.txt Crawl-delay for Bingbot/Yandex/Baiduspider
Files: Frontend/src/app/layout.tsx, Frontend/public/robots.txt, Frontend/.env.example
---

---
[2026-02-20 21:30] config-change
Fix code review issues: GA4 consent default changed to 'denied' with __grantAnalyticsConsent() API for future cookie banner; WebVitals switched from non-existent /api/analytics/vitals to gtag events; CSP removed 'unsafe-eval'; RSS feed URL fixed to include category slug; Footer phone number corrected
Files: Frontend/src/components/analytics/GoogleAnalytics.tsx, Frontend/src/components/analytics/WebVitals.tsx, Frontend/next.config.js, Frontend/src/app/feed.xml/route.ts, Frontend/src/features/landing/components/Footer.tsx, Frontend/src/types/global.d.ts
---

---
[2026-02-20 22:00] config-change
Code review round 2 fixes: Dynamic HTTPS redirect via NEXT_PUBLIC_DOMAIN env var (W-1), GA4 NavigationTracker for client-side route tracking (W-2), CDATA ]]> escape in RSS feed (W-3), null guard for author profile in image sitemap (W-4), reduced sitemap query limits 50000→5000 (W-5), removed dead VideoSchema (S-1), removed redundant X-Frame-Options header (S-2)
Files: Frontend/next.config.js, Frontend/src/components/analytics/GoogleAnalytics.tsx, Frontend/src/app/feed.xml/route.ts, Backend/src/modules/seo/services/sitemap.service.ts, Frontend/src/components/seo/index.ts, Frontend/src/components/seo/VideoSchema.tsx (deleted)
---
---
[2026-02-21 00:00] bug-fix
Fix search: Enter key now triggers search, case-insensitive search
Files: Frontend/src/features/search/components/SearchBar.tsx, Backend/src/modules/search/repositories/search.repository.ts, Backend/src/modules/search/services/search.service.spec.ts
---

---
[2026-02-21 15:00] api-change
SECURITY FIX: Removed email from public search API - email no longer searchable or returned in search results; CSP upgrade-insecure-requests now conditional on production; profile cache invalidation narrowed from profileKeys.all to profileKeys.me()
Files: Backend/src/modules/search/repositories/search.repository.ts, Frontend/src/features/search/types/search.ts, Frontend/next.config.js, Frontend/src/features/profiles/api/profiles.ts
---


---
[2026-02-21 20:45] config-change
Auth cookie config: Cookie maxAge now derived from JWT config via ConfigService instead of hardcoded; process.env.NODE_ENV replaced with ConfigService; sameSite made configurable via COOKIE_SAME_SITE env var; added interceptor tests for cookie-based auth flow
Files: Backend/src/modules/auth/controllers/auth.controller.ts, Backend/src/config/configuration.ts, Backend/.env.example, Frontend/src/lib/api-client.test.ts
---

---
[2026-02-21 23:55] bug-fix
Fix ads not rendering on NewsFeed: interleaveAdsWithPosts only inserted ads after every 4th post, so with <4 posts no ad appeared. Changed to insert first ad after 2nd post, append at end if <2 posts, show ads even with 0 posts.
Files: Frontend/src/app/(main)/NewsfeedClient.tsx
---

---
[2026-02-22 00:05] bug-fix
Fix PromotedPostCard rendering raw HTML tags in description: switched to dangerouslySetInnerHTML with sanitization + prose classes; SidebarAdCard now strips HTML tags for compact view
Files: Frontend/src/features/ads/components/PromotedPostCard.tsx, Frontend/src/features/ads/components/SidebarAdCard.tsx
---

---
[2026-02-22 00:10] bug-fix
Fix image issues: (1) Raised decompression bomb threshold from 100 to 1000 in image-processor to allow clipboard-pasted screenshots; (2) Changed transformImageUrl to return relative /uploads/ paths instead of absolute localhost URLs, fixing Next.js private IP blocking
Files: Backend/src/modules/upload/services/image-processor.service.ts, Frontend/src/lib/image-url.ts
---

---
[2026-02-22 00:20] bug-fix
Wired up sidebar ads in RightSidebar: added usePublicAds('SIDEBAR') hook call and SidebarAdCard rendering with "Được tài trợ" header at top of right sidebar, before contacts and popular posts
Files: Frontend/src/components/layout/RightSidebar.tsx
---

---
[2026-02-22 10:30] api-change
Added POST /api/ads/:id/impression endpoint for ad impression tracking with Redis deduplication; replaced custom regex XSS sanitizer with isomorphic-dompurify in PromotedPostCard; added clickCount/impressionCount to Prisma Ad model; removed dead code in interleaveAdsWithPosts
Files: Frontend/src/features/ads/api/ads.ts, Frontend/src/features/ads/components/PromotedPostCard.tsx, Frontend/src/app/(main)/NewsfeedClient.tsx, Backend/src/modules/ads/controllers/ads.controller.ts, Backend/src/modules/ads/services/ads.service.ts, Backend/prisma/schema.prisma
---

---
[2026-02-23 00:00] bug-fix
Fix 3 production errors: (1) CSP added static.cloudflareinsights.com to script-src and cloudflareinsights.com to connect-src; (2) New HashPathFallbackMiddleware for legacy flat avatar paths → hash-based path redirect; (3) Posts API getNewsfeed() wrapped Redis cache in try-catch with direct DB fallback
Files: Frontend/next.config.js, Backend/src/common/middleware/hash-path-fallback.middleware.ts, Backend/src/app.module.ts, Backend/src/modules/posts/services/posts.service.ts
---

---
[2026-02-23 01:00] small-feature
Implemented Post Update & Delete: EditPostModal with RichTextEditor, DeletePostDialog with confirmation, wired into NewsfeedClient and ProfilePageClient, added 3-dot menu to PostCardCompact, removed draft-only edit restriction in backend, enhanced cache invalidation
Files: Backend/src/modules/posts/services/posts.service.ts, Frontend/src/features/posts/components/EditPostModal.tsx, Frontend/src/features/posts/components/DeletePostDialog.tsx, Frontend/src/features/posts/api/posts.ts, Frontend/src/features/posts/index.ts, Frontend/src/app/(main)/NewsfeedClient.tsx, Frontend/src/features/posts/components/PostCardCompact.tsx, Frontend/src/app/(main)/profile/[username]/ProfilePageClient.tsx
---

---
[2026-02-26 00:00] small-feature
Added "Xem thêm" (Read More) truncation for long posts in feed with redirect to post detail page
Files: Frontend/src/features/posts/components/PostCard.tsx, Frontend/src/app/(main)/NewsfeedClient.tsx, Frontend/src/app/(main)/hashtag/[name]/HashtagClient.tsx, Frontend/src/features/trending/components/TrendingPostsList.tsx, Frontend/src/features/search/components/SearchResults.tsx
---

---
[2026-02-26 00:30] api-change
Notification click navigation + actorUsername in notification data: dropdown layout jank fix (sideOffset/collisionPadding), click-to-navigate for all notification types, backend notification methods now include actorUsername parameter
Files: Frontend/src/features/notifications/components/NotificationItem.tsx, Frontend/src/features/notifications/types/notification.ts, Backend/src/modules/notifications/services/notifications.service.ts, Backend/src/modules/notifications/types/notification.types.ts
---

---
[2026-02-26 01:00] workflow-change
Post detail page SSR for SEO: server-render post content in <article> tag for crawlers (Google, AI bots), moved content rendering from PostDetailClient to page.tsx server component, interactive elements (likes/comments/share) remain client-side
Files: Frontend/src/app/(main)/profile/[username]/[postId]/page.tsx, Frontend/src/app/(main)/profile/[username]/[postId]/PostDetailClient.tsx
---

---
[2026-02-27 10:00] bug-fix
Fixed notification comment hash mismatch (#comments → #comment-section) so clicking comment notifications correctly scrolls to and focuses the comment section. Added TODO for search performance (LIKE full table scan) with migration recommendation.
Files: Frontend/src/features/notifications/components/NotificationItem.tsx, Backend/src/modules/search/repositories/search.repository.ts
---

---
[2026-02-27 12:00] bug-fix
Fix notification dropdown shake (x→y animation), click redirect /#→/notifications fallback, hover text visibility in dark/light mode (accent CSS variables + hover:text-accent-foreground)
Files: Frontend/src/app/globals.css, Frontend/src/features/notifications/components/NotificationItem.tsx, Frontend/src/components/ui/dropdown-menu.tsx, Frontend/src/app/(main)/notifications/page.tsx
---

---
[2026-02-27 14:00] api-change
Added postAuthorUsername to NotificationData for direct /profile/{username}/{postId} links. Removed dropdown zoom/slide animations to fix screen shake.
Files: Frontend/src/components/ui/dropdown-menu.tsx, Frontend/src/features/notifications/components/NotificationItem.tsx, Frontend/src/features/notifications/types/notification.ts, Backend/src/modules/notifications/types/notification.types.ts, Backend/src/modules/notifications/services/notifications.service.ts, Backend/src/modules/reactions/services/reactions.service.ts, Backend/src/modules/comments/services/comments.service.ts
---

---
[2026-02-27 19:45] small-feature
Extraordinary 3D auth pages UI overhaul: interactive particle background (@tsparticles/react), 3D floating geometric shapes with mouse parallax, glassmorphic card with mouse-following glow border and 3D tilt effect, staggered Framer Motion entrance animations, floating label inputs with animated focus underlines, shimmer button effects, password strength meter, error shake animations, page transitions with AnimatePresence, gradient mesh background with vignette overlay. All heavy assets client-side only (dynamic import ssr:false). Reduced motion support.
Files: Frontend/src/features/auth/components/AuthParticlesBackground.tsx, Frontend/src/features/auth/components/AuthFloatingShapes.tsx, Frontend/src/features/auth/components/AuthGlowCard.tsx, Frontend/src/features/auth/components/LoginForm.tsx, Frontend/src/features/auth/components/RegisterForm.tsx, Frontend/src/features/auth/components/ForgotPasswordForm.tsx, Frontend/src/app/(auth)/layout.tsx, Frontend/src/app/globals.css
---

---
[2026-02-27 20:00] small-feature
Added default fallback avatar for users without avatars — getAvatarUrl() now returns /default_avatar_for_user_did_not_update_for_their_avatar.webp when avatar is null/undefined/empty. Updated 8 components that were bypassing getAvatarUrl() to use it consistently.
Files: Frontend/src/lib/image-url.ts, Frontend/src/components/layout/Navbar.tsx, Frontend/src/features/comments/components/CommentSection.tsx, Frontend/src/features/friends/components/FriendRequestCard.tsx, Frontend/src/features/friends/components/FriendSuggestionCard.tsx, Frontend/src/features/posts/components/PostComposer.tsx, Frontend/src/components/layout/PopularPostsWidget.tsx, Frontend/src/features/profiles/components/ProfileEditModal.tsx
---

---
[2026-02-27 22:45] small-feature
Added Vietnamese legal pages /dieu-khoan (Terms of Service) and /chinh-sach-bao-mat (Privacy Policy) with TOC, breadcrumbs, SEO metadata. Updated navigation links in Footer, Sidebar, 404 page, and llms.txt/llms-full.txt from /terms→/dieu-khoan and /privacy→/chinh-sach-bao-mat. English routes kept for backward compatibility with canonical pointing to Vietnamese URLs.
Files: Frontend/src/app/(public)/dieu-khoan/page.tsx, Frontend/src/app/(public)/chinh-sach-bao-mat/page.tsx, Frontend/src/features/landing/components/Footer.tsx, Frontend/src/components/layout/Sidebar.tsx, Frontend/src/app/not-found.tsx, Frontend/public/llms.txt, Frontend/public/llms-full.txt, Frontend/src/app/(public)/terms/page.tsx, Frontend/src/app/(public)/privacy/page.tsx
---

---
[2026-02-27 23:30] small-feature
Changed post creation word counter from character-based (5000 chars) to word-based (1000 words) with UX improvements (color thresholds at 90%/98%, pulse animation on exceed, tooltips)
Files: Frontend/src/lib/utils/word-count.ts, Frontend/src/app/(main)/compose/page.tsx, Frontend/src/features/posts/components/PostComposer.tsx
---

---
[2026-02-28 00:00] config-change
Upgraded Post.content column from TEXT (65KB) to MEDIUMTEXT (16MB) in Prisma schema to support @MaxLength(50000) in DTOs without exceeding MySQL column capacity. Removed dead metadata exports from redirect pages.
Files: Backend/prisma/schema.prisma, Backend/prisma/migrations/20260227000000_upgrade_post_content_to_mediumtext/migration.sql, Frontend/src/app/(public)/terms/page.tsx, Frontend/src/app/(public)/privacy/page.tsx
---

---
[2026-02-28 13:00] config-change
Fixed ecosystem.config.js PM2 config: Backend script app.js→dist/main.js, Frontend script app.js→node_modules/next/dist/bin/next with args 'start', Backend max_memory_restart 512M→768M, added min_uptime and kill_timeout to both apps
Files: ecosystem.config.js
---

---
[2026-02-28 14:30] workflow-change
Fixed broken provider chain: wired ClientLayout into root layout (ThemeProvider, Toaster, CSRF, Analytics, QueryClient restored). Removed duplicate QueryProvider from (main) and admin layouts. Cleaned up dead code (force-dynamic in client components). Fixed not-found.tsx theme support. Aligned PM2 config with standalone output. Removed eslint.ignoreDuringBuilds.
Files: Frontend/src/app/layout.tsx, Frontend/src/app/client-layout.tsx, Frontend/src/app/(main)/layout.tsx, Frontend/src/app/admin/layout.tsx, Frontend/src/app/(main)/trending/page.tsx, Frontend/src/app/(public)/layout.tsx, Frontend/src/app/not-found.tsx, Frontend/next.config.js, ecosystem.config.js
---

---
[2026-02-28 20:00] api-change
Fixed 3 production errors: sitemap controller bypasses TransformInterceptor via @Res() for raw XML output, RSS feed.xml unwraps {success,data} API response correctly, start:prod uses standalone server.js instead of next binary
Files: Backend/src/modules/seo/controllers/sitemap.controller.ts, Frontend/src/app/feed.xml/route.ts, Frontend/package.json
---

---
[2026-02-28 23:00] config-change
Fixed 2 critical production issues: (1) Added postbuild script to copy .next/static and public into standalone dir for CSS/JS serving, (2) CSRF middleware uses req.originalUrl instead of req.path for reliable path matching behind Nginx proxy, (3) Added COOKIE_DOMAIN env var for cross-subdomain cookie sharing between chungtoixayweb.vn and gateway.chungtoixayweb.vn
Files: Frontend/package.json, Backend/src/common/middleware/csrf.middleware.ts, Backend/src/config/configuration.ts, Backend/src/modules/auth/controllers/auth.controller.ts
---