# Compact: SEO Audit & Content Strategy for chungtoixayweb.vn

> Checkpoint: 2026-02-13

## Summary

The user requested a comprehensive SEO keyword research, content strategy, and blog publishing plan for their web design agency (chungtoixayweb.vn). The goal is to achieve Google Top 1 ranking in the Vietnamese web design industry through a 35-article/7-day blog content plan.

Phase 1: Deep research was conducted across multiple dimensions — competitor analysis (canhcam.vn, mona.media, gobranding.com.vn, etc.), primary/long-tail keyword research, topic cluster strategy, backlink strategy, and on-page SEO guidelines. All findings were compiled into `audit_for_seo.md` (initially 341 lines, incomplete).

Phase 2: The audit file was reviewed and completed — fixing the truncated Day 5 (posts #23-25), adding Day 6 (#26-30) and Day 7 (#31-35), plus 5 new sections (Phần 7-11): Blog Categories, Publishing Schedule, KPIs, Implementation Checklist, and Content Distribution Summary. File grew from 341 to 525 lines.

Phase 3: A deep-dive review was conducted comparing the audit against real-world competitor strategies, Google's 2025-2026 ranking factors, and industry best practices. This identified 10 critical gaps in the current audit that must be addressed to realistically achieve Top 1 ranking.

## Q&A

**Q**: Research keywords, strategy, compile into audit_for_seo.md, plan 35 articles/7 days for web design industry
**A**: Conducted exhaustive multi-source research. Created audit_for_seo.md with 11 sections covering competitor analysis, keyword research (primary, long-tail, service-specific), topic cluster strategy (5 pillars), backlink strategy, on-page SEO checklist, 35-article content plan, blog categories, publishing schedule, KPIs, implementation checklist, and content distribution summary.

**Q**: Read and check the audit file, fix and improve it
**A**: Found file was incomplete (cut off at line 341 mid-Day 5). Completed Day 5-7, added Phần 7-11. File now 525 lines, verified complete with all 35 posts properly planned.

**Q**: Continue research, compare with audit, find improvement areas needed for Top 1
**A**: Identified 10 critical gaps through deep research against real competitors and Google 2025-2026 algorithms:
1. **Missing E-E-A-T strategy** (no author profiles, case studies, trust signals)
2. **Missing AI Overviews/AEO strategy** (zero-click search optimization, featured snippets)
3. **Missing Local SEO** (no Google Business Profile, no location keywords)
4. **Content types lack diversity** (0 FAQ posts, 0 case studies, 0 listicles)
5. **Topical authority insufficient depth** (needs entity mapping, semantic interlinking)
6. **Backlink strategy too generic** (no outreach templates, no specific targets/KPIs)
7. **Content velocity unrealistic** (5 posts/day for 7 days risks quality issues)
8. **Missing Programmatic SEO** (service pages by industry × city)
9. **Missing content repurposing/distribution** (social media, syndication, community)
10. **Keyword research lacks depth** (only 5/28 service groups covered, no PAA keywords, no local keywords)

## Files Changed

- `audit_for_seo.md` - Created and completed: 525-line SEO audit with 11 sections covering full content strategy, keyword research, 35-article plan across 7 days, KPIs, and implementation checklist

## Reference Files

- `audit_for_seo.md` - The main SEO audit and content strategy document (525 lines, 11 sections)
- `bang-gia.md` - Company pricing for all 28 service categories (used to identify keyword gaps)
- `Backend/prisma/schema.prisma` - BlogPost/BlogCategory models, BlogPostType enum (ARTICLE, TUTORIAL, COMPARISON, FAQ)
- `Frontend/src/app/(public)/blog/page.tsx` - Blog listing page
- `Frontend/src/app/(public)/blog/[category]/[slug]/page.tsx` - Blog post detail with schema markup

## Timeline

1. User requested SEO research and content strategy for web design industry
2. Conducted multi-source research: competitors, keywords, topic clusters, backlinks, on-page SEO
3. Created audit_for_seo.md with initial content (341 lines, incomplete)
4. User asked to review and fix the audit file
5. Completed the file: fixed Day 5, added Days 6-7, added Phần 7-11 (now 525 lines)
6. User asked for deeper research to compare audit against reality and find gaps
7. Conducted deep research on E-E-A-T, AI Overviews, Local SEO, topical authority, competitor strategies
8. Identified 10 critical gaps with prioritized action items (P0/P1/P2)
9. **Next step**: User needs to decide whether to update audit_for_seo.md with all gap fixes or focus on specific priorities first

---
**Original request**: "Research keywords, content strategy for web design industry, compile into audit_for_seo.md, plan 35 articles/7 days to achieve Google Top 1 ranking"

---
**To resume**: `continue from previous conversation @specs/seo-audit-content-strategy/compact.md`

