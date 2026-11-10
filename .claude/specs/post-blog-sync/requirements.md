---
spec_version: "1.0"
feature: "post-blog-sync"
level: 2
status: "active"
created: "2026-02-11"
updated: "2026-02-11"
tags: ["blog", "sync", "admin", "automation"]
---

<!-- @SECTION:OVERVIEW -->
# Post-to-Blog Auto-Sync

Automatically sync Posts created by Admin/Super_Admin users to BlogPost entries, enabling admin content to appear in both social feed and SEO-optimized blog.
<!-- @END:OVERVIEW -->

<!-- @SECTION:USER_STORIES -->
## User Stories

<!-- @STORY:US-001 priority=P1 status=done mvp=true -->
### US-001: Auto-create BlogPost on Admin Post Creation (P1) 🎯 MVP

As an Admin/Super_Admin, I want my Posts to automatically create corresponding BlogPosts so that my content appears in both the social feed and the blog.

**Independent Test**: Create a Post as Admin → verify BlogPost created with mapped fields
<!-- @END:STORY:US-001 -->

<!-- @STORY:US-002 priority=P1 status=done mvp=true -->
### US-002: Auto-update BlogPost on Admin Post Update (P1) 🎯 MVP

As an Admin/Super_Admin, I want my Post updates to automatically update the corresponding BlogPost so that content stays synchronized.

**Independent Test**: Update a Post as Admin → verify corresponding BlogPost updated
<!-- @END:STORY:US-002 -->

<!-- @STORY:US-003 priority=P1 status=done mvp=true -->
### US-003: Archive BlogPost on Admin Post Delete (P1) 🎯 MVP

As an Admin/Super_Admin, I want my deleted Posts to archive (soft delete) the corresponding BlogPost so that blog content is preserved but hidden.

**Independent Test**: Delete a Post as Admin → verify BlogPost status changed to ARCHIVED
<!-- @END:STORY:US-003 -->

<!-- @STORY:US-004 priority=P1 status=done mvp=true -->
### US-004: No Sync for Regular Users (P1) 🎯 MVP

As a system, I want to ensure regular User posts do NOT trigger blog sync so that only admin content appears in the blog.

**Independent Test**: Create/update/delete Post as regular User → verify no BlogPost changes
<!-- @END:STORY:US-004 -->

<!-- @STORY:US-005 priority=P2 status=done mvp=false -->
### US-005: Status Mapping (P2)

As an Admin, I want Post status changes to reflect in BlogPost status so that draft/published states stay synchronized.

**Independent Test**: Change Post status to PUBLISHED → verify BlogPost status is PUBLISHED
<!-- @END:STORY:US-005 -->
<!-- @END:USER_STORIES -->

<!-- @SECTION:ACCEPTANCE_CRITERIA -->
## Acceptance Criteria

<!-- @CRITERIA_GROUP:create_sync story=US-001 -->
### Create Sync

<!-- @AC:AC-001 status=done -->
- [x] **AC-001**: WHEN an Admin/Super_Admin creates a Post, THE SYSTEM SHALL create a BlogPost with: title (first line or first 100 chars stripped of hashtags), content (direct copy), excerpt (first 300 chars stripped of HTML/markdown), featuredImage (first image URL), tags (from hashtags as JSON string array), status mapped, readingTime calculated
<!-- @END:AC:AC-001 -->

<!-- @AC:AC-002 status=done -->
- [x] **AC-002**: WHEN a BlogPost is created from sync, THE SYSTEM SHALL set sourcePostId to the original Post.id
<!-- @END:AC:AC-002 -->

<!-- @AC:AC-003 status=done -->
- [x] **AC-003**: WHEN a BlogPost is created from sync, THE SYSTEM SHALL assign the default "Bài viết cộng đồng" category
<!-- @END:AC:AC-003 -->

<!-- @AC:AC-004 status=done -->
- [x] **AC-004**: WHEN a BlogPost is created from sync, THE SYSTEM SHALL generate a globally unique slug from the title
<!-- @END:AC:AC-004 -->
<!-- @END:CRITERIA_GROUP:create_sync -->

<!-- @CRITERIA_GROUP:update_sync story=US-002 -->
### Update Sync

<!-- @AC:AC-005 status=done -->
- [x] **AC-005**: WHEN an Admin/Super_Admin updates a Post, THE SYSTEM SHALL update the corresponding BlogPost matched by sourcePostId
<!-- @END:AC:AC-005 -->

<!-- @AC:AC-012 status=done -->
- [x] **AC-012**: WHEN an Admin/Super_Admin submits a draft Post (status changes from DRAFT), THE SYSTEM SHALL update the corresponding BlogPost status accordingly
<!-- @END:AC:AC-012 -->
<!-- @END:CRITERIA_GROUP:update_sync -->

<!-- @CRITERIA_GROUP:delete_sync story=US-003 -->
### Delete Sync

<!-- @AC:AC-006 status=done -->
- [x] **AC-006**: WHEN an Admin/Super_Admin deletes a Post, THE SYSTEM SHALL set the corresponding BlogPost status to ARCHIVED
<!-- @END:AC:AC-006 -->
<!-- @END:CRITERIA_GROUP:delete_sync -->

<!-- @CRITERIA_GROUP:user_restriction story=US-004 -->
### User Restriction

<!-- @AC:AC-007 status=done -->
- [x] **AC-007**: WHEN a regular User (role=USER) creates/updates/deletes a Post, THE SYSTEM SHALL NOT trigger any BlogPost sync
<!-- @END:AC:AC-007 -->
<!-- @END:CRITERIA_GROUP:user_restriction -->

<!-- @CRITERIA_GROUP:status_mapping story=US-005 -->
### Status Mapping

<!-- @AC:AC-008 status=done -->
- [x] **AC-008**: WHEN Post status is DRAFT or PENDING, THE SYSTEM SHALL set BlogPost status to DRAFT
<!-- @END:AC:AC-008 -->

<!-- @AC:AC-009 status=done -->
- [x] **AC-009**: WHEN Post status is PUBLISHED or APPROVED, THE SYSTEM SHALL set BlogPost status to PUBLISHED
<!-- @END:AC:AC-009 -->

<!-- @AC:AC-010 status=done -->
- [x] **AC-010**: WHEN Post status is REJECTED, THE SYSTEM SHALL NOT create a BlogPost (or archive existing)
<!-- @END:AC:AC-010 -->
<!-- @END:CRITERIA_GROUP:status_mapping -->

<!-- @CRITERIA_GROUP:error_handling story=US-001,US-002,US-003 -->
### Error Handling

<!-- @AC:AC-011 status=done -->
- [x] **AC-011**: IF sync fails, THEN THE SYSTEM SHALL log the error but NOT fail the original Post operation
<!-- @END:AC:AC-011 -->
<!-- @END:CRITERIA_GROUP:error_handling -->
<!-- @END:ACCEPTANCE_CRITERIA -->

<!-- @SECTION:ASSUMPTIONS -->
## Assumptions (Auto-inferred)

| Decision | Chosen | Reasoning | Alternatives |
|----------|--------|-----------|--------------|
| Sync direction | One-way (Post → Blog) | Simpler implementation, blog is derivative content | Two-way sync |
| Default category | "Bài viết cộng đồng" | Vietnamese for "Community posts", clear labeling | Per-admin categories |
| Slug uniqueness | Global (not per-author) | BlogPost.slug is already globally unique in schema | Per-author unique |
| Error handling | Log and continue | Post operation is primary, sync is secondary | Fail both, retry queue |
| Transaction | Separate | Post succeeds independently of sync | Single transaction |
<!-- @END:ASSUMPTIONS -->

<!-- @SECTION:OUT_OF_SCOPE -->
## Out of Scope

- Reverse sync (BlogPost → Post)
- Manual blog post creation for non-admin users
- Bulk sync of existing posts
- Admin UI for managing sync settings
- Webhook/event-based sync (using direct service injection instead)
<!-- @END:OUT_OF_SCOPE -->

<!-- @SECTION:IMPLEMENTATION_NOTES -->
## Implementation Notes

**Status**: Completed
**Date**: 2026-02-11
**Files Modified**:
- `Backend/prisma/schema.prisma` - Added sourcePostId field and relation
- `Backend/src/modules/blog/services/blog.service.ts` - Added sync methods (createFromPost, updateFromPost, archiveBySourcePostId, findBySourcePostId)
- `Backend/src/modules/posts/services/posts.service.ts` - Added sync logic in create/update/delete methods
- `Backend/src/modules/posts/posts.module.ts` - Imported BlogModule for DI
- `Backend/src/modules/posts/controllers/posts.controller.ts` - Updated delete method to pass Role instead of boolean

**Code Review**: PASSED
- Race condition in getOrCreateDefaultCategory fixed with upsert pattern
- Type safety improved (Role enum instead of boolean isAdmin)
- All field mappings implemented as specified

**Validation**: 11/11 criteria passed
- AC-001: BlogPost creation with all mapped fields ✓
- AC-002: sourcePostId linking ✓
- AC-003: Default category assignment ✓
- AC-004: Unique slug generation ✓
- AC-005: Update sync by sourcePostId ✓
- AC-006: Archive on delete ✓
- AC-007: No sync for regular users ✓
- AC-008: DRAFT/PENDING → DRAFT mapping ✓
- AC-009: PUBLISHED/APPROVED → PUBLISHED mapping ✓
- AC-010: REJECTED handling ✓
- AC-011: Error handling without failing Post operations ✓

**Deviations**: None
**Limitations**: None
<!-- @END:IMPLEMENTATION_NOTES -->

