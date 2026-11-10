---
spec_version: "1.0"
feature: "seo-optimization"
level: 3
status: "active"
created: "2026-02-09"
updated: "2026-02-09"
tags: ["seo", "performance", "crawlability", "structured-data", "post-detail", "json-ld"]
---

<!-- @SECTION:OVERVIEW -->
# SEO Optimization - Comprehensive

Comprehensive SEO optimization to achieve top Google ranking in Vietnam's web design + social network niche. Current score: 7/10, target: Top 1 ranking with 95+ Lighthouse SEO score.
<!-- @END:OVERVIEW -->

<!-- @SECTION:USER_STORIES -->
## User Stories

<!-- @STORY:US-001 priority=P0 status=pending mvp=true -->
### US-001: Homepage Crawlability (P0) 🎯 MVP

As a search engine crawler, I want to see full HTML content on the homepage without JavaScript execution so that I can properly index the platform's main content.

**Independent Test**: View page source shows post content in HTML; Google Search Console URL Inspection shows "Page is indexable".
<!-- @END:STORY:US-001 -->

<!-- @STORY:US-002 priority=P0 status=pending mvp=true -->
### US-002: Homepage Structured Data (P0) 🎯 MVP

As a search engine, I want Organization and WebSite schemas on the homepage so that I can display rich results and sitelinks search box.

**Independent Test**: Google Rich Results Test passes for Organization + WebSite schemas.
<!-- @END:STORY:US-002 -->

<!-- @STORY:US-003 priority=P0 status=pending mvp=true -->
### US-003: Noindex Non-Indexable Pages (P0) 🎯 MVP

As a search engine, I want clear signals about which pages should not be indexed so that I don't waste crawl budget on draft/pending/settings pages.

**Independent Test**: Draft posts, settings pages show `<meta name="robots" content="noindex, follow">` in page source.
<!-- @END:STORY:US-003 -->

<!-- @STORY:US-004 priority=P0 status=pending mvp=true -->
### US-004: UGC Link Handling (P0) 🎯 MVP

As a website owner, I want user-generated links properly attributed so that link spam doesn't affect my site's SEO authority.

**Independent Test**: All user-generated links in posts/comments have `rel="ugc"` attribute.
<!-- @END:STORY:US-004 -->

<!-- @STORY:US-005 priority=P1 status=pending mvp=false -->
### US-005: Breadcrumb Navigation (P1)

As a user and search engine, I want breadcrumb navigation on all pages so that I can understand site hierarchy and see breadcrumb rich results.

**Independent Test**: Google Rich Results Test passes for BreadcrumbList on profile/post/hashtag pages.
<!-- @END:STORY:US-005 -->

<!-- @STORY:US-006 priority=P1 status=pending mvp=false -->
### US-006: Image Alt Text System (P1)

As a search engine and visually impaired user, I want all images to have meaningful alt text so that content is accessible and image search works properly.

**Independent Test**: All `<img>` tags have non-empty alt attributes describing the image content.
<!-- @END:STORY:US-006 -->

<!-- @STORY:US-007 priority=P1 status=pending mvp=false -->
### US-007: Related Posts Section (P1)

As a user and search engine, I want related posts at the bottom of post detail pages so that I can discover more content and crawlers can find related pages.

**Independent Test**: Related posts section visible in page source HTML (SSR), shows 3-6 relevant posts.
<!-- @END:STORY:US-007 -->

<!-- @STORY:US-008 priority=P2 status=pending mvp=false -->
### US-008: Performance Optimization (P2)

As a user, I want fast page loads so that I have a good experience and Core Web Vitals pass.

**Independent Test**: Lighthouse LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1 on mobile.
<!-- @END:STORY:US-008 -->

<!-- @STORY:US-009 priority=P2 status=pending mvp=false -->
### US-009: FAQ Schema for Pricing (P2)

As a search engine, I want FAQ structured data on the pricing page so that FAQ rich results appear in search.

**Independent Test**: Google Rich Results Test passes for FAQPage schema on /bang-gia.
<!-- @END:STORY:US-009 -->

<!-- @STORY:US-010 priority=P2 status=pending mvp=false -->
### US-010: Sitemap Proxy (P2)

As a search engine, I want sitemap accessible at the frontend domain so that I can discover all content from one domain.

**Independent Test**: `/sitemap.xml` on frontend returns valid sitemap index XML.
<!-- @END:STORY:US-010 -->

<!-- @STORY:US-011 priority=P1 status=pending mvp=false -->
### US-011: Enhanced Post Metadata (P1)

As a search engine crawler, I want enhanced meta tags on post detail pages so that I can better understand and display post content in search results.

**Independent Test**: Post detail page source shows keywords meta tag, article:published_time, article:modified_time, article:tag OG tags, smart meta description, and correct Twitter card type.
<!-- @END:STORY:US-011 -->

<!-- @STORY:US-012 priority=P1 status=pending mvp=false -->
### US-012: Enhanced JSON-LD Structured Data (P1)

As a search engine crawler, I want comprehensive SocialMediaPosting schema on post pages so that I can display rich results with full post information.

**Independent Test**: Google Rich Results Test passes for SocialMediaPosting with inLanguage, commentCount, wordCount, keywords, isAccessibleForFree, ImageObject array, and enhanced author Person schema.
<!-- @END:STORY:US-012 -->

<!-- @STORY:US-013 priority=P1 status=pending mvp=false -->
### US-013: Reading Time (P1)

As a user, I want to see estimated reading time on posts so that I can decide whether to read now or save for later.

**Independent Test**: Post detail page shows reading time in Vietnamese format (e.g., "5 phút đọc"), hidden for posts < 50 words, JSON-LD includes timeRequired in ISO 8601 duration format.
<!-- @END:STORY:US-013 -->

<!-- @STORY:US-014 priority=P1 status=pending mvp=false -->
### US-014: Canonical URL for Shared Posts (P1)

As a search engine, I want correct canonical URLs on shared/reposted posts so that I can attribute content to the original source and avoid duplicate content issues.

**Independent Test**: Shared post canonical URL points to original post; if original deleted, uses self-referencing canonical; OG url matches canonical.
<!-- @END:STORY:US-014 -->

<!-- @STORY:US-015 priority=P2 status=pending mvp=false -->
### US-015: ISR Revalidation (P2)

As a search engine and user, I want post detail pages to be cached with periodic revalidation so that content is fresh while maintaining fast load times.

**Independent Test**: Post detail pages use ISR with revalidate = 300 (5 minutes).
<!-- @END:STORY:US-015 -->

<!-- @STORY:US-016 priority=P0 status=done mvp=true -->
### US-016: About Us Page (P0) 🎯 MVP

As a potential customer or search engine, I want to see an About Us page with company information, team, and mission so that I can trust the platform and understand who operates it.

**Independent Test**: `/about` returns 200, shows company info, team section, and Organization schema in page source.
<!-- @END:STORY:US-016 -->

<!-- @STORY:US-017 priority=P0 status=done mvp=true -->
### US-017: Legal Pages (P0) 🎯 MVP

As a user and for legal compliance, I want Privacy Policy and Terms of Service pages so that I understand my rights and the platform's policies.

**Independent Test**: `/privacy` and `/terms` return 200, contain Vietnamese legal content, have proper meta tags.
<!-- @END:STORY:US-017 -->

<!-- @STORY:US-018 priority=P0 status=done mvp=true -->
### US-018: Contact Page (P0) 🎯 MVP

As a potential customer, I want a Contact page with multiple contact methods so that I can reach the company for inquiries.

**Independent Test**: `/contact` returns 200, shows email, phone, address, and ContactPoint schema.
<!-- @END:STORY:US-018 -->

<!-- @STORY:US-019 priority=P0 status=done mvp=true -->
### US-019: Footer Link Fix (P0) 🎯 MVP

As a user and search engine, I want all footer links to work so that I can navigate the site and crawlers can discover all pages.

**Independent Test**: All footer links return 200 status; no `href="#"` in footer HTML.
<!-- @END:STORY:US-019 -->

<!-- @STORY:US-020 priority=P0 status=done mvp=true -->
### US-020: Blog Database Schema (P0) 🎯 MVP

As a developer, I want database models for blog posts and categories so that editorial content is properly structured and queryable.

**Independent Test**: Prisma migration succeeds; BlogPost and BlogCategory tables created with proper indexes.
<!-- @END:STORY:US-020 -->

<!-- @STORY:US-021 priority=P0 status=done mvp=true -->
### US-021: Blog Backend API (P0) 🎯 MVP

As a frontend developer, I want REST API endpoints for blog posts and categories so that I can build the blog UI.

**Independent Test**: GET /api/blog/posts returns paginated posts; GET /api/blog/categories returns all categories; GET /api/blog/posts/:slug returns single post.
<!-- @END:STORY:US-021 -->

<!-- @STORY:US-022 priority=P0 status=done mvp=true -->
### US-022: Blog List Page (P0) 🎯 MVP

As a user and search engine, I want a blog listing page with category filtering so that I can discover and browse editorial content.

**Independent Test**: `/blog` shows paginated posts with SSR; `/blog?category=tutorials` filters correctly; page source contains post content.
<!-- @END:STORY:US-022 -->

<!-- @STORY:US-023 priority=P0 status=done mvp=true -->
### US-023: Blog Detail Page (P0) 🎯 MVP

As a user and search engine, I want blog post detail pages with Article schema, author bio, and table of contents so that content is well-structured and discoverable.

**Independent Test**: `/blog/[category]/[slug]` shows full post with Article schema, author section, ToC for long posts; ISR enabled.
<!-- @END:STORY:US-023 -->

<!-- @STORY:US-024 priority=P1 status=done mvp=false -->
### US-024: Author Expertise Fields (P1)

As an author, I want to add my job title, company, expertise areas, and credentials to my profile so that readers can trust my content.

**Independent Test**: Profile edit form shows expertise fields; saved data appears on profile page and in Person schema.
<!-- @END:STORY:US-024 -->

<!-- @STORY:US-025 priority=P1 status=done mvp=false -->
### US-025: Enhanced Author Bio Section (P1)

As a reader, I want to see author credentials and expertise on blog posts so that I can assess the author's authority on the topic.

**Independent Test**: Blog post shows author card with photo, name, title, company, bio, expertise tags, and social links.
<!-- @END:STORY:US-025 -->

<!-- @STORY:US-026 priority=P1 status=done mvp=false -->
### US-026: Author Page Enhancement (P1)

As a reader, I want to see all articles by an author on their profile so that I can explore more of their content.

**Independent Test**: `/profile/[username]` shows "Bài viết" tab with author's blog posts; Person schema includes `author` of articles.
<!-- @END:STORY:US-026 -->

<!-- @STORY:US-027 priority=P1 status=done mvp=false -->
### US-027: HowTo Schema for Tutorials (P1)

As a search engine and AI assistant, I want HowTo structured data on tutorial posts so that step-by-step instructions appear in rich results and AI overviews.

**Independent Test**: Tutorial blog posts with steps show HowTo schema; passes Rich Results Test.
<!-- @END:STORY:US-027 -->

<!-- @STORY:US-028 priority=P1 status=done mvp=false -->
### US-028: Expanded FAQ Schema (P1)

As a search engine, I want FAQ schema on relevant pages beyond pricing so that FAQ rich results appear for more queries.

**Independent Test**: About page, Contact page, and FAQ blog posts include FAQPage schema.
<!-- @END:STORY:US-028 -->

<!-- @STORY:US-029 priority=P1 status=done mvp=false -->
### US-029: Key Takeaways & GEO Components (P1)

As a reader and AI assistant, I want key takeaways at the top of blog posts so that I can quickly understand the main points.

**Independent Test**: Blog posts with takeaways show bulleted summary; content is extractable by AI.
<!-- @END:STORY:US-029 -->

<!-- @STORY:US-030 priority=P1 status=done mvp=false -->
### US-030: Topic Hub Pages (P1)

As a user and search engine, I want topic hub pages that aggregate content by topic so that I can explore related content and crawlers can understand topical relationships.

**Independent Test**: `/topics/[topic]` shows aggregated blog posts and UGC posts for topic; includes CollectionPage schema.
<!-- @END:STORY:US-030 -->

<!-- @STORY:US-031 priority=P1 status=done mvp=false -->
### US-031: Popular Posts Widget (P1)

As a user, I want to see popular posts in the sidebar so that I can discover trending content.

**Independent Test**: Sidebar shows "Bài viết phổ biến" section with 5 posts sorted by views/engagement.
<!-- @END:STORY:US-031 -->

<!-- @STORY:US-032 priority=P1 status=done mvp=false -->
### US-032: Breadcrumbs on All New Pages (P1)

As a user and search engine, I want breadcrumb navigation on all content pages so that I can understand site hierarchy.

**Independent Test**: Blog pages, topic pages, About/Contact pages all have breadcrumbs with BreadcrumbList schema.
<!-- @END:STORY:US-032 -->

<!-- @STORY:US-033 priority=P2 status=done mvp=false -->
### US-033: next/image Migration (P2)

As a user, I want optimized images throughout the site so that pages load faster and use less bandwidth.

**Independent Test**: No raw `<img>` tags in RelatedPosts or ImageUploader; all images use next/image with width/height.
<!-- @END:STORY:US-033 -->

<!-- @STORY:US-034 priority=P2 status=done mvp=false -->
### US-034: Hreflang Tags (P2)

As a search engine, I want hreflang tags indicating Vietnamese language so that I can properly index the site for Vietnamese users.

**Independent Test**: All pages include `<link rel="alternate" hreflang="vi" href="...">` and `<link rel="alternate" hreflang="x-default" href="...">`.
<!-- @END:STORY:US-034 -->

<!-- @STORY:US-035 priority=P2 status=done mvp=false -->
### US-035: INP Optimization (P2)

As a user, I want fast interactions so that the site feels responsive.

**Independent Test**: Lighthouse INP ≤ 200ms on mobile; no long tasks > 50ms during interactions.
<!-- @END:STORY:US-035 -->

<!-- @STORY:US-036 priority=P2 status=done mvp=false -->
### US-036: Reading Progress Bar (P2)

As a reader, I want a reading progress indicator on blog posts so that I know how much content remains.

**Independent Test**: Blog detail page shows progress bar at top that fills as user scrolls; disappears on non-blog pages.
<!-- @END:STORY:US-036 -->

<!-- @STORY:US-037 priority=P2 status=done mvp=false -->
### US-037: Enhanced Related Content (P2)

As a user, I want cross-linked related content between blog posts and UGC posts so that I can discover more relevant content.

**Independent Test**: Blog posts show related UGC posts; UGC posts show related blog articles; links are bidirectional.
<!-- @END:STORY:US-037 -->

<!-- @STORY:US-038 priority=P2 status=pending mvp=false -->
### US-038: Social Share Buttons (P2)

As a user, I want social share buttons on blog posts so that I can easily share content to Facebook, Zalo, and other platforms.

**Independent Test**: Blog detail page shows share buttons; clicking opens share dialog with correct URL and title.
<!-- @END:STORY:US-038 -->

<!-- @END:USER_STORIES -->

<!-- @SECTION:ACCEPTANCE_CRITERIA -->
## Acceptance Criteria

<!-- @CRITERIA_GROUP:crawlability story=US-001,US-002,US-003,US-004 -->
### Phase 1: Crawlability & Indexing (P0)

<!-- @AC:AC-001 status=pending -->
- [ ] **AC-001**: WHEN Googlebot requests the homepage THE SYSTEM SHALL return full HTML with first 10-20 posts content without requiring JavaScript execution.
<!-- @END:AC:AC-001 -->

<!-- @AC:AC-002 status=pending -->
- [ ] **AC-002**: THE SYSTEM SHALL include Organization schema (JSON-LD) on homepage with name, url, logo, sameAs properties.
<!-- @END:AC:AC-002 -->

<!-- @AC:AC-003 status=pending -->
- [ ] **AC-003**: THE SYSTEM SHALL include WebSite schema (JSON-LD) on homepage with SearchAction for sitelinks search box.
<!-- @END:AC:AC-003 -->

<!-- @AC:AC-004 status=pending -->
- [ ] **AC-004**: THE SYSTEM SHALL include meta description (Vietnamese, 150-160 chars) and Open Graph tags on homepage.
<!-- @END:AC:AC-004 -->

<!-- @AC:AC-005 status=pending -->
- [ ] **AC-005**: WHEN a page is draft, pending, settings, or pagination (page 2+) THE SYSTEM SHALL include `<meta name="robots" content="noindex, follow">`.
<!-- @END:AC:AC-005 -->

<!-- @AC:AC-006 status=pending -->
- [ ] **AC-006**: WHEN rendering user-generated links in posts or comments THE SYSTEM SHALL add `rel="ugc"` attribute.
<!-- @END:AC:AC-006 -->

<!-- @AC:AC-007 status=pending -->
- [ ] **AC-007**: WHEN rendering external links THE SYSTEM SHALL add `rel="noopener noreferrer"` attribute.
<!-- @END:AC:AC-007 -->

<!-- @END:CRITERIA_GROUP:crawlability -->

<!-- @CRITERIA_GROUP:ranking story=US-005,US-006,US-007 -->
### Phase 2: Ranking Signals (P1)

<!-- @AC:AC-008 status=pending -->
- [ ] **AC-008**: THE SYSTEM SHALL display breadcrumb navigation with BreadcrumbList schema on profile, post detail, hashtag, and pricing pages.
<!-- @END:AC:AC-008 -->

<!-- @AC:AC-009 status=pending -->
- [ ] **AC-009**: THE SYSTEM SHALL generate alt text for images as "Hình {n} trong bài viết: {post_title}" with optional user override.
<!-- @END:AC:AC-009 -->

<!-- @AC:AC-010 status=pending -->
- [ ] **AC-010**: WHEN displaying post detail page THE SYSTEM SHALL show 3-6 related posts section (SSR) based on shared hashtags, same author, or trending.
<!-- @END:AC:AC-010 -->

<!-- @AC:AC-011 status=pending -->
- [ ] **AC-011**: THE SYSTEM SHALL maintain proper heading hierarchy (H1 > H2 > H3) on all pages with exactly one H1 per page.
<!-- @END:AC:AC-011 -->

<!-- @END:CRITERIA_GROUP:ranking -->

<!-- @CRITERIA_GROUP:performance story=US-008,US-009,US-010 -->
### Phase 3: Performance & Polish (P2)

<!-- @AC:AC-012 status=pending -->
- [ ] **AC-012**: THE SYSTEM SHALL lazy load TipTap editor and ImageUploader components with loading skeletons.
<!-- @END:AC:AC-012 -->

<!-- @AC:AC-013 status=pending -->
- [ ] **AC-013**: THE SYSTEM SHALL add `priority` prop to LCP images (first post image, profile avatar) and `loading="lazy"` to below-fold images.
<!-- @END:AC:AC-013 -->

<!-- @AC:AC-014 status=pending -->
- [ ] **AC-014**: THE SYSTEM SHALL include FAQPage schema (JSON-LD) on pricing page with 5-8 Vietnamese FAQ items.
<!-- @END:AC:AC-014 -->

<!-- @AC:AC-015 status=pending -->
- [ ] **AC-015**: THE SYSTEM SHALL support `?page=N` URL parameter for pagination with `<link rel="next/prev">` meta tags.
<!-- @END:AC:AC-015 -->

<!-- @AC:AC-016 status=pending -->
- [ ] **AC-016**: THE SYSTEM SHALL proxy sitemap requests from frontend domain to backend sitemap endpoints.
<!-- @END:AC:AC-016 -->

<!-- @END:CRITERIA_GROUP:performance -->

<!-- @CRITERIA_GROUP:post_detail_seo story=US-011,US-012,US-013,US-014,US-015 -->
### Phase 4: Post Detail Page Deep SEO (P1)

<!-- @AC:AC-020 status=done -->
- [x] **AC-020**: WHEN a user or crawler visits a post detail page THE SYSTEM SHALL generate keywords meta tag populated from post hashtags.
<!-- @END:AC:AC-020 -->

<!-- @AC:AC-021 status=done -->
- [x] **AC-021**: WHEN a user or crawler visits a post detail page THE SYSTEM SHALL include article:published_time and article:modified_time OG tags with ISO 8601 dates.
<!-- @END:AC:AC-021 -->

<!-- @AC:AC-022 status=done -->
- [x] **AC-022**: WHEN a user or crawler visits a post detail page THE SYSTEM SHALL include article:tag OG tags for each hashtag on the post.
<!-- @END:AC:AC-022 -->

<!-- @AC:AC-023 status=done -->
- [x] **AC-023**: WHEN generating meta description for a post THE SYSTEM SHALL strip HTML and hashtags, truncate at word boundary, with max 150 characters.
<!-- @END:AC:AC-023 -->

<!-- @AC:AC-024 status=done -->
- [x] **AC-024**: WHEN a post has images THE SYSTEM SHALL set Twitter card type to summary_large_image; otherwise THE SYSTEM SHALL set it to summary.
<!-- @END:AC:AC-024 -->

<!-- @AC:AC-025 status=done -->
- [x] **AC-025**: THE SYSTEM SHALL include `inLanguage: "vi"` field in SocialMediaPosting JSON-LD schema.
<!-- @END:AC:AC-025 -->

<!-- @AC:AC-026 status=done -->
- [x] **AC-026**: THE SYSTEM SHALL include `commentCount` from post data in SocialMediaPosting JSON-LD schema.
<!-- @END:AC:AC-026 -->

<!-- @AC:AC-027 status=done -->
- [x] **AC-027**: THE SYSTEM SHALL include `wordCount` calculated from stripped content in SocialMediaPosting JSON-LD schema.
<!-- @END:AC:AC-027 -->

<!-- @AC:AC-028 status=done -->
- [x] **AC-028**: THE SYSTEM SHALL include `keywords` array from post hashtags in SocialMediaPosting JSON-LD schema.
<!-- @END:AC:AC-028 -->

<!-- @AC:AC-029 status=done -->
- [x] **AC-029**: THE SYSTEM SHALL include `isAccessibleForFree: true` in SocialMediaPosting JSON-LD schema.
<!-- @END:AC:AC-029 -->

<!-- @AC:AC-030 status=done -->
- [x] **AC-030**: THE SYSTEM SHALL include `image` as ImageObject array with @type, url, caption in SocialMediaPosting JSON-LD schema.
<!-- @END:AC:AC-030 -->

<!-- @AC:AC-031 status=done -->
- [x] **AC-031**: THE SYSTEM SHALL include author Person schema with `image` (avatar URL) and `description` (bio) in SocialMediaPosting JSON-LD. *(Note: Author image included; bio not available in Post API response - backend limitation)*
<!-- @END:AC:AC-031 -->

<!-- @AC:AC-032 status=done -->
- [x] **AC-032**: WHEN rendering a post detail page THE SYSTEM SHALL calculate reading time as ceil(wordCount / 200) + ceil(imageCount * 12 / 60) minutes.
<!-- @END:AC:AC-032 -->

<!-- @AC:AC-033 status=done -->
- [x] **AC-033**: THE SYSTEM SHALL display reading time in Vietnamese format (e.g., "5 phút đọc").
<!-- @END:AC:AC-033 -->

<!-- @AC:AC-034 status=done -->
- [x] **AC-034**: THE SYSTEM SHALL include `timeRequired` in JSON-LD using ISO 8601 duration format (e.g., PT5M).
<!-- @END:AC:AC-034 -->

<!-- @AC:AC-035 status=done -->
- [x] **AC-035**: WHEN a post has fewer than 50 words THE SYSTEM SHALL hide the reading time display.
<!-- @END:AC:AC-035 -->

<!-- @AC:AC-036 status=done -->
- [x] **AC-036**: WHEN a shared/reposted post is viewed THE SYSTEM SHALL set canonical URL to point to the original post URL.
<!-- @END:AC:AC-036 -->

<!-- @AC:AC-037 status=done -->
- [x] **AC-037**: IF the original post is deleted (sharedPost is null) THEN THE SYSTEM SHALL use self-referencing canonical URL.
<!-- @END:AC:AC-037 -->

<!-- @AC:AC-038 status=done -->
- [x] **AC-038**: THE SYSTEM SHALL ensure OG url matches canonical URL on post detail pages.
<!-- @END:AC:AC-038 -->

<!-- @AC:AC-039 status=done -->
- [x] **AC-039**: THE SYSTEM SHALL use ISR with revalidate = 300 (5 minutes) for post detail pages.
<!-- @END:AC:AC-039 -->

<!-- @END:CRITERIA_GROUP:post_detail_seo -->

<!-- @CRITERIA_GROUP:eeat_foundation story=US-016,US-017,US-018,US-019 -->
### Phase 5: E-E-A-T Foundation Pages (P0)

<!-- @AC:AC-040 status=done -->
- [x] **AC-040**: THE SYSTEM SHALL provide an About page at `/about` with company name, founding year, mission statement, team section, and office location.
<!-- @END:AC:AC-040 -->

<!-- @AC:AC-041 status=done -->
- [x] **AC-041**: THE SYSTEM SHALL include enhanced Organization schema on About page with `foundingDate`, `founders`, `numberOfEmployees`, `address`, and `contactPoint`.
<!-- @END:AC:AC-041 -->

<!-- @AC:AC-042 status=done -->
- [x] **AC-042**: THE SYSTEM SHALL provide a Privacy Policy page at `/privacy` with Vietnamese content covering data collection, usage, cookies, and user rights.
<!-- @END:AC:AC-042 -->

<!-- @AC:AC-043 status=done -->
- [x] **AC-043**: THE SYSTEM SHALL provide a Terms of Service page at `/terms` with Vietnamese content covering user responsibilities, content policies, and disclaimers.
<!-- @END:AC:AC-043 -->

<!-- @AC:AC-044 status=done -->
- [x] **AC-044**: THE SYSTEM SHALL provide a Contact page at `/contact` with email, phone, address, business hours, and contact form.
<!-- @END:AC:AC-044 -->

<!-- @AC:AC-045 status=done -->
- [x] **AC-045**: THE SYSTEM SHALL include ContactPoint schema on Contact page with `telephone`, `email`, `contactType`, and `availableLanguage`.
<!-- @END:AC:AC-045 -->

<!-- @AC:AC-046 status=done -->
- [x] **AC-046**: WHEN rendering the footer THE SYSTEM SHALL link to actual pages: `/about` (Giới thiệu), `/blog` (Blog), `/privacy` (Quyền riêng tư), `/terms` (Điều khoản), `/contact` (Liên hệ).
<!-- @END:AC:AC-046 -->

<!-- @AC:AC-047 status=done -->
- [x] **AC-047**: THE SYSTEM SHALL update Sidebar footer links to match Footer component links.
<!-- @END:AC:AC-047 -->

<!-- @END:CRITERIA_GROUP:eeat_foundation -->

<!-- @CRITERIA_GROUP:blog_system story=US-020,US-021,US-022,US-023 -->
### Phase 6: Blog/Content Hub System (P0)

<!-- @AC:AC-050 status=done -->
- [x] **AC-050**: THE SYSTEM SHALL store blog posts in a `BlogPost` model with fields: id, title, slug, excerpt, content, featuredImage, categoryId, authorId, status, publishedAt, viewCount, readingTime, tableOfContents (JSON), metaTitle, metaDescription, createdAt, updatedAt.
<!-- @END:AC:AC-050 -->

<!-- @AC:AC-051 status=done -->
- [x] **AC-051**: THE SYSTEM SHALL store blog categories in a `BlogCategory` model with fields: id, name, slug, description, parentId (for hierarchy), displayOrder, postCount.
<!-- @END:AC:AC-051 -->

<!-- @AC:AC-052 status=done -->
- [x] **AC-052**: THE SYSTEM SHALL provide GET /api/blog/posts endpoint with pagination, category filter, and status filter.
<!-- @END:AC:AC-052 -->

<!-- @AC:AC-053 status=done -->
- [x] **AC-053**: THE SYSTEM SHALL provide GET /api/blog/posts/:slug endpoint returning single post with author and category.
<!-- @END:AC:AC-053 -->

<!-- @AC:AC-054 status=done -->
- [x] **AC-054**: THE SYSTEM SHALL provide GET /api/blog/categories endpoint returning all active categories with post counts.
<!-- @END:AC:AC-054 -->

<!-- @AC:AC-055 status=done -->
- [x] **AC-055**: WHEN rendering `/blog` THE SYSTEM SHALL display paginated blog posts with SSR, category sidebar, and CollectionPage schema.
<!-- @END:AC:AC-055 -->

<!-- @AC:AC-056 status=done -->
- [x] **AC-056**: WHEN rendering `/blog/[category]/[slug]` THE SYSTEM SHALL display full post content with Article schema (not SocialMediaPosting), author bio section, and ToC for posts > 1000 words.
<!-- @END:AC:AC-056 -->

<!-- @AC:AC-057 status=done -->
- [x] **AC-057**: THE SYSTEM SHALL use ISR with revalidate = 3600 (1 hour) for blog pages.
<!-- @END:AC:AC-057 -->

<!-- @AC:AC-058 status=done -->
- [x] **AC-058**: THE SYSTEM SHALL add blog sitemap (`/sitemap/blog.xml`) to sitemap index.
<!-- @END:AC:AC-058 -->

<!-- @END:CRITERIA_GROUP:blog_system -->

<!-- @CRITERIA_GROUP:author_authority story=US-024,US-025,US-026 -->
### Phase 7: Author Authority Enhancement (P1)

<!-- @AC:AC-060 status=done -->
- [x] **AC-060**: THE SYSTEM SHALL extend Profile model with: jobTitle (string), company (string), expertise (JSON array of strings), credentials (JSON array of {title, issuer, year}), isVerifiedExpert (boolean).
<!-- @END:AC:AC-060 -->

<!-- @AC:AC-061 status=done -->
- [x] **AC-061**: THE SYSTEM SHALL provide profile edit UI for expertise fields with autocomplete for common expertise areas.
<!-- @END:AC:AC-061 -->

<!-- @AC:AC-062 status=done -->
- [x] **AC-062**: WHEN rendering blog post detail THE SYSTEM SHALL display author card with avatar, name, jobTitle, company, bio (truncated), expertise tags, and social links.
<!-- @END:AC:AC-062 -->

<!-- @AC:AC-063 status=done -->
- [x] **AC-063**: THE SYSTEM SHALL include enhanced Person schema in blog posts with: jobTitle, worksFor (Organization), knowsAbout (expertise array), alumniOf (if credentials include education), sameAs (social links).
<!-- @END:AC:AC-063 -->

<!-- @AC:AC-064 status=done -->
- [x] **AC-064**: WHEN rendering profile page THE SYSTEM SHALL show "Bài viết" tab listing author's published blog posts (if any).
<!-- @END:AC:AC-064 -->

<!-- @AC:AC-065 status=done -->
- [x] **AC-065**: THE SYSTEM SHALL include author bio in SocialMediaPosting JSON-LD for UGC posts (fix existing gap).
<!-- @END:AC:AC-065 -->

<!-- @END:CRITERIA_GROUP:author_authority -->

<!-- @CRITERIA_GROUP:structured_data_geo story=US-027,US-028,US-029 -->
### Phase 8: Advanced Structured Data & GEO (P1)

<!-- @AC:AC-070 status=done -->
- [x] **AC-070**: THE SYSTEM SHALL provide HowToSchema component that generates HowTo JSON-LD with name, description, totalTime, estimatedCost, supply, tool, and step array.
<!-- @END:AC:AC-070 -->

<!-- @AC:AC-071 status=done -->
- [x] **AC-071**: WHEN a blog post has `postType: 'tutorial'` and contains step markers THE SYSTEM SHALL include HowTo schema.
<!-- @END:AC:AC-071 -->

<!-- @AC:AC-072 status=done -->
- [x] **AC-072**: THE SYSTEM SHALL include FAQPage schema on About page (company FAQs) and Contact page (support FAQs).
<!-- @END:AC:AC-072 -->

<!-- @AC:AC-073 status=done -->
- [x] **AC-073**: THE SYSTEM SHALL provide KeyTakeaways component that renders bulleted summary with semantic HTML (`<aside>` with `role="note"`).
<!-- @END:AC:AC-073 -->

<!-- @AC:AC-074 status=done -->
- [x] **AC-074**: WHEN a blog post has `takeaways` field THE SYSTEM SHALL render KeyTakeaways at the top of content.
<!-- @END:AC:AC-074 -->

<!-- @AC:AC-075 status=done -->
- [x] **AC-075**: THE SYSTEM SHALL provide ComparisonTable component for blog posts with `<table>` semantic markup and caption.
<!-- @END:AC:AC-075 -->

<!-- @END:CRITERIA_GROUP:structured_data_geo -->

<!-- @CRITERIA_GROUP:internal_linking story=US-030,US-031,US-032 -->
### Phase 9: Internal Linking Enhancement (P1)

<!-- @AC:AC-080 status=done -->
- [x] **AC-080**: THE SYSTEM SHALL provide topic hub pages at `/topics/[topic]` aggregating blog posts and UGC posts tagged with the topic.
<!-- @END:AC:AC-080 -->

<!-- @AC:AC-081 status=done -->
- [x] **AC-081**: THE SYSTEM SHALL include CollectionPage schema on topic hub pages with itemListElement.
<!-- @END:AC:AC-081 -->

<!-- @AC:AC-082 status=done -->
- [x] **AC-082**: THE SYSTEM SHALL display "Bài viết phổ biến" widget in RightSidebar showing top 5 posts by engagement.
<!-- @END:AC:AC-082 -->

<!-- @AC:AC-083 status=done -->
- [x] **AC-083**: THE SYSTEM SHALL add breadcrumbs to blog list (Home > Blog), blog detail (Home > Blog > Category > Title), About (Home > Giới thiệu), Contact (Home > Liên hệ), topic hubs (Home > Chủ đề > Topic).
<!-- @END:AC:AC-083 -->

<!-- @AC:AC-084 status=done -->
- [x] **AC-084**: WHEN rendering blog post editor (admin) THE SYSTEM SHALL suggest internal links based on content keywords.
<!-- @END:AC:AC-084 -->

<!-- @END:CRITERIA_GROUP:internal_linking -->

<!-- @CRITERIA_GROUP:technical_seo story=US-033,US-034,US-035 -->
### Phase 10: Technical SEO Polish (P2)

<!-- @AC:AC-090 status=done -->
- [x] **AC-090**: THE SYSTEM SHALL replace `<img>` tags in RelatedPosts.tsx with next/image, including width, height, and alt props.
<!-- @END:AC:AC-090 -->

<!-- @AC:AC-091 status=done -->
- [x] **AC-091**: THE SYSTEM SHALL replace `<img>` tags in ImageUploader.tsx with next/image for preview images.
<!-- @END:AC:AC-091 -->

<!-- @AC:AC-092 status=done -->
- [x] **AC-092**: THE SYSTEM SHALL include hreflang tags in root layout: `vi` for Vietnamese and `x-default` for fallback.
<!-- @END:AC:AC-092 -->

<!-- @AC:AC-093 status=done -->
- [x] **AC-093**: THE SYSTEM SHALL audit and optimize event handlers using useTransition for non-urgent updates.
<!-- @END:AC:AC-093 -->

<!-- @AC:AC-094 status=done -->
- [x] **AC-094**: THE SYSTEM SHALL add explicit width/height to all images missing dimensions.
<!-- @END:AC:AC-094 -->

<!-- @AC:AC-095 status=done -->
- [x] **AC-095**: THE SYSTEM SHALL update robots.txt to include new sitemaps and disallow admin routes.
<!-- @END:AC:AC-095 -->

<!-- @END:CRITERIA_GROUP:technical_seo -->

<!-- @CRITERIA_GROUP:engagement story=US-036,US-037,US-038 -->
### Phase 11: Searcher Engagement Features (P2)

<!-- @AC:AC-100 status=done -->
- [x] **AC-100**: THE SYSTEM SHALL display a reading progress bar at the top of blog detail pages that fills as the user scrolls through content.
<!-- @END:AC:AC-100 -->

<!-- @AC:AC-101 status=done -->
- [x] **AC-101**: THE SYSTEM SHALL show related blog articles on UGC post detail pages and related UGC posts on blog detail pages for cross-content discovery.
<!-- @END:AC:AC-101 -->

<!-- @AC:AC-102 status=done -->
- [x] **AC-102**: THE SYSTEM SHALL display social share buttons (Facebook, Zalo, Twitter/X, Copy Link) on blog detail pages.
<!-- @END:AC:AC-102 -->

<!-- @AC:AC-103 status=done -->
- [x] **AC-103**: THE SYSTEM SHALL display estimated reading time on blog list cards and blog detail pages.
<!-- @END:AC:AC-103 -->

<!-- @AC:AC-104 status=done -->
- [x] **AC-104**: THE SYSTEM SHALL provide a "Scroll to Top" button that appears after scrolling 500px on blog detail pages.
<!-- @END:AC:AC-104 -->

<!-- @AC:AC-105 status=done -->
- [x] **AC-105**: THE SYSTEM SHALL track and display view count on blog posts for social proof.
<!-- @END:AC:AC-105 -->

<!-- @END:CRITERIA_GROUP:engagement -->

<!-- @END:ACCEPTANCE_CRITERIA -->

<!-- @SECTION:SUCCESS_METRICS -->
## Success Metrics

| Metric | Current | Phase 1-4 Target | Phase 5-11 Target |
|--------|---------|------------------|-------------------|
| Lighthouse SEO Score | ~85 | 95+ | 98+ |
| Core Web Vitals LCP | ~3.5s | ≤ 2.5s | ≤ 2.0s |
| Core Web Vitals INP | ~250ms | ≤ 200ms | ≤ 150ms |
| Core Web Vitals CLS | ~0.15 | ≤ 0.1 | ≤ 0.05 |
| Pages Indexed | ~70% | 95%+ | 98%+ |
| Rich Results | 2 types | 5+ types | 7+ types |
| Initial Bundle Size | baseline | -30% | -40% |
| E-E-A-T Pages | 0 | N/A | 4+ (About, Privacy, Terms, Contact) |
| Blog Articles | 0 | N/A | Content hub with categories |
| Topical Authority | None | N/A | 5+ topic hub pages |
| Backlink-ready Pages | 0 | N/A | Blog + E-E-A-T pages |
<!-- @END:SUCCESS_METRICS -->

<!-- @SECTION:ASSUMPTIONS -->
## Assumptions (Auto-inferred)

| Decision | Chosen | Reasoning | Alternatives |
|----------|--------|-----------|--------------|
| SSR caching | Redis 60s TTL | Balance freshness vs TTFB, matches existing pattern | No cache, longer TTL |
| Related posts count | 3-6 posts | Industry standard, good UX without overwhelming | 2-4, 5-10 |
| Alt text format | Vietnamese auto-generated | Target market is Vietnam, consistent format | English, user-only |
| Link processing | Render-time | Allows policy changes without migration | Storage-time |
| Pagination noindex | Page 2+ noindexed | Prevent duplicate content, focus crawl budget | Index all pages |
| Blog storage | Separate BlogPost model | Clean separation from UGC, editorial-specific fields | Extend Post model |
| E-E-A-T pages | Static hardcoded | Fastest load, simplest maintenance, rarely changes | CMS-driven |
| Author expertise | Extend Profile model | Reuse existing model, add new fields | Separate AuthorProfile |
| Blog ISR | 1 hour revalidation | Balance freshness vs cache efficiency for editorial | 5min, 24hr |

> These assumptions were made based on codebase patterns and SEO best practices.
<!-- @END:ASSUMPTIONS -->

<!-- @SECTION:OUT_OF_SCOPE -->
## Out of Scope

- AMP pages - not needed for social platform
- Video SEO - no video content currently
- News sitemap - not a news site
- Mobile app deep linking - separate feature
- Blog admin CMS UI - seed via database/API initially
- Multi-language content - Vietnamese only for now
<!-- @END:OUT_OF_SCOPE -->

<!-- @SECTION:CONTEXT -->
## Context

### Existing Implementations (DO NOT duplicate)
- Sitemap generation: `Backend/src/modules/seo/services/sitemap.service.ts`
- Robots.txt: `Frontend/public/robots.txt`
- Post JSON-LD: `Frontend/src/app/(main)/profile/[username]/[postId]/page.tsx:103-145`
- Profile JSON-LD: `Frontend/src/app/(main)/profile/[username]/page.tsx:63-90`
- Pricing meta: `Frontend/src/app/(public)/bang-gia/page.tsx:4-14`
- TipTap editor: `Frontend/src/components/editor/RichTextEditor.tsx`
- Image upload: `Frontend/src/app/admin/ads/page.tsx:100-134`

### Key Files to Modify
- Homepage: `Frontend/src/app/(main)/page.tsx` (currently "use client")
- Root layout: `Frontend/src/app/layout.tsx`
- Post rendering: `Frontend/src/features/posts/components/PostCard.tsx`
<!-- @END:CONTEXT -->

