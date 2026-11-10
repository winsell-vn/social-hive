---
spec_version: "1.0"
feature: "ads-promoted-posts"
level: 2
status: "active"
created: "2026-02-11"
updated: "2026-02-11"
tags: ["ads", "monetization", "admin", "frontend", "backend"]
synced_from: "Backend/src/modules/ads/services/ads.service.ts"
---

<!-- @SECTION:OVERVIEW -->
# Ads/Promoted Posts

A complete advertising system that allows administrators to create, manage, and display sponsored content throughout the platform. Ads can be displayed as promoted posts in the main feed or as sidebar cards, with customizable CTA buttons and rich content.

**Inferred from**: Backend ads module, frontend ad components, and homepage feed integration
<!-- @END:OVERVIEW -->

<!-- @SECTION:USER_STORIES -->
## User Stories

<!-- @STORY:US-001 priority=P1 status=done mvp=true -->
### US-001: Admin Creates Ads with Rich Content (P1) 🎯 MVP

As an administrator, I want to create ads with rich text descriptions, images, and custom CTA buttons so that I can promote content effectively across the platform.

**Independent Test**: Admin logs in, navigates to ads management, creates ad with title, TipTap description, image, and CTA link
**Inferred from**: `Frontend/src/app/admin/ads/page.tsx:57-269`, `Backend/src/modules/ads/services/ads.service.ts:27-47`
<!-- @END:STORY:US-001 -->

<!-- @STORY:US-002 priority=P1 status=done mvp=true -->
### US-002: Public Views Ads in Feed and Sidebar (P1) 🎯 MVP

As a user, I want to see relevant ads interleaved in my feed and sidebar so that I can discover promoted content without disrupting my browsing experience.

**Independent Test**: Visit homepage, scroll feed to see promoted posts every 4 posts, check sidebar for ad cards
**Inferred from**: `Frontend/src/app/(main)/NewsfeedClient.tsx:27-50`, `Frontend/src/features/ads/components/PromotedPostCard.tsx`, `Frontend/src/features/ads/components/SidebarAdCard.tsx`
<!-- @END:STORY:US-002 -->

<!-- @STORY:US-003 priority=P1 status=done mvp=true -->
### US-003: Admin Manages Ad Lifecycle (P1) 🎯 MVP

As an administrator, I want to edit, toggle status, and delete ads so that I can maintain control over active advertising campaigns.

**Independent Test**: Admin edits existing ad, toggles active/inactive status, deletes ad with confirmation
**Inferred from**: `Backend/src/modules/ads/services/ads.service.ts:120-199`, `Frontend/src/app/admin/ads/page.tsx:271-288`
<!-- @END:STORY:US-003 -->

<!-- @STORY:US-004 priority=P2 status=done -->
### US-004: Advanced Image Upload Options (P2)

As an administrator, I want multiple ways to upload ad images (drag-drop, paste, click-to-upload, URL) so that I can quickly add visuals to my ads.

**Independent Test**: Create ad, test drag-drop image, paste image with Ctrl+V, click upload button, enter image URL
**Inferred from**: `Frontend/src/app/admin/ads/page.tsx:109-216`
<!-- @END:STORY:US-004 -->

<!-- @STORY:US-005 priority=P2 status=done -->
### US-005: Ad Placement and Priority Control (P2)

As an administrator, I want to control where ads appear (feed, sidebar, both) and set priority levels so that I can optimize ad visibility and placement strategy.

**Independent Test**: Create ad with placement=SIDEBAR, set priority=10, verify it appears in sidebar with higher priority
**Inferred from**: `Backend/prisma/schema.prisma:617-619`, `Backend/src/modules/ads/services/ads.service.ts:65-66`
<!-- @END:STORY:US-005 -->

<!-- @STORY:US-006 priority=P2 status=done -->
### US-006: Automatic R2 Image Cleanup (P2)

As a system, I want to automatically delete old ad images from R2 storage when ads are updated or deleted so that storage costs are minimized.

**Independent Test**: Update ad with new image, verify old image is deleted from R2; delete ad, verify image is cleaned up
**Inferred from**: `Backend/src/modules/ads/services/ads.service.ts:128-136`, `Backend/src/modules/ads/services/ads.service.ts:160-173`
<!-- @END:STORY:US-006 -->

<!-- @STORY:US-007 priority=P3 status=done -->
### US-007: Character Count with Warnings (P3)

As an administrator, I want to see character count with visual warnings when creating ad descriptions so that I stay within content limits.

**Independent Test**: Type in ad description editor, observe character count 450-499 shows warning, 500+ shows error and disables submit
**Inferred from**: `Frontend/src/app/admin/ads/page.tsx:80-84`, `Frontend/src/app/admin/ads/page.tsx:459-466`
<!-- @END:STORY:US-007 -->

<!-- @END:USER_STORIES -->

<!-- @SECTION:ACCEPTANCE_CRITERIA -->
## Acceptance Criteria

<!-- @CRITERIA_GROUP:ad_creation story=US-001 -->
### Ad Creation

<!-- @AC:AC-001 status=done -->
- [x] **AC-001**: WHEN admin submits ad creation form with title and CTA link, THE SYSTEM SHALL create new ad record in database
<!-- @END:AC:AC-001 -->

<!-- @AC:AC-002 status=done -->
- [x] **AC-002**: WHEN admin creates ad, THE SYSTEM SHALL support TipTap rich text editor for description field
<!-- @END:AC:AC-002 -->

<!-- @AC:AC-003 status=done -->
- [x] **AC-003**: WHEN admin creates ad without specifying ctaText, THE SYSTEM SHALL default to "Tìm hiểu thêm"
<!-- @END:AC:AC-003 -->

<!-- @AC:AC-004 status=done -->
- [x] **AC-004**: WHEN admin creates ad without specifying placement, THE SYSTEM SHALL default to FEED placement
<!-- @END:AC:AC-004 -->

<!-- @AC:AC-005 status=done -->
- [x] **AC-005**: WHEN admin creates ad without specifying isActive, THE SYSTEM SHALL default to true (active)
<!-- @END:AC:AC-005 -->

<!-- @AC:AC-006 status=done -->
- [x] **AC-006**: WHEN admin creates ad, THE SYSTEM SHALL invalidate Redis cache for ads:active, ads:feed, ads:sidebar
<!-- @END:AC:AC-006 -->

<!-- @END:CRITERIA_GROUP:ad_creation -->

<!-- @CRITERIA_GROUP:ad_display story=US-002 -->
### Ad Display

<!-- @AC:AC-007 status=done -->
- [x] **AC-007**: WHEN user views homepage feed, THE SYSTEM SHALL interleave promoted posts every 4 regular posts
<!-- @END:AC:AC-007 -->

<!-- @AC:AC-008 status=done -->
- [x] **AC-008**: WHEN displaying ads in feed, THE SYSTEM SHALL use PromotedPostCard component with "Quảng cáo" badge
<!-- @END:AC:AC-008 -->

<!-- @AC:AC-009 status=done -->
- [x] **AC-009**: WHEN displaying ads in sidebar, THE SYSTEM SHALL use SidebarAdCard component with compact layout
<!-- @END:AC:AC-009 -->

<!-- @AC:AC-010 status=done -->
- [x] **AC-010**: WHEN user clicks ad CTA button, THE SYSTEM SHALL open ctaLink in new tab with noopener,noreferrer
<!-- @END:AC:AC-010 -->

<!-- @AC:AC-011 status=done -->
- [x] **AC-011**: WHEN fetching public ads, THE SYSTEM SHALL cache results in Redis for 300 seconds (5 minutes)
<!-- @END:AC:AC-011 -->

<!-- @AC:AC-012 status=done -->
- [x] **AC-012**: WHEN fetching ads by placement, THE SYSTEM SHALL return ads with matching placement OR placement=BOTH
<!-- @END:AC:AC-012 -->

<!-- @AC:AC-013 status=done -->
- [x] **AC-013**: WHEN displaying ads, THE SYSTEM SHALL order by priority DESC, then createdAt DESC
<!-- @END:AC:AC-013 -->

<!-- @END:CRITERIA_GROUP:ad_display -->

<!-- @CRITERIA_GROUP:ad_management story=US-003 -->
### Ad Management

<!-- @AC:AC-014 status=done -->
- [x] **AC-014**: WHEN admin updates ad, THE SYSTEM SHALL update ad record and invalidate cache
<!-- @END:AC:AC-014 -->

<!-- @AC:AC-015 status=done -->
- [x] **AC-015**: WHEN admin toggles ad status, THE SYSTEM SHALL flip isActive boolean and invalidate cache
<!-- @END:AC:AC-015 -->

<!-- @AC:AC-016 status=done -->
- [x] **AC-016**: WHEN admin deletes ad, THE SYSTEM SHALL remove database record and invalidate cache
<!-- @END:AC:AC-016 -->

<!-- @AC:AC-017 status=done -->
- [x] **AC-017**: WHEN admin requests ad list, THE SYSTEM SHALL support pagination with page and limit parameters
<!-- @END:AC:AC-017 -->

<!-- @AC:AC-018 status=done -->
- [x] **AC-018**: WHEN admin filters ads, THE SYSTEM SHALL support filtering by placement and isActive status
<!-- @END:AC:AC-018 -->

<!-- @AC:AC-019 status=done -->
- [x] **AC-019**: IF ad does not exist, THEN THE SYSTEM SHALL throw NotFoundException with message "Quảng cáo không tồn tại"
<!-- @END:AC:AC-019 -->

<!-- @END:CRITERIA_GROUP:ad_management -->

<!-- @CRITERIA_GROUP:image_upload story=US-004 -->
### Image Upload

<!-- @AC:AC-020 status=done -->
- [x] **AC-020**: WHEN admin drags image file over drop zone, THE SYSTEM SHALL show visual feedback with border highlight
<!-- @END:AC:AC-020 -->

<!-- @AC:AC-021 status=done -->
- [x] **AC-021**: WHEN admin drops image file, THE SYSTEM SHALL upload to /upload/image endpoint and set imageUrl
<!-- @END:AC:AC-021 -->

<!-- @AC:AC-022 status=done -->
- [x] **AC-022**: WHEN admin pastes image with Ctrl+V outside editor, THE SYSTEM SHALL upload image and set imageUrl
<!-- @END:AC:AC-022 -->

<!-- @AC:AC-023 status=done -->
- [x] **AC-023**: WHEN admin clicks upload button, THE SYSTEM SHALL open file picker for image selection
<!-- @END:AC:AC-023 -->

<!-- @AC:AC-024 status=done -->
- [x] **AC-024**: WHEN admin enters image URL manually, THE SYSTEM SHALL accept URL in imageUrl field
<!-- @END:AC:AC-024 -->

<!-- @AC:AC-025 status=done -->
- [x] **AC-025**: IF uploaded file is not JPG/PNG/GIF/WebP, THEN THE SYSTEM SHALL show error "Chỉ hỗ trợ JPG, PNG, GIF, WebP"
<!-- @END:AC:AC-025 -->

<!-- @AC:AC-026 status=done -->
- [x] **AC-026**: IF uploaded file exceeds 5MB, THEN THE SYSTEM SHALL show error "Ảnh không được vượt quá 5MB"
<!-- @END:AC:AC-026 -->

<!-- @AC:AC-027 status=done -->
- [x] **AC-027**: WHILE image is uploading, THE SYSTEM SHALL display loading spinner and disable form submission
<!-- @END:AC:AC-027 -->

<!-- @END:CRITERIA_GROUP:image_upload -->

<!-- @CRITERIA_GROUP:r2_cleanup story=US-006 -->
### R2 Image Cleanup

<!-- @AC:AC-028 status=done -->
- [x] **AC-028**: WHEN admin updates ad with new imageUrl, THE SYSTEM SHALL extract key from old imageUrl and delete from R2
<!-- @END:AC:AC-028 -->

<!-- @AC:AC-029 status=done -->
- [x] **AC-029**: WHEN admin deletes ad with imageUrl, THE SYSTEM SHALL delete database record first, then cleanup R2 image
<!-- @END:AC:AC-029 -->

<!-- @AC:AC-030 status=done -->
- [x] **AC-030**: WHEN R2 cleanup fails, THE SYSTEM SHALL log error but not block the operation (fire-and-forget)
<!-- @END:AC:AC-030 -->

<!-- @END:CRITERIA_GROUP:r2_cleanup -->

<!-- @CRITERIA_GROUP:placement_priority story=US-005 -->
### Placement and Priority

<!-- @AC:AC-031 status=done -->
- [x] **AC-031**: WHEN admin sets placement to FEED, THE SYSTEM SHALL display ad only in homepage feed
<!-- @END:AC:AC-031 -->

<!-- @AC:AC-032 status=done -->
- [x] **AC-032**: WHEN admin sets placement to SIDEBAR, THE SYSTEM SHALL display ad only in sidebar
<!-- @END:AC:AC-032 -->

<!-- @AC:AC-033 status=done -->
- [x] **AC-033**: WHEN admin sets placement to BOTH, THE SYSTEM SHALL display ad in both feed and sidebar
<!-- @END:AC:AC-033 -->

<!-- @AC:AC-034 status=done -->
- [x] **AC-034**: WHEN multiple ads exist, THE SYSTEM SHALL display higher priority ads first
<!-- @END:AC:AC-034 -->

<!-- @AC:AC-035 status=done -->
- [x] **AC-035**: WHEN ads have same priority, THE SYSTEM SHALL display newer ads first (createdAt DESC)
<!-- @END:AC:AC-035 -->

<!-- @END:CRITERIA_GROUP:placement_priority -->

<!-- @CRITERIA_GROUP:character_limits story=US-007 -->
### Character Limits and Validation

<!-- @AC:AC-036 status=done -->
- [x] **AC-036**: WHEN admin types in description editor, THE SYSTEM SHALL display character count in real-time
<!-- @END:AC:AC-036 -->

<!-- @AC:AC-037 status=done -->
- [x] **AC-037**: WHEN description reaches 450-499 characters, THE SYSTEM SHALL show yellow warning color
<!-- @END:AC:AC-037 -->

<!-- @AC:AC-038 status=done -->
- [x] **AC-038**: WHEN description reaches 500+ characters, THE SYSTEM SHALL show red error and disable submit button
<!-- @END:AC:AC-038 -->

<!-- @AC:AC-039 status=done -->
- [x] **AC-039**: WHEN admin submits form without title, THE SYSTEM SHALL show error "Vui lòng nhập tiêu đề quảng cáo"
<!-- @END:AC:AC-039 -->

<!-- @AC:AC-040 status=done -->
- [x] **AC-040**: WHEN admin submits form without ctaLink, THE SYSTEM SHALL show error "Vui lòng nhập đường dẫn CTA"
<!-- @END:AC:AC-040 -->

<!-- @AC:AC-041 status=done -->
- [x] **AC-041**: THE SYSTEM SHALL enforce title max length of 100 characters
<!-- @END:AC:AC-041 -->

<!-- @AC:AC-042 status=done -->
- [x] **AC-042**: THE SYSTEM SHALL enforce description max length of 500 characters
<!-- @END:AC:AC-042 -->

<!-- @AC:AC-043 status=done -->
- [x] **AC-043**: THE SYSTEM SHALL enforce ctaText max length of 20 characters
<!-- @END:AC:AC-043 -->

<!-- @END:CRITERIA_GROUP:character_limits -->

<!-- @CRITERIA_GROUP:security story=US-003 -->
### Security and Authorization

<!-- @AC:AC-044 status=done -->
- [x] **AC-044**: WHEN non-admin user attempts to create ad, THE SYSTEM SHALL return 403 Forbidden
<!-- @END:AC:AC-044 -->

<!-- @AC:AC-045 status=done -->
- [x] **AC-045**: WHEN non-admin user attempts to update ad, THE SYSTEM SHALL return 403 Forbidden
<!-- @END:AC:AC-045 -->

<!-- @AC:AC-046 status=done -->
- [x] **AC-046**: WHEN non-admin user attempts to delete ad, THE SYSTEM SHALL return 403 Forbidden
<!-- @END:AC:AC-046 -->

<!-- @AC:AC-047 status=done -->
- [x] **AC-047**: WHEN non-admin user attempts to toggle ad status, THE SYSTEM SHALL return 403 Forbidden
<!-- @END:AC:AC-047 -->

<!-- @AC:AC-048 status=done -->
- [x] **AC-048**: WHEN non-admin user attempts to list all ads, THE SYSTEM SHALL return 403 Forbidden
<!-- @END:AC:AC-048 -->

<!-- @AC:AC-049 status=done -->
- [x] **AC-049**: WHEN any user (including guests) requests public ads, THE SYSTEM SHALL return active ads without authentication
<!-- @END:AC:AC-049 -->

<!-- @END:CRITERIA_GROUP:security -->

<!-- @END:ACCEPTANCE_CRITERIA -->

<!-- @SECTION:IMPLEMENTATION_NOTES -->
## Implementation Notes

**Status**: Synced from existing implementation on 2026-02-11

**Key Implementation Details**:
- Backend uses NestJS with Prisma ORM for database operations
- Frontend uses Next.js 14 with React Query for data fetching
- Redis caching with 5-minute TTL for public ad queries
- R2 storage cleanup uses fire-and-forget pattern with retry logic
- TipTap editor for rich text ad descriptions
- Ads interleaved every 4 posts in feed using client-side logic
- Admin-only routes protected by JwtAuthGuard + RolesGuard

**Recent Changes**:
- R2 image cleanup on ad update/delete (recently added per sync debt notes)

<!-- @END:IMPLEMENTATION_NOTES -->

