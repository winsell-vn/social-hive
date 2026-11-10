---
spec_version: "1.0"
feature: "seo-optimization"
type: "plan"
level: 3
status: "pending"
priority: "P0-P2"
effort: "5-6 weeks"
risks: "3 HIGH, 5 MEDIUM"
created: "2026-02-09"
---

# Implementation Plan: Comprehensive SEO Improvement (Phase 5-11)

## Requirements Summary

Extend the existing SEO optimization spec (Phase 1-4 complete, 55 tasks done) with 7 new phases targeting Top 1 Google ranking in Vietnam's web design/programming niche. Addresses critical gaps: missing E-E-A-T foundation pages, no blog/content hub, weak internal linking, missing technical SEO elements, no GEO optimization, limited searcher engagement.

**Functional Requirements**:
- [ ] Create E-E-A-T foundation pages (About, Privacy, Terms, Contact)
- [ ] Build blog/content hub system with editorial content support
- [ ] Enhance author authority with credentials and expertise fields
- [ ] Implement advanced structured data (Article, HowTo, expanded FAQ)
- [ ] Fix internal linking (footer placeholders, topic hubs, contextual links)
- [ ] Polish technical SEO (next/image migration, hreflang, INP optimization)
- [ ] Add searcher engagement features (ToC, reading progress, enhanced suggestions)

**Non-Functional Requirements**:
- Performance: Maintain CWV (LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1)
- SEO: 95+ Lighthouse SEO score, 7+ rich result types
- Scalability: Blog system supports 1000+ articles with ISR

## Design Decisions

### Decision 1: Blog Content Storage → Separate BlogPost/BlogCategory Models
- Clean separation of UGC vs editorial content
- Editorial-specific fields (category, isOfficial, featuredImage, excerpt, tableOfContents)
- No risk of breaking existing UGC functionality
- Rejected: Extend Post model (pollutes UGC), Use tags (insufficient for editorial)

### Decision 2: E-E-A-T Pages → Static Pages with Hardcoded Content
- Fastest load times, simplest maintenance
- Full SEO control, no CMS overhead
- Content changes rarely, code deploy acceptable

### Decision 3: Author Expertise → Extend Existing Profile Model
- Profile already has `bio` and `socialLinks`
- Add: jobTitle, company, expertise (JSON), credentials (JSON), isVerifiedExpert
- No separate AuthorProfile table needed

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Database migration breaks production | HIGH | Shadow database, staging test, rollback migration |
| Blog system impacts existing post performance | HIGH | Separate queries, dedicated indexes, Redis cache |
| SEO ranking temporarily drops during migration | HIGH | Incremental changes, monitor Search Console daily |
| Footer link changes break navigation | MEDIUM | Incremental rollout, test all links |
| next/image migration causes CLS regression | MEDIUM | Explicit width/height, placeholder="blur" |
| ISR cache invalidation issues | MEDIUM | On-demand revalidation API, monitor cache hit rates |
| INP optimization breaks interactivity | MEDIUM | Measure before/after with Web Vitals, React Profiler |
| Author expertise fields unused by users | LOW | Optional fields, guidance in UI, seed with team profiles |

## Red Flags Found

| Issue | Location | Impact | Fix Phase |
|-------|----------|--------|-----------|
| Footer links ALL `href="#"` | `Footer.tsx:23-79` | Broken internal linking, wasted crawl budget | Phase 5 |
| RelatedPosts uses raw `<img>` | `RelatedPosts.tsx:91-96` | No image optimization, slower LCP | Phase 10 |
| ImageUploader uses raw `<img>` | `ImageUploader.tsx:102-105` | No optimization for previews | Phase 10 |
| No About/Privacy/Terms pages | Routes return 404 | E-E-A-T signals missing | Phase 5 |
| Sidebar links to non-existent pages | `Sidebar.tsx:135-154` | 404 errors | Phase 5 |
| Author bio NOT in post JSON-LD | `[postId]/page.tsx` | Missing E-E-A-T signal | Phase 7 |
| No hreflang tags | `layout.tsx` | Missing language signal for VN market | Phase 10 |

## Anti-Patterns Detected

| Anti-Pattern | Location | Recommendation |
|--------------|----------|----------------|
| Placeholder links (`href="#"`) | Footer.tsx | Replace with actual routes or remove |
| Mixed image components | RelatedPosts, ImageUploader | Standardize on next/image |
| Missing error boundaries | Blog pages (new) | Add error boundaries for graceful degradation |

## Architecture Impact

| Component | Change Type | Key Files |
|-----------|-------------|-----------|
| Database Schema | Modify | `Backend/prisma/schema.prisma` |
| Blog Module | New | `Backend/src/modules/blog/*` |
| Blog Routes | New | `Frontend/src/app/(public)/blog/*` |
| E-E-A-T Pages | New | `Frontend/src/app/(public)/about/*`, `/privacy/*`, `/terms/*`, `/contact/*` |
| Footer | Modify | `Frontend/src/features/landing/components/Footer.tsx` |
| Sidebar | Modify | `Frontend/src/components/layout/Sidebar.tsx` |
| RelatedPosts | Modify | `Frontend/src/features/posts/components/RelatedPosts.tsx` |
| ImageUploader | Modify | `Frontend/src/components/upload/ImageUploader.tsx` |
| Profile Schema | Modify | `Backend/prisma/schema.prisma` (Profile model) |
| SEO Components | New | `Frontend/src/components/seo/ArticleSchema.tsx`, `HowToSchema.tsx`, `TableOfContents.tsx` |
| Sitemap Service | Modify | `Backend/src/modules/seo/services/sitemap.service.ts` |
| Topic Hub Pages | New | `Frontend/src/app/(public)/topics/[topic]/page.tsx` |
| Root Layout | Modify | `Frontend/src/app/layout.tsx` |

**Patterns to Follow**:
- Server Components for SEO pages: See `Frontend/src/app/(public)/bang-gia/page.tsx`
- JSON-LD structured data: See `Frontend/src/components/seo/FAQSchema.tsx`
- ISR configuration: See `Frontend/src/app/(main)/profile/[username]/[postId]/page.tsx`
- API module structure: See `Backend/src/modules/pricing/*`

## Implementation Timeline

```
Tuần 1:  ████████ Phase 5 (E-E-A-T Foundation Pages)     [P0 - KHẨN CẤP]
Tuần 2:  ████████████████ Phase 6 (Blog/Content Hub)     [P0 - KHẨN CẤP]
Tuần 3:  ████████████████ Phase 6 + Phase 7 (Author)     [P0/P1]
Tuần 4:  ████████████████ Phase 8 (GEO) + Phase 9 (Links)[P1]
Tuần 5:  ████████████████ Phase 10 + Phase 11             [P2]
Tuần 6:  ████████ Phase 11 (hoàn thiện) + Testing         [P2]
```

## Phase Summary

| Phase | Name | Priority | Week | Stories | ACs | Dependencies |
|-------|------|----------|------|---------|-----|--------------|
| 5 | E-E-A-T Foundation Pages | P0 | 1 | US-016→019 | AC-040→047 | None |
| 6 | Blog/Content Hub System | P0 | 2-3 | US-020→023 | AC-050→058 | Phase 5 |
| 7 | Author Authority Enhancement | P1 | 3 | US-024→026 | AC-060→065 | Phase 6 |
| 8 | Advanced Structured Data & GEO | P1 | 4 | US-027→029 | AC-070→075 | Phase 6 |
| 9 | Internal Linking Enhancement | P1 | 4 | US-030→032 | AC-080→084 | Phase 5, 6 |
| 10 | Technical SEO Polish | P2 | 5 | US-033→035 | AC-090→095 | None (parallel) |
| 11 | Searcher Engagement Features | P2 | 5-6 | US-036→038 | AC-100→105 | Phase 6 |

