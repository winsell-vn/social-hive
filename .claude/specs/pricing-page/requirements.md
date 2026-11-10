---
spec_version: "1.0"
feature: "pricing-page"
level: 2
status: "implemented"
created: "2026-02-07"
updated: "2026-02-22"
implemented: "2026-02-07"
tags: ["pricing", "marketing", "admin", "quote", "seo", "image-export"]
synced_from: "Backend/prisma/schema.prisma, Backend/src/modules/pricing/dto/create-quote.dto.ts, Frontend/src/features/pricing/components/PricingCard.tsx, Frontend/src/features/pricing/constants/icons.ts"
---

<!-- @SECTION:OVERVIEW -->
# Pricing Page (Bảng Giá)

Build a comprehensive pricing page for chungtoixayweb.vn that displays services (Website, Zalo Mini App, Mobile App, Custom Tools) with pricing tiers, helps low-tech users understand and choose appropriate services, includes an admin panel for configuration, and features an interactive quote builder for custom pricing with SEO optimization.
<!-- @END:OVERVIEW -->

<!-- @SECTION:USER_STORIES -->
## User Stories

<!-- @STORY:US-001 priority=P1 status=done mvp=true -->
### US-001: View Pricing Page (P1) 🎯 MVP

As a visitor, I want to access /bang-gia and see all active services with their pricing tiers so that I can understand available services and pricing.

**Independent Test**: Navigate to /bang-gia, verify all active services display with pricing cards.
<!-- @END:STORY:US-001 -->

<!-- @STORY:US-002 priority=P1 status=done mvp=true -->
### US-002: Switch Service Categories (P1) 🎯 MVP

As a visitor, I want to click on service tabs (Website, Zalo Mini App, etc.) so that I can focus on services I'm interested in.

**Independent Test**: Click each service tab, verify pricing tiers update accordingly.
<!-- @END:STORY:US-002 -->

<!-- @STORY:US-003 priority=P1 status=done mvp=true -->
### US-003: Compare Pricing Tiers (P1) 🎯 MVP

As a visitor, I want to view a feature comparison table so that I can compare what's included in each tier.

**Independent Test**: View comparison table, verify all tiers show with feature checkmarks/X marks.
<!-- @END:STORY:US-003 -->

<!-- @STORY:US-004 priority=P2 status=done mvp=false -->
### US-004: Use Quote Builder (P2)

As a visitor, I want to use a step-by-step wizard with real-time price calculation so that I can estimate costs based on my specific needs.

**Independent Test**: Complete all 4 wizard steps, verify price updates in real-time.
<!-- @END:STORY:US-004 -->

<!-- @STORY:US-005 priority=P2 status=done mvp=false -->
### US-005: Submit Quote Request (P2)

As a visitor, I want to submit a quote request so that the sales team can follow up with me.

**Independent Test**: Submit quote form, verify success message and admin notification.
<!-- @END:STORY:US-005 -->

<!-- @STORY:US-006 priority=P1 status=done mvp=true -->
### US-006: Admin Manage Services (P1) 🎯 MVP

As an admin, I want to perform CRUD operations on services at /admin/pricing so that I can configure available services.

**Independent Test**: Create, edit, delete, reorder services - verify changes reflect on public page.
<!-- @END:STORY:US-006 -->

<!-- @STORY:US-007 priority=P1 status=done mvp=true -->
### US-007: Admin Manage Pricing Tiers (P1) 🎯 MVP

As an admin, I want to perform CRUD operations on pricing tiers at /admin/pricing/tiers so that I can configure pricing for each service.

**Independent Test**: Create tier with features, edit price, toggle badges - verify on public page.
<!-- @END:STORY:US-007 -->

<!-- @STORY:US-008 priority=P2 status=done mvp=false -->
### US-008: Admin Manage FAQs (P2)

As an admin, I want to perform CRUD operations on FAQ items at /admin/pricing/faqs so that I can manage common questions.

**Independent Test**: Create FAQ, reorder, toggle active - verify on public page.
<!-- @END:STORY:US-008 -->

<!-- @STORY:US-009 priority=P2 status=done mvp=false -->
### US-009: Admin Manage Quote Requests (P2)

As an admin, I want to view and manage quote requests at /admin/pricing/quotes so that I can track and respond to leads.

**Independent Test**: View quotes list, update status, add notes, export CSV.
<!-- @END:STORY:US-009 -->

<!-- @STORY:US-010 priority=P2 status=done mvp=false -->
### US-010: Pricing Image Export (P2)

As a potential customer, I want to export selected service pricing as a beautiful image, so that I can share it with my team or save it for reference.

**Independent Test**: Open export dialog on Step 1, select services, generate PNG image, verify download with correct Vietnamese text and styling.
<!-- @END:STORY:US-010 -->

<!-- @END:USER_STORIES -->

<!-- @SECTION:ACCEPTANCE_CRITERIA -->
## Acceptance Criteria

<!-- @CRITERIA_GROUP:pricing_display story=US-001,US-002,US-003 -->
### Pricing Page Display

<!-- @AC:AC-001 status=done -->
- [x] **AC-001**: WHEN a visitor accesses /bang-gia, THE SYSTEM SHALL load the page in less than 2 seconds.
<!-- @END:AC:AC-001 -->

<!-- @AC:AC-002 status=done -->
- [x] **AC-002**: WHEN the pricing page loads, THE SYSTEM SHALL display all active services as clickable tabs.
<!-- @END:AC:AC-002 -->

<!-- @AC:AC-003 status=done -->
- [x] **AC-003**: WHEN a visitor clicks a service tab, THE SYSTEM SHALL display 4 pricing tiers (Basic, Standard, Premium, Enterprise) for that service.
<!-- @END:AC:AC-003 -->

<!-- @AC:AC-004 status=done -->
- [x] **AC-004**: THE SYSTEM SHALL display prices in Vietnamese format (e.g., 5.000.000đ).
<!-- @END:AC:AC-004 -->

<!-- @AC:AC-005 status=done -->
- [x] **AC-005**: THE SYSTEM SHALL display trust signals (500+ khách hàng, 1000+ dự án, 4.9/5 đánh giá).
<!-- @END:AC:AC-005 -->

<!-- @AC:AC-006 status=done -->
- [x] **AC-006**: THE SYSTEM SHALL be fully responsive on mobile devices.
<!-- @END:AC:AC-006 -->

<!-- @END:CRITERIA_GROUP:pricing_display -->

<!-- @CRITERIA_GROUP:pricing_cards story=US-001 -->
### Pricing Cards

<!-- @AC:AC-007 status=done -->
- [x] **AC-007**: WHEN displaying a pricing card, THE SYSTEM SHALL show tier name, price, billing type, features list, and CTA button.
<!-- @END:AC:AC-007 -->

<!-- @AC:AC-008 status=done -->
- [x] **AC-008**: WHERE a tier is marked as popular, THE SYSTEM SHALL display a "Phổ biến nhất" badge.
<!-- @END:AC:AC-008 -->

<!-- @AC:AC-009 status=done -->
- [x] **AC-009**: WHERE a tier is marked as recommended, THE SYSTEM SHALL display a "Được đề xuất" badge.
<!-- @END:AC:AC-009 -->

<!-- @AC:AC-010 status=done -->
- [x] **AC-010**: WHEN a visitor hovers over a pricing card, THE SYSTEM SHALL display hover effects.
<!-- @END:AC:AC-010 -->

<!-- @END:CRITERIA_GROUP:pricing_cards -->

<!-- @CRITERIA_GROUP:feature_comparison story=US-003 -->
### Feature Comparison Table

<!-- @AC:AC-011 status=done -->
- [x] **AC-011**: THE SYSTEM SHALL display a side-by-side comparison of all tiers with checkmarks for included features and X marks for excluded features.
<!-- @END:AC:AC-011 -->

<!-- @AC:AC-012 status=done -->
- [x] **AC-012**: THE SYSTEM SHALL display the Feature Comparison section as always fully expanded with no toggle or "show more" button.
<!-- @END:AC:AC-012 -->

<!-- @AC:AC-013 status=done -->
- [x] **AC-013**: THE SYSTEM SHALL render the Feature Comparison table in a responsive layout without horizontal scroll wrapper.
<!-- @END:AC:AC-013 -->

<!-- @END:CRITERIA_GROUP:feature_comparison -->

<!-- @CRITERIA_GROUP:quote_builder story=US-004,US-005 -->
### Quote Builder

<!-- @AC:AC-014 status=pass -->
- [x] **AC-014**: WHEN a visitor uses the quote builder, THE SYSTEM SHALL provide a 4-step wizard: Service → Requirements → Budget/Timeline → Contact.
<!-- @END:AC:AC-014 -->

<!-- @AC:AC-015 status=pass -->
- [x] **AC-015**: WHILE completing the wizard, THE SYSTEM SHALL display real-time price estimation.
<!-- @END:AC:AC-015 -->

<!-- @AC:AC-016 status=pass -->
- [x] **AC-016**: THE SYSTEM SHALL display a progress indicator and Back/Next navigation.
<!-- @END:AC:AC-016 -->

<!-- @AC:AC-017 status=done -->
- [x] **AC-017**: THE SYSTEM SHALL validate form inputs using Zod schemas.
<!-- @END:AC:AC-017 -->

<!-- @END:CRITERIA_GROUP:quote_builder -->

<!-- @CRITERIA_GROUP:quote_submission story=US-005 -->
### Quote Form Submission

<!-- @AC:AC-018 status=partial -->
- [~] **AC-018**: WHEN submitting a quote, THE SYSTEM SHALL require name, email, and phone fields.
  - **Note**: Phone field is optional (not required as spec stated) to reduce friction in quote submission.
<!-- @END:AC:AC-018 -->

<!-- @AC:AC-019 status=done -->
- [x] **AC-019**: THE SYSTEM SHALL accept optional fields: company, service, tier, budget, timeline, requirements.
<!-- @END:AC:AC-019 -->

<!-- @AC:AC-020 status=done -->
- [x] **AC-020**: THE SYSTEM SHALL enforce rate limiting of 5 requests per IP per hour.
<!-- @END:AC:AC-020 -->

<!-- @AC:AC-021 status=done -->
- [x] **AC-021**: WHEN a quote is submitted successfully, THE SYSTEM SHALL display a success toast.
<!-- @END:AC:AC-021 -->

<!-- @AC:AC-022 status=done -->
- [x] **AC-022**: IF quote submission fails, THEN THE SYSTEM SHALL display user-friendly error messages.
<!-- @END:AC:AC-022 -->

<!-- @END:CRITERIA_GROUP:quote_submission -->

<!-- @CRITERIA_GROUP:admin_services story=US-006 -->
### Admin Services Management

<!-- @AC:AC-023 status=done -->
- [x] **AC-023**: WHEN an admin accesses /admin/pricing, THE SYSTEM SHALL list all services with status and order.
<!-- @END:AC:AC-023 -->

<!-- @AC:AC-024 status=done -->
- [x] **AC-024**: WHEN creating a service, THE SYSTEM SHALL require name and auto-generate slug, with optional description, icon, and active status.
<!-- @END:AC:AC-024 -->

<!-- @AC:AC-025 status=done -->
- [x] **AC-025**: THE SYSTEM SHALL allow inline editing or dialog-based editing of services.
<!-- @END:AC:AC-025 -->

<!-- @AC:AC-026 status=done -->
- [x] **AC-026**: WHEN deleting a service, THE SYSTEM SHALL require confirmation.
<!-- @END:AC:AC-026 -->

<!-- @AC:AC-027 status=pass -->
- [x] **AC-027**: THE SYSTEM SHALL support drag-drop reordering and toggle active status.
<!-- @END:AC:AC-027 -->

<!-- @END:CRITERIA_GROUP:admin_services -->

<!-- @CRITERIA_GROUP:admin_tiers story=US-007 -->
### Admin Pricing Tiers Management

<!-- @AC:AC-028 status=done -->
- [x] **AC-028**: WHEN an admin accesses /admin/pricing/tiers, THE SYSTEM SHALL list tiers grouped by service.
<!-- @END:AC:AC-028 -->

<!-- @AC:AC-029 status=done -->
- [x] **AC-029**: WHEN creating a tier, THE SYSTEM SHALL accept name, price, billing type, features (JSON array), badges, and CTA.
<!-- @END:AC:AC-029 -->

<!-- @AC:AC-030 status=pass -->
- [x] **AC-030**: THE SYSTEM SHALL provide a feature list editor with add/remove/reorder capabilities.
<!-- @END:AC:AC-030 -->

<!-- @AC:AC-031 status=done -->
- [x] **AC-031**: THE SYSTEM SHALL format price input with VND formatting.
<!-- @END:AC:AC-031 -->

<!-- @AC:AC-032 status=done -->
- [x] **AC-032**: THE SYSTEM SHALL allow toggling popular/recommended badges.
<!-- @END:AC:AC-032 -->

<!-- @END:CRITERIA_GROUP:admin_tiers -->

<!-- @CRITERIA_GROUP:admin_faqs story=US-008 -->
### Admin FAQs Management

<!-- @AC:AC-033 status=done -->
- [x] **AC-033**: WHEN an admin accesses /admin/pricing/faqs, THE SYSTEM SHALL list FAQs with order.
<!-- @END:AC:AC-033 -->

<!-- @AC:AC-034 status=pass -->
- [x] **AC-034**: WHEN creating/editing a FAQ, THE SYSTEM SHALL accept question, answer (rich text), category, and active status.
<!-- @END:AC:AC-034 -->

<!-- @AC:AC-035 status=pass -->
- [x] **AC-035**: THE SYSTEM SHALL support drag-drop reordering and toggle active status for FAQs.
<!-- @END:AC:AC-035 -->

<!-- @END:CRITERIA_GROUP:admin_faqs -->

<!-- @CRITERIA_GROUP:admin_quotes story=US-009 -->
### Admin Quote Requests

<!-- @AC:AC-036 status=pass -->
- [x] **AC-036**: WHEN an admin accesses /admin/pricing/quotes, THE SYSTEM SHALL list quotes with filters for status, date range, and service.
<!-- @END:AC:AC-036 -->

<!-- @AC:AC-037 status=done -->
- [x] **AC-037**: THE SYSTEM SHALL support status workflow: PENDING → CONTACTED → QUOTED → NEGOTIATING → ACCEPTED/REJECTED.
  - **Implementation Note**: The QuoteStatus enum includes a 7th status `CANCELLED` beyond the 6 documented statuses, allowing admins to mark quotes as cancelled without rejection. Location: `Backend/prisma/schema.prisma:545`
<!-- @END:AC:AC-037 -->

<!-- @AC:AC-038 status=done -->
- [x] **AC-038**: THE SYSTEM SHALL allow viewing quote details and adding admin notes.
<!-- @END:AC:AC-038 -->

<!-- @AC:AC-039 status=pass -->
- [x] **AC-039**: THE SYSTEM SHALL support exporting quotes to CSV.
<!-- @END:AC:AC-039 -->

<!-- @END:CRITERIA_GROUP:admin_quotes -->

<!-- @CRITERIA_GROUP:seo story=US-001 -->
### SEO Requirements

<!-- @AC:AC-040 status=done -->
- [x] **AC-040**: THE SYSTEM SHALL include JSON-LD schema markup for pricing.
<!-- @END:AC:AC-040 -->

<!-- @AC:AC-041 status=done -->
- [x] **AC-041**: THE SYSTEM SHALL include Vietnamese meta tags (title, description) and Open Graph tags.
<!-- @END:AC:AC-041 -->

<!-- @AC:AC-042 status=pass -->
- [x] **AC-042**: THE SYSTEM SHALL add the page to sitemap with canonical URL.
<!-- @END:AC:AC-042 -->

<!-- @END:CRITERIA_GROUP:seo -->

<!-- @CRITERIA_GROUP:performance -->
### Performance & Caching

<!-- @AC:AC-043 status=done -->
- [x] **AC-043**: THE SYSTEM SHALL cache public pricing data in Redis with 5-minute TTL.
<!-- @END:AC:AC-043 -->

<!-- @AC:AC-044 status=done -->
- [x] **AC-044**: WHEN admin mutations occur, THE SYSTEM SHALL invalidate the pricing cache.
<!-- @END:AC:AC-044 -->

<!-- @AC:AC-045 status=pass -->
- [x] **AC-045**: THE SYSTEM SHALL lazy load below-fold sections and optimize service icons.
<!-- @END:AC:AC-045 -->

<!-- @END:CRITERIA_GROUP:performance -->

<!-- @CRITERIA_GROUP:image_export story=US-010 -->
### Pricing Image Export

<!-- @AC:AC-046 status=done -->
- [x] **AC-046**: WHEN user is on Step 1 (/bang-gia#buoc-1), THEN an "Xuất ảnh bảng giá" (Export Pricing Image) button SHALL be visible.
<!-- @END:AC:AC-046 -->

<!-- @AC:AC-047 status=done -->
- [x] **AC-047**: WHEN user clicks the export button, THEN a dialog SHALL open with categorized service selection.
<!-- @END:AC:AC-047 -->

<!-- @AC:AC-048 status=done -->
- [x] **AC-048**: WHEN dialog opens, THEN services SHALL be organized by categories using Accordion + Checkbox pattern.
<!-- @END:AC:AC-048 -->

<!-- @AC:AC-049 status=done -->
- [x] **AC-049**: WHEN user selects services, THEN the selection count SHALL update in real-time.
<!-- @END:AC:AC-049 -->

<!-- @AC:AC-050 status=done -->
- [x] **AC-050**: WHEN user clicks "Tạo hình ảnh" (Generate Image), THEN a PNG image SHALL be generated with selected services and their pricing tiers.
<!-- @END:AC:AC-050 -->

<!-- @AC:AC-051 status=done -->
- [x] **AC-051**: WHEN image is generated, THEN it SHALL include: company logo text, service names, pricing tiers with prices, tech-styled decorations.
<!-- @END:AC:AC-051 -->

<!-- @AC:AC-052 status=done -->
- [x] **AC-052**: WHEN image is generated, THEN Vietnamese text SHALL render correctly with proper diacritics.
<!-- @END:AC:AC-052 -->

<!-- @AC:AC-053 status=done -->
- [x] **AC-053**: WHEN image generation completes, THEN each selected service SHALL auto-download as a separate PNG with filename format "bang-gia-{service-slug}-{YYYYMMDD}.png" (e.g., "bang-gia-website-doanh-nghiep-20260222.png").
<!-- @END:AC:AC-053 -->

<!-- @AC:AC-054 status=done -->
- [x] **AC-054**: WHEN image is being generated, THEN a loading indicator SHALL be shown.
<!-- @END:AC:AC-054 -->

<!-- @AC:AC-055 status=done -->
- [x] **AC-055**: IF image generation fails, THEN an error message SHALL be displayed to the user.
<!-- @END:AC:AC-055 -->

<!-- @AC:AC-056 status=done -->
- [x] **AC-056**: WHEN user selects more than 8 services, THEN a warning SHALL be shown about potential image size.
<!-- @END:AC:AC-056 -->

<!-- @AC:AC-057 status=done -->
- [x] **AC-057**: WHEN dialog is open, THEN keyboard navigation SHALL work (Tab, Enter, Escape).
<!-- @END:AC:AC-057 -->

<!-- @END:CRITERIA_GROUP:image_export -->

<!-- @END:ACCEPTANCE_CRITERIA -->

<!-- @SECTION:ASSUMPTIONS -->
## Assumptions (Auto-inferred)

| Decision | Chosen | Reasoning | Alternatives |
|----------|--------|-----------|--------------|
| Number of tiers per service | 4 (Basic, Standard, Premium, Enterprise) | Industry standard for SaaS pricing | 3 tiers, 5 tiers |
| Cache TTL | 5 minutes | Balance freshness vs performance | 1 min, 15 min |
| Rate limit for quotes | 5/hour/IP | Prevent spam while allowing legitimate users | 3/hour, 10/hour |
| Quote status workflow | 6 statuses + CANCELLED | Comprehensive sales pipeline tracking with cancellation support | Simple 3-status |
| Price storage | Decimal(15,0) VND | No decimals needed for VND | Float, Integer |
| Feature storage | JSON array in LongText | Flexible, easy to edit | Separate table |
| Image export library | html-to-image | Client-side, no server dependency, good font support | html2canvas, dom-to-image |
| Export image width | 1200px fixed | Optimal for sharing on social media and presentations | 800px, 1600px |
| Max services warning | 8 services | Balance image readability vs user flexibility | 5, 10 services |
| Feature exclusion syntax | "!" prefix | Simple, intuitive syntax for marking excluded features | Separate field, negative flag |
| Icon mapping | Lucide icon names | Dynamic mapping enables flexible icon selection without code changes | Hardcoded components |
| Source tracking | Optional field | Analytics on quote submission channels without requiring user input | Separate analytics table |
| Service categories | ServiceCategory model | Groups services in wizard UI for better organization | Flat service list |

> These assumptions were made based on industry standards and Vietnamese market practices.
<!-- @END:ASSUMPTIONS -->

<!-- @SECTION:OUT_OF_SCOPE -->
## Out of Scope

- Payment integration (quotes only, no online payment)
- Multi-currency support (VND only)
- A/B testing for pricing pages
- Discount codes or promotional pricing
- Subscription management
- Invoice generation
- CRM integration (manual follow-up only)
- Multi-language support (Vietnamese only)
<!-- @END:OUT_OF_SCOPE -->

<!-- @SECTION:IMPLEMENTATION_NOTES -->
## Implementation Notes

### Completed: 2026-02-07

**Status**: Fully Implemented

**Files Created**:
- Backend: 17 files in `Backend/src/modules/pricing/`
- Frontend: 24 files in `Frontend/src/features/pricing/` and `Frontend/src/app/`

**Design Decisions**:
1. **Phone Field Optional**: Made phone optional to reduce friction in quote submission (AC-018 remains partial by design).

**Recently Completed Features**:
- 4-step Quote Builder wizard with real-time price estimation (AC-014, AC-015, AC-016) - 2026-02-07
- CSV export for quotes (AC-039) - 2026-02-07
- Date range filter for quotes (AC-036) - 2026-02-07
- Drag-drop reordering for services, tiers, and FAQs (AC-027, AC-030, AC-035) - 2026-02-07
- Rich text editor for FAQs (AC-034) - 2026-02-07
- Lazy loading and icon optimization (AC-045) - 2026-02-07
- Sitemap integration (AC-042) - 2026-02-07
- Feature Comparison always fully expanded (AC-012, AC-013) - 2026-02-07
- Pricing Image Export feature (AC-046 through AC-057) - 2026-02-22

**API Endpoints Implemented**:
- Public: GET /pricing/public, GET /pricing/public/faqs, POST /pricing/quotes/submit
- Admin: Full CRUD for services, tiers, FAQs, quotes
- Reorder: PATCH /services/reorder, PATCH /faqs/reorder

**Cache Strategy**:
- Redis caching with 5-minute TTL
- Cache invalidation on all admin mutations

**Undocumented Features Discovered**:

1. **CANCELLED Status (AC-037 Extension)**: QuoteStatus enum includes a 7th status `CANCELLED` beyond the 6 documented statuses (PENDING, CONTACTED, QUOTED, NEGOTIATING, ACCEPTED, REJECTED). This allows admins to mark quotes as cancelled without rejection.
   - Implementation: `Backend/prisma/schema.prisma:545`

2. **Source Field Tracking**: Quote requests include an optional `source` field to track origin (e.g., "pricing-page-wizard", "direct-form"). This enables analytics on quote submission channels without requiring user input.
   - Implementation: `Backend/src/modules/pricing/dto/create-quote.dto.ts:38-40`
   - Data Model: `Backend/prisma/schema.prisma:151` (QuoteRequest.source)

3. **Feature Exclusion Syntax**: Features prefixed with "!" are displayed as excluded (with X mark instead of checkmark) in pricing cards and comparison tables. This allows showing what's NOT included in lower tiers.
   - Example: `"!Advanced Analytics"` displays with X mark
   - Implementation: `Frontend/src/features/pricing/components/PricingCard.tsx:72-73`
   - Also used in: `Frontend/src/features/pricing/components/ComparisonTable.tsx`

4. **Icon Mapping System**: Services use Lucide icon names (globe, message-square, smartphone, wrench) that are dynamically mapped to React components via a centralized ICON_MAP constant, enabling flexible icon selection without code changes.
   - Implementation: `Frontend/src/features/pricing/constants/icons.ts`
   - Used in: `Frontend/src/features/pricing/components/ServiceTabs.tsx`

5. **ServiceCategory Model**: Additional Prisma model for grouping services in the wizard UI, providing better organization and navigation.
   - Implementation: `Backend/prisma/schema.prisma:550-564`
   - Enables categorized service selection in quote wizard and image export dialog

6. **Quote Summary Box**: Step 3 of the quote wizard displays a summary box showing all previous selections (service, requirements, budget, timeline) before final submission, improving user confidence.
   - Implementation: `Frontend/src/features/pricing/components/QuoteWizard.tsx`

7. **Reorder Endpoints**: Dedicated PATCH endpoints for drag-drop persistence (`/services/reorder`, `/faqs/reorder`) separate from standard update endpoints, enabling atomic reordering operations.
   - Implementation: `Backend/src/modules/pricing/pricing.controller.ts`

8. **SortableItem Component**: Reusable drag-drop component at `Frontend/src/features/pricing/components/SortableItem.tsx` used across services, tiers, and FAQs for consistent UX.

8. **Feature Comparison Always Expanded (2026-02-07)**: The Feature Comparison section in Step 3 of the quote wizard is always fully visible with no toggle button or "show more" functionality. This UI change improves transparency by ensuring users always see the complete feature comparison table without requiring interaction.
   - Removed: Toggle button, horizontal scroll wrapper, expansion state management
   - Implementation: `Frontend/src/features/pricing/components/FeatureComparison.tsx` (simple table, no state), `Frontend/src/features/pricing/components/wizard/Step3Tier.tsx:130-135` (unconditional render)

9. **Pricing Image Export (2026-02-22)**: Users can export selected service pricing as a PNG image with branded styling. The feature includes:
   - Dialog-based service selection with accordion categories
   - State machine pattern: 'selecting' | 'generating' | 'ready' | 'error'
   - Preview panel showing generated image before download
   - Filename format: `bang-gia-chungtoixayweb-{timestamp}.png` (includes company name for brand recognition)
   - Button text: "Xuất ảnh bảng giá" (more descriptive than original spec)
   - ExportTierCard simplified to inline TierItem component within PricingImageCanvas.tsx
   - Implementation: `Frontend/src/features/pricing/components/export/` (PricingImageExportDialog.tsx, PricingImageCanvas.tsx, ServiceSelector.tsx)
   - Dependencies: html-to-image@1.11.13, Inter font (Vietnamese support), pixelRatio: 2 for retina quality
   - Canvas positioned off-screen for rendering, Radix Dialog handles focus trap and keyboard navigation

**Code Quality Fixes (2026-02-22)**:
- QuoteSummary.tsx: Removed unused `Trash2` import (component uses `X` icon)
- WizardNavigation.tsx: Fixed duplicate responsive text - desktop="Tiếp tục", mobile="Tiếp" (was showing identical text)
- QuoteForm.tsx: Replaced `catch (error: any)` with proper `isAxiosError` type guard

**Limitations**:
- None
<!-- @END:IMPLEMENTATION_NOTES -->
