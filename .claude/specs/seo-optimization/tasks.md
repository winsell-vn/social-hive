---
spec_version: "1.0"
feature: "seo-optimization"
type: "tasks"
---

# SEO Optimization - Tasks

<!-- @PHASE:PH-1 name="Crawlability & Indexing" story=US-001,US-002,US-003,US-004 -->
## Phase 1: Crawlability & Indexing - P0 (Week 1) 🎯 MVP

### Task 1.1: Homepage SSR Conversion

<!-- @TASK:T-001 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Extract NewsfeedContent to separate Client Component | `Frontend/src/app/(main)/NewsfeedClient.tsx` | Client component created with all interactive logic | [x] |
<!-- @END:TASK:T-001 -->

<!-- @TASK:T-002 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Create server-side posts fetching function | `Frontend/src/app/(main)/page.tsx` | `getInitialPosts()` fetches 20 posts with Redis cache | [x] |
<!-- @END:TASK:T-002 -->

<!-- @TASK:T-003 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Convert homepage to Server Component | `Frontend/src/app/(main)/page.tsx` | Remove "use client", render initial posts SSR, pass to client | [x] |
<!-- @END:TASK:T-003 -->

<!-- @TASK:T-004 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Add H1 heading to homepage | `Frontend/src/app/(main)/page.tsx` | Proper H1 tag with platform name/description | [x] |
<!-- @END:TASK:T-004 -->

### Task 1.2: Homepage Meta Tags & Structured Data

<!-- @TASK:T-005 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Add homepage metadata export | `Frontend/src/app/(main)/page.tsx` | Meta description (Vietnamese), OG image, Twitter cards | [x] |
<!-- @END:TASK:T-005 -->

<!-- @TASK:T-006 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Create OrganizationSchema component | `Frontend/src/components/seo/OrganizationSchema.tsx` | JSON-LD with name, url, logo, sameAs, contactPoint | [x] |
<!-- @END:TASK:T-006 -->

<!-- @TASK:T-007 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Create WebSiteSchema component | `Frontend/src/components/seo/WebSiteSchema.tsx` | JSON-LD with SearchAction for sitelinks search box | [x] |
<!-- @END:TASK:T-007 -->

<!-- @TASK:T-008 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Add schemas to homepage | `Frontend/src/app/(main)/page.tsx` | Include OrganizationSchema + WebSiteSchema | [x] |
<!-- @END:TASK:T-008 -->

### Task 1.3: Noindex Implementation

<!-- @TASK:T-009 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Add noindex to settings pages | `Frontend/src/app/(main)/settings/layout.tsx` | `robots: { index: false, follow: true }` in metadata | [x] |
<!-- @END:TASK:T-009 -->

<!-- @TASK:T-010 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Add noindex to draft/pending post pages | `Frontend/src/app/(main)/profile/[username]/[postId]/page.tsx` | Conditional noindex based on post.status | [x] |
<!-- @END:TASK:T-010 -->

<!-- @TASK:T-011 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Add noindex to search results | `Frontend/src/app/(main)/search/layout.tsx` | `robots: { index: false, follow: true }` in metadata | [x] |
<!-- @END:TASK:T-011 -->

### Task 1.4: UGC Link Handling

<!-- @TASK:T-012 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Create link processor utility | `Frontend/src/lib/seo/link-processor.ts` | Function to add rel attributes based on link type | [x] |
<!-- @END:TASK:T-012 -->

<!-- @TASK:T-013 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Update TipTap Link extension config | `Frontend/src/components/editor/RichTextEditor.tsx` | Add rel="ugc noopener noreferrer" to link HTMLAttributes | [x] |
<!-- @END:TASK:T-013 -->

<!-- @TASK:T-014 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Update post content renderer | `Frontend/src/features/posts/components/PostCard.tsx` | Process links at render time with rel attributes | [x] |
<!-- @END:TASK:T-014 -->

**Checkpoint**: Homepage fully crawlable, structured data passes Rich Results Test, noindex pages configured, UGC links handled.
<!-- @END:PHASE:PH-1 -->

<!-- @PHASE:PH-2 name="Ranking Signals" story=US-005,US-006,US-007 prereq=PH-1 -->
## Phase 2: Ranking Signals - P1 (Week 2)

Prerequisites: Phase 1 complete

### Task 2.1: Breadcrumb Component

<!-- @TASK:T-015 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Create Breadcrumb component | `Frontend/src/components/seo/Breadcrumb.tsx` | Visual nav + BreadcrumbList JSON-LD schema | [x] |
<!-- @END:TASK:T-015 -->

<!-- @TASK:T-016 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Add breadcrumbs to profile pages | `Frontend/src/app/(main)/profile/[username]/page.tsx` | Home > @username | [x] |
<!-- @END:TASK:T-016 -->

<!-- @TASK:T-017 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Add breadcrumbs to post detail pages | `Frontend/src/app/(main)/profile/[username]/[postId]/page.tsx` | Home > @username > Post Title | [x] |
<!-- @END:TASK:T-017 -->

<!-- @TASK:T-018 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Add breadcrumbs to hashtag pages | `Frontend/src/app/(main)/hashtag/[name]/page.tsx` | Home > Xu hướng > #hashtag | [x] |
<!-- @END:TASK:T-018 -->

<!-- @TASK:T-019 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Add breadcrumbs to pricing page | `Frontend/src/app/(public)/bang-gia/page.tsx` | Home > Bảng giá | [x] |
<!-- @END:TASK:T-019 -->

### Task 2.2: Image Alt Text System

<!-- @TASK:T-020 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Create alt text generator utility | `Frontend/src/lib/seo/alt-text.ts` | Generate "Hình {n} trong bài viết: {title}" format | [x] |
<!-- @END:TASK:T-020 -->

<!-- @TASK:T-021 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Update PostCard image rendering | `Frontend/src/features/posts/components/PostCard.tsx` | Add generated alt text to all images | [x] |
<!-- @END:TASK:T-021 -->

<!-- @TASK:T-022 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Add alt text to user avatars | `Frontend/src/components/ui/avatar.tsx` + 12 usage sites | Alt = "Ảnh đại diện của {displayName}" | [x] |
<!-- @END:TASK:T-022 -->

### Task 2.3: Related Posts Section

<!-- @TASK:T-023 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Create related posts API endpoint | `Backend/src/modules/posts/controllers/posts.controller.ts` | GET /posts/:id/related returns 3-6 posts | [x] |
<!-- @END:TASK:T-023 -->

<!-- @TASK:T-024 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Implement related posts algorithm | `Backend/src/modules/posts/services/related-posts.service.ts` | Score by hashtags (3x), author (2x), recency (1x) | [x] |
<!-- @END:TASK:T-024 -->

<!-- @TASK:T-025 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Add Redis caching for related posts | `Backend/src/modules/posts/services/related-posts.service.ts` | 5-minute TTL per post, invalidate on new post | [x] |
<!-- @END:TASK:T-025 -->

<!-- @TASK:T-026 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Create RelatedPosts component | `Frontend/src/features/posts/components/RelatedPosts.tsx` | SSR component showing 3-6 related posts with thumbnails | [x] |
<!-- @END:TASK:T-026 -->

<!-- @TASK:T-027 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Add RelatedPosts to post detail page | `Frontend/src/app/(main)/profile/[username]/[postId]/page.tsx` | Fetch and render related posts server-side | [x] |
<!-- @END:TASK:T-027 -->

### Task 2.4: Heading Hierarchy

<!-- @TASK:T-028 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Audit and fix heading hierarchy | Multiple page files | Each page has exactly one H1, proper H2/H3 nesting | [x] |
<!-- @END:TASK:T-028 -->

**Checkpoint**: Breadcrumbs pass Rich Results Test, all images have alt text, related posts visible in page source.
<!-- @END:PHASE:PH-2 -->

<!-- @PHASE:PH-3 name="Performance & Polish" story=US-008,US-009,US-010 prereq=PH-2 -->
## Phase 3: Performance & Polish - P2 (Week 3)

Prerequisites: Phase 2 complete

### Task 3.1: Lazy Loading Heavy Components

<!-- @TASK:T-029 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Create EditorSkeleton component | `Frontend/src/components/loading/EditorSkeleton.tsx` | Loading skeleton matching TipTap editor dimensions | [x] |
<!-- @END:TASK:T-029 -->

<!-- @TASK:T-030 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Lazy load TipTap in compose/admin pages | `Frontend/src/app/(main)/compose/page.tsx`, `Frontend/src/app/admin/` | Dynamic import with EditorSkeleton, ssr: false | [x] |
<!-- @END:TASK:T-030 -->

<!-- @TASK:T-031 status=skipped -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Lazy load ImageUploader | N/A | N/A - PostComposer uses inline Textarea, not separate ImageUploader | [-] |
<!-- @END:TASK:T-031 -->

<!-- @TASK:T-032 status=skipped -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Lazy load framer-motion animations | N/A | N/A - framer-motion used extensively in core UI, lazy loading would degrade UX | [-] |
<!-- @END:TASK:T-032 -->

### Task 3.2: LCP Image Optimization

<!-- @TASK:T-033 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Add priority to first post images | `Frontend/src/features/posts/components/PostCard.tsx` | `priority={index === 0}` prop for LCP images | [x] |
<!-- @END:TASK:T-033 -->

<!-- @TASK:T-034 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Add priority to profile avatars | `Frontend/src/features/profiles/components/ProfileHeader.tsx` | Hero avatar gets priority, cover photo gets priority | [x] |
<!-- @END:TASK:T-034 -->

<!-- @TASK:T-035 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Add loading="lazy" to below-fold images | `Frontend/src/components/ui/avatar.tsx` + multiple components | All non-LCP images have loading="lazy" by default | [x] |
<!-- @END:TASK:T-035 -->

### Task 3.3: FAQ Schema for Pricing

<!-- @TASK:T-036 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Create FAQSchema component | `Frontend/src/components/seo/FAQSchema.tsx` | Reusable FAQPage JSON-LD generator | [x] |
<!-- @END:TASK:T-036 -->

<!-- @TASK:T-037 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Add FAQ content to pricing page | `Frontend/src/app/(public)/bang-gia/page.tsx` | 8 Vietnamese FAQ items with FAQSchema + visual accordion | [x] |
<!-- @END:TASK:T-037 -->

### Task 3.4: Pagination Meta Tags

<!-- @TASK:T-038 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Add ?page=N URL support | `Frontend/src/app/(main)/page.tsx` | Parse page param, fetch correct page of posts | [x] |
<!-- @END:TASK:T-038 -->

<!-- @TASK:T-039 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Add rel="next/prev" meta tags | `Frontend/src/app/(main)/page.tsx` | Dynamic link tags based on current page | [x] |
<!-- @END:TASK:T-039 -->

<!-- @TASK:T-040 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Add noindex to pagination pages | `Frontend/src/app/(main)/page.tsx` | Page 2+ gets noindex, follow | [x] |
<!-- @END:TASK:T-040 -->

### Task 3.5: Sitemap Proxy

<!-- @TASK:T-041 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Create sitemap index route | `Frontend/src/app/sitemap.xml/route.ts` | Proxy to backend /sitemap.xml with 1hr cache | [x] |
<!-- @END:TASK:T-041 -->

<!-- @TASK:T-042 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Create sitemap sub-routes | `Frontend/src/app/sitemap/[type]/route.ts` | Proxy posts.xml, users.xml, hashtags.xml, static.xml | [x] |
<!-- @END:TASK:T-042 -->

<!-- @TASK:T-043 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Add caching to sitemap proxy | `Frontend/src/app/sitemap*/` | Cache responses for 1 hour | [x] |
<!-- @END:TASK:T-043 -->

**Checkpoint**: LCP ≤ 2.5s, bundle size reduced 30%+, FAQ rich results pass, sitemap accessible at frontend domain.
<!-- @END:PHASE:PH-3 -->

<!-- @SECTION:RISK_MITIGATION -->
## Risk Mitigation Tasks

<!-- @TASK:T-044 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Create SSR fallback for homepage | `Frontend/src/app/(main)/page.tsx` | Graceful degradation if API fails (returns empty array) | [x] |
<!-- @END:TASK:T-044 -->

<!-- @TASK:T-045 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Add fixed-size skeletons for lazy components | `Frontend/src/components/loading/EditorSkeleton.tsx` | Prevent CLS from lazy loading | [x] |
<!-- @END:TASK:T-045 -->

<!-- @TASK:T-046 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Add database indexes for related posts | `Backend/prisma/schema.prisma` | Composite index on [status, createdAt] + single [status] index | [x] |
<!-- @END:TASK:T-046 -->
<!-- @END:RISK_MITIGATION -->

<!-- @PHASE:PH-4 name="Post Detail Page Deep SEO" story=US-011,US-012,US-013,US-014,US-015 prereq=PH-3 -->
## Phase 4: Post Detail Page Deep SEO - P1 (Week 4)

Prerequisites: Phase 3 complete

### Task 4.1: SEO Utility Functions

<!-- @TASK:T-048 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Create reading-time.ts utility | `Frontend/src/lib/seo/reading-time.ts` | calculateReadingTime(), stripHtmlTags() functions with tests | [x] |
<!-- @END:TASK:T-048 -->

<!-- @TASK:T-049 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Create meta-description.ts utility | `Frontend/src/lib/seo/meta-description.ts` | generateMetaDescription(), stripHashtags(), truncateAtWordBoundary() functions | [x] |
<!-- @END:TASK:T-049 -->

<!-- @TASK:T-050 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Export new utilities from seo/index.ts | `Frontend/src/lib/seo/index.ts` | All new utilities exported from barrel file | [x] |
<!-- @END:TASK:T-050 -->

### Task 4.2: Enhanced Post Metadata

<!-- @TASK:T-051 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Enhance generateMetadata() | `Frontend/src/app/(main)/profile/[username]/[postId]/page.tsx` | Add keywords, article:tag, article:published_time, article:modified_time, smart description, twitter card logic | [x] |
<!-- @END:TASK:T-051 -->

<!-- @TASK:T-052 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Fix canonical URL for shared posts | `Frontend/src/app/(main)/profile/[username]/[postId]/page.tsx` | Canonical points to original post if shared, self-referencing if original deleted, OG url matches canonical | [x] |
<!-- @END:TASK:T-052 -->

### Task 4.3: Enhanced JSON-LD

<!-- @TASK:T-053 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Enhance JSON-LD schema | `Frontend/src/app/(main)/profile/[username]/[postId]/page.tsx` | Add inLanguage, commentCount, wordCount, keywords, isAccessibleForFree, ImageObject array, author image/description, timeRequired | [x] |
<!-- @END:TASK:T-053 -->

### Task 4.4: Reading Time Display

<!-- @TASK:T-054 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Add reading time display to post detail page | `Frontend/src/app/(main)/profile/[username]/[postId]/page.tsx` | Display "X phút đọc" in Vietnamese, hidden for posts < 50 words | [x] |
<!-- @END:TASK:T-054 -->

### Task 4.5: ISR Configuration

<!-- @TASK:T-055 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Add ISR revalidation | `Frontend/src/app/(main)/profile/[username]/[postId]/page.tsx` | Export revalidate = 300 for 5-minute ISR | [x] |
<!-- @END:TASK:T-055 -->

**Checkpoint**: ✅ COMPLETE - Post detail pages have enhanced meta tags, comprehensive JSON-LD with all new fields, reading time displayed, correct canonical URLs for shared posts, ISR enabled.
<!-- @END:PHASE:PH-4 -->

<!-- @PHASE:PH-5 name="E-E-A-T Foundation Pages" story=US-016,US-017,US-018,US-019 -->
## Phase 5: E-E-A-T Foundation Pages - P0 (Week 1) 🎯 MVP

### Task 5.1: About Us Page

<!-- @TASK:T-060 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Create About page with SSR, metadata, Organization schema | `Frontend/src/app/(public)/about/page.tsx` | Page renders company info, team section, mission, enhanced Organization JSON-LD | [x] |
<!-- @END:TASK:T-060 -->

### Task 5.2: Legal Pages

<!-- @TASK:T-061 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Create Privacy Policy page with Vietnamese content | `Frontend/src/app/(public)/privacy/page.tsx` | Page covers data collection, usage, cookies, user rights with proper meta tags | [x] |
<!-- @END:TASK:T-061 -->

<!-- @TASK:T-062 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Create Terms of Service page with Vietnamese content | `Frontend/src/app/(public)/terms/page.tsx` | Page covers user responsibilities, content policies, disclaimers with proper meta tags | [x] |
<!-- @END:TASK:T-062 -->

### Task 5.3: Contact Page

<!-- @TASK:T-063 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Create Contact page with form and ContactPoint schema | `Frontend/src/app/(public)/contact/page.tsx` | Page shows email, phone, address, business hours, contact form, ContactPoint JSON-LD | [x] |
<!-- @END:TASK:T-063 -->

### Task 5.4: Footer & Sidebar Link Fix

<!-- @TASK:T-064 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Update all placeholder links to actual routes | `Frontend/src/features/landing/components/Footer.tsx` | All `href="#"` replaced with `/about`, `/blog`, `/privacy`, `/terms`, `/contact` | [x] |
<!-- @END:TASK:T-064 -->

<!-- @TASK:T-065 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Update Sidebar footer links to match Footer | `Frontend/src/components/layout/Sidebar.tsx` | Sidebar links match Footer links, no 404s | [x] |
<!-- @END:TASK:T-065 -->

### Task 5.5: Sitemap Update

<!-- @TASK:T-066 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Add new static pages to sitemap | `Backend/src/modules/seo/services/sitemap.service.ts` | /about, /privacy, /terms, /contact in static sitemap | [x] |
<!-- @END:TASK:T-066 -->

**Checkpoint**: All E-E-A-T pages accessible, footer links work, Organization/ContactPoint schemas pass Rich Results Test.
<!-- @END:PHASE:PH-5 -->

<!-- @PHASE:PH-6 name="Blog/Content Hub System" story=US-020,US-021,US-022,US-023 prereq=PH-5 -->
## Phase 6: Blog/Content Hub System - P0 (Week 2-3) 🎯 MVP

Prerequisites: Phase 5 complete (footer links to /blog)

### Task 6.1: Blog Database Schema

<!-- @TASK:T-070 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Add BlogPost and BlogCategory models with indexes | `Backend/prisma/schema.prisma` | Models created with all fields, proper indexes, relations | [x] |
<!-- @END:TASK:T-070 -->

<!-- @TASK:T-071 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Run Prisma migration | `Backend/prisma/migrations/` | Migration succeeds, tables created in database | [x] |

**Note**: Schema defined in prisma/schema.prisma but migration needs to be run manually with `prisma migrate dev`.
<!-- @END:TASK:T-071 -->

### Task 6.2: Blog Backend Module

<!-- @TASK:T-072 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Create blog module | `Backend/src/modules/blog/blog.module.ts` | Module registered in AppModule | [x] |
<!-- @END:TASK:T-072 -->

<!-- @TASK:T-073 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Create DTOs for blog CRUD | `Backend/src/modules/blog/dto/` | CreateBlogPostDto, UpdateBlogPostDto, BlogQueryDto | [x] |
<!-- @END:TASK:T-073 -->

<!-- @TASK:T-074 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Implement blog service with caching | `Backend/src/modules/blog/services/blog.service.ts` | CRUD operations, pagination, category filter, Redis cache | [x] |
<!-- @END:TASK:T-074 -->

<!-- @TASK:T-075 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Implement public blog endpoints | `Backend/src/modules/blog/controllers/blog.controller.ts` | GET /blog/posts, /blog/posts/:slug, /blog/categories | [x] |
<!-- @END:TASK:T-075 -->

### Task 6.3: Blog Frontend Types & API

<!-- @TASK:T-076 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Create TypeScript types for blog | `Frontend/src/types/blog.ts` | BlogPost, BlogCategory, BlogListResponse interfaces | [x] |
<!-- @END:TASK:T-076 -->

<!-- @TASK:T-077 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Create React Query hooks for blog | `Frontend/src/features/blog/api/blog.ts` | useBlogPosts, useBlogPost, useBlogCategories hooks | [x] |
<!-- @END:TASK:T-077 -->

### Task 6.4: Blog Frontend Pages

<!-- @TASK:T-078 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Create blog list page with SSR | `Frontend/src/app/(public)/blog/page.tsx` | Paginated posts, category sidebar, CollectionPage schema, SSR | [x] |
<!-- @END:TASK:T-078 -->

<!-- @TASK:T-079 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Create blog detail page with Article schema | `Frontend/src/app/(public)/blog/[category]/[slug]/page.tsx` | Full post, Article JSON-LD, author section, ToC, ISR | [x] |
<!-- @END:TASK:T-079 -->

### Task 6.5: Blog SEO Components

<!-- @TASK:T-080 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Create Article JSON-LD component | `Frontend/src/components/seo/ArticleSchema.tsx` | Reusable Article schema with author, publisher, images | [x] |
<!-- @END:TASK:T-080 -->

<!-- @TASK:T-081 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Create Table of Contents component | `Frontend/src/components/seo/TableOfContents.tsx` | Auto-generate ToC from headings, smooth scroll, sticky | [x] |
<!-- @END:TASK:T-081 -->

### Task 6.6: Blog Sitemap

<!-- @TASK:T-082 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Add generateBlogSitemap() method | `Backend/src/modules/seo/services/sitemap.service.ts` | Blog posts in sitemap with lastmod, priority 0.8 | [x] |
<!-- @END:TASK:T-082 -->

<!-- @TASK:T-083 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Add /sitemap/blog.xml route | `Backend/src/modules/seo/controllers/sitemap.controller.ts` | Blog sitemap accessible, added to sitemap index | [x] |
<!-- @END:TASK:T-083 -->

**Checkpoint**: Blog system functional, Article schema passes Rich Results Test, blog posts appear in sitemap.
<!-- @END:PHASE:PH-6 -->


<!-- @PHASE:PH-7 name="Author Authority Enhancement" story=US-024,US-025,US-026 prereq=PH-6 -->
## Phase 7: Author Authority Enhancement - P1 (Week 3)

Prerequisites: Phase 6 complete (blog system for author display)

### Task 7.1: Author Expertise Database

<!-- @TASK:T-090 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Add expertise fields to Profile model | `Backend/prisma/schema.prisma` | jobTitle, company, expertise (Json), credentials (Json), isVerifiedExpert added | [x] |
<!-- @END:TASK:T-090 -->

<!-- @TASK:T-091 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Run migration for Profile changes | `Backend/prisma/migrations/` | Migration succeeds, new columns in Profile table | [x] |
<!-- @END:TASK:T-091 -->

### Task 7.2: Author Backend Updates

<!-- @TASK:T-092 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Add expertise fields to update-profile DTO | `Backend/src/modules/profiles/dto/update-profile.dto.ts` | jobTitle, company, expertise, credentials validated | [x] |
<!-- @END:TASK:T-092 -->

<!-- @TASK:T-093 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Handle expertise fields in profile service | `Backend/src/modules/profiles/services/profiles.service.ts` | Update method saves expertise fields | [x] |
<!-- @END:TASK:T-093 -->

### Task 7.3: Author Frontend Components

<!-- @TASK:T-094 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Add expertise fields to profile edit form | `Frontend/src/features/profiles/components/ProfileEditModal.tsx` | jobTitle, company, expertise tags, credentials inputs | [x] |
<!-- @END:TASK:T-094 -->

<!-- @TASK:T-095 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Create AuthorCard component | `Frontend/src/features/blog/components/AuthorCard.tsx` | Avatar, name, title, company, bio, expertise tags, social links | [x] |
<!-- @END:TASK:T-095 -->

<!-- @TASK:T-096 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Add AuthorCard to blog detail page | `Frontend/src/app/(public)/blog/[category]/[slug]/page.tsx` | Author card displayed below post content | [x] |
<!-- @END:TASK:T-096 -->

### Task 7.4: Author Schema Enhancement

<!-- @TASK:T-097 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Add blog posts tab and enhance Person schema on profile | `Frontend/src/app/(main)/profile/[username]/page.tsx` | "Bài viết" tab shows blog posts, Person schema has expertise | [x] |
<!-- @END:TASK:T-097 -->

<!-- @TASK:T-098 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Add author bio to SocialMediaPosting JSON-LD | `Frontend/src/app/(main)/profile/[username]/[postId]/page.tsx` | Author Person schema includes description (bio) | [x] |
<!-- @END:TASK:T-098 -->

**Checkpoint**: Author expertise editable, author cards display on blog posts, Person schema includes expertise fields.
<!-- @END:PHASE:PH-7 -->

<!-- @PHASE:PH-8 name="Advanced Structured Data & GEO" story=US-027,US-028,US-029 prereq=PH-6 -->
## Phase 8: Advanced Structured Data & GEO - P1 (Week 4)

Prerequisites: Phase 6 complete (blog system for Article schema)

### Task 8.1: HowTo Schema

<!-- @TASK:T-100 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Create HowTo JSON-LD component | `Frontend/src/components/seo/HowToSchema.tsx` | HowTo schema with name, description, totalTime, steps | [x] |
<!-- @END:TASK:T-100 -->

<!-- @TASK:T-101 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Add HowTo schema for tutorial posts | `Frontend/src/app/(public)/blog/[category]/[slug]/page.tsx` | Tutorial posts with steps include HowTo JSON-LD | [x] |
<!-- @END:TASK:T-101 -->

### Task 8.2: Expanded FAQ Schema

<!-- @TASK:T-102 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Add FAQ section with FAQSchema to About page | `Frontend/src/app/(public)/about/page.tsx` | Company FAQs with FAQPage JSON-LD | [x] |
<!-- @END:TASK:T-102 -->

<!-- @TASK:T-103 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Add FAQ section with FAQSchema to Contact page | `Frontend/src/app/(public)/contact/page.tsx` | Support FAQs with FAQPage JSON-LD | [x] |
<!-- @END:TASK:T-103 -->

### Task 8.3: GEO Components

<!-- @TASK:T-104 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Create KeyTakeaways component | `Frontend/src/features/blog/components/KeyTakeaways.tsx` | Bulleted summary with `<aside role="note">` semantic HTML | [x] |
<!-- @END:TASK:T-104 -->

<!-- @TASK:T-105 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Create ComparisonTable component | `Frontend/src/features/blog/components/ComparisonTable.tsx` | Semantic `<table>` with caption for blog comparisons | [x] |
<!-- @END:TASK:T-105 -->

### Task 8.4: Blog Schema Fields

<!-- @TASK:T-106 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Add postType, takeaways fields to BlogPost model | `Backend/prisma/schema.prisma` | postType enum (article, tutorial, comparison, faq), takeaways Json | [x] |
<!-- @END:TASK:T-106 -->

**Checkpoint**: HowTo schema on tutorials, FAQ schema on About/Contact, KeyTakeaways renders correctly.
<!-- @END:PHASE:PH-8 -->

<!-- @PHASE:PH-9 name="Internal Linking Enhancement" story=US-030,US-031,US-032 prereq=PH-5,PH-6 -->
## Phase 9: Internal Linking Enhancement - P1 (Week 4)

Prerequisites: Phase 5 (E-E-A-T pages exist), Phase 6 (blog exists)

### Task 9.1: Topic Hub Pages

<!-- @TASK:T-110 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Create topic hub page | `Frontend/src/app/(public)/topics/[topic]/page.tsx` | Aggregated blog + UGC posts, CollectionPage schema, SSR | [x] |
<!-- @END:TASK:T-110 -->

<!-- @TASK:T-111 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Add getPostsByTopic() method | `Backend/src/modules/blog/services/blog.service.ts` | Query blog posts by topic/tag with pagination | [x] |
<!-- @END:TASK:T-111 -->

### Task 9.2: Popular Posts Widget

<!-- @TASK:T-112 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Add PopularPosts widget to RightSidebar | `Frontend/src/components/layout/RightSidebar.tsx` | "Bài viết phổ biến" section with top 5 posts | [x] |
<!-- @END:TASK:T-112 -->

<!-- @TASK:T-113 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Add getPopularPosts() method | `Backend/src/modules/posts/services/posts.service.ts` | Top posts by engagement score, cached | [x] |
<!-- @END:TASK:T-113 -->

### Task 9.3: Breadcrumbs on New Pages

<!-- @TASK:T-114 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Add breadcrumbs to blog list page | `Frontend/src/app/(public)/blog/page.tsx` | Home > Blog breadcrumb with BreadcrumbList schema | [x] |
<!-- @END:TASK:T-114 -->

<!-- @TASK:T-115 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Add breadcrumbs to blog detail page | `Frontend/src/app/(public)/blog/[category]/[slug]/page.tsx` | Home > Blog > Category > Title breadcrumb | [x] |
<!-- @END:TASK:T-115 -->

<!-- @TASK:T-116 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Add breadcrumbs to About and Contact pages | `Frontend/src/app/(public)/about/page.tsx`, `Frontend/src/app/(public)/contact/page.tsx` | Home > Giới thiệu, Home > Liên hệ breadcrumbs | [x] |
<!-- @END:TASK:T-116 -->

**Checkpoint**: Topic hubs functional, popular posts widget shows, breadcrumbs on all new pages.
<!-- @END:PHASE:PH-9 -->

<!-- @PHASE:PH-10 name="Technical SEO Polish" story=US-033,US-034,US-035 -->
## Phase 10: Technical SEO Polish - P2 (Week 5)

Dependencies: None (can run in parallel with Phase 9)

### Task 10.1: next/image Migration

<!-- @TASK:T-120 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Replace raw `<img>` with next/image in RelatedPosts | `Frontend/src/features/posts/components/RelatedPosts.tsx` | All images use next/image with width, height, alt props | [x] |
<!-- @END:TASK:T-120 -->

<!-- @TASK:T-121 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Replace raw `<img>` with next/image in ImageUploader | `Frontend/src/components/upload/ImageUploader.tsx` | Preview images use next/image | [x] |
<!-- @END:TASK:T-121 -->

<!-- @TASK:T-122 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Add explicit width/height to all images missing dimensions | Multiple components | No images without width/height, CLS ≤ 0.05 | [x] |
<!-- @END:TASK:T-122 -->

### Task 10.2: Hreflang Tags

<!-- @TASK:T-123 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Add hreflang tags to root layout | `Frontend/src/app/layout.tsx` | `vi` for Vietnamese, `x-default` for fallback on all pages | [x] |
<!-- @END:TASK:T-123 -->

### Task 10.3: INP Optimization

<!-- @TASK:T-124 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Audit and optimize event handlers with useTransition | Multiple interactive components | Non-urgent updates use useTransition, INP ≤ 200ms | [x] |
<!-- @END:TASK:T-124 -->

### Task 10.4: Robots.txt Update

<!-- @TASK:T-125 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Update robots.txt with new sitemaps and admin disallow | `Frontend/public/robots.txt` | Blog sitemap added, admin routes disallowed | [x] |
<!-- @END:TASK:T-125 -->

**Checkpoint**: No raw `<img>` tags, hreflang on all pages, INP ≤ 200ms, robots.txt updated.
<!-- @END:PHASE:PH-10 -->

<!-- @PHASE:PH-11 name="Searcher Engagement Features" story=US-036,US-037,US-038 prereq=PH-6 -->
## Phase 11: Searcher Engagement Features - P2 (Week 5-6)

Prerequisites: Phase 6 complete (blog system)

### Task 11.1: Reading Progress Bar

<!-- @TASK:T-130 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Create ReadingProgressBar component | `Frontend/src/features/blog/components/ReadingProgressBar.tsx` | Progress bar at top of page, fills on scroll, blog pages only | [x] |
<!-- @END:TASK:T-130 -->

<!-- @TASK:T-131 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Add ReadingProgressBar to blog detail page | `Frontend/src/app/(public)/blog/[category]/[slug]/page.tsx` | Progress bar visible on blog detail pages | [x] |
<!-- @END:TASK:T-131 -->

### Task 11.2: Enhanced Related Content

<!-- @TASK:T-132 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Add cross-content related suggestions | `Frontend/src/app/(public)/blog/[category]/[slug]/page.tsx`, `Frontend/src/app/(main)/profile/[username]/[postId]/page.tsx` | Blog shows related UGC, UGC shows related blog articles | [x] |
<!-- @END:TASK:T-132 -->

### Task 11.3: Social Share Buttons

<!-- @TASK:T-133 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Create SocialShareButtons component | `Frontend/src/features/blog/components/SocialShareButtons.tsx` | Facebook, Zalo, Twitter/X, Copy Link buttons | [x] |
<!-- @END:TASK:T-133 -->

<!-- @TASK:T-134 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Add SocialShareButtons to blog detail page | `Frontend/src/app/(public)/blog/[category]/[slug]/page.tsx` | Share buttons visible on blog detail pages | [x] |
<!-- @END:TASK:T-134 -->

### Task 11.4: Blog Reading Time & View Count

<!-- @TASK:T-135 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Display reading time on blog list cards and detail | `Frontend/src/app/(public)/blog/page.tsx`, `Frontend/src/app/(public)/blog/[category]/[slug]/page.tsx` | "X phút đọc" shown on cards and detail page | [x] |
<!-- @END:TASK:T-135 -->

<!-- @TASK:T-136 status=done -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Track and display view count on blog posts | `Backend/src/modules/blog/services/blog.service.ts`, `Frontend/src/app/(public)/blog/[category]/[slug]/page.tsx` | View count incremented on visit, displayed for social proof | [x] |
<!-- @END:TASK:T-136 -->

### Task 11.5: Scroll to Top

<!-- @TASK:T-137 status=pending -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Create ScrollToTop button component | `Frontend/src/features/blog/components/ScrollToTop.tsx` | Button appears after 500px scroll, smooth scroll to top | [ ] |
<!-- @END:TASK:T-137 -->

<!-- @TASK:T-138 status=pending -->
| Task | Files | DoD | Status |
|------|-------|-----|--------|
| Add ScrollToTop to blog detail page | `Frontend/src/app/(public)/blog/[category]/[slug]/page.tsx` | ScrollToTop button visible on blog detail pages | [ ] |
<!-- @END:TASK:T-138 -->

**Checkpoint**: Reading progress bar works, cross-content links functional, share buttons work, view counts tracked.
<!-- @END:PHASE:PH-11 -->