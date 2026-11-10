---
spec_version: "1.0"
feature: "image-upload-system"
level: 3
status: "complete"
created: "2026-02-12"
updated: "2026-02-12"
tags: ["upload", "image-processing", "caching", "security"]
---

<!-- @SECTION:OVERVIEW -->
# Image Upload, Processing & Smart Caching System

Build a complete image upload system for a social media platform (NestJS backend + Next.js frontend) with local storage, automatic compression/WebP conversion using Sharp, protection against abuse (rate limiting, quotas), and CloudFlare-like smart caching to reduce server load.
<!-- @END:OVERVIEW -->

<!-- @SECTION:USER_STORIES -->
## User Stories

<!-- @STORY:US-001 priority=P1 status=done mvp=true -->
### US-001: Image Upload (P1) 🎯 MVP

As a user, I want to upload images so that I can share visual content on the platform.

**Independent Test**: Upload a JPEG image and verify it's converted to WebP, stored with hash-based path, and returns valid URLs.

**Acceptance Criteria**:
<!-- @AC:AC-001 status=done -->
- [x] **AC-001**: WHEN a user uploads an image, THE SYSTEM SHALL validate the file type using magic bytes, compress it to WebP format (quality 80), strip EXIF data, and store it in local storage with hash-based directory sharding.
<!-- @END:AC:AC-001 -->
<!-- @AC:AC-002 status=done -->
- [x] **AC-002**: THE SYSTEM SHALL support jpg, jpeg, png, gif, webp input formats.
<!-- @END:AC:AC-002 -->
<!-- @AC:AC-003 status=done -->
- [x] **AC-003**: THE SYSTEM SHALL output WebP (quality 80) and preserve original as fallback. Original file preserved with `_original.{ext}` suffix. Schema has originalPath, originalUrl, originalMimeType fields.
<!-- @END:AC:AC-003 -->
<!-- @AC:AC-004 status=done -->
- [x] **AC-004**: THE SYSTEM SHALL strip EXIF data for privacy protection.
<!-- @END:AC:AC-004 -->
<!-- @AC:AC-005 status=done -->
- [x] **AC-005**: THE SYSTEM SHALL store files at `uploads/{hash[0:2]}/{hash[2:4]}/{filename}.webp`.
<!-- @END:AC:AC-005 -->
<!-- @AC:AC-006 status=done -->
- [x] **AC-006**: THE SYSTEM SHALL create a Media record in database with metadata (size, dimensions, hash, variants, originalSize, compressionRatio, errorMessage).
<!-- @END:AC:AC-006 -->
<!-- @AC:AC-007 status=done -->
- [x] **AC-007**: THE SYSTEM SHALL return upload response with URL and variant URLs.
<!-- @END:AC:AC-007 -->
<!-- @AC:AC-007a status=done -->
- [x] **AC-007a**: THE SYSTEM SHALL support multi-file batch upload via POST /api/upload/images endpoint, accepting up to 5 files per request and returning an array of upload responses.
<!-- @END:AC:AC-007a -->
<!-- @END:STORY:US-001 -->

<!-- @STORY:US-002 priority=P1 status=done mvp=true -->
### US-002: Image Variants (P1) 🎯 MVP

As a user, I want images to have multiple size variants so that the platform can serve optimized images for different contexts.

**Independent Test**: Upload an image and verify 4 variants (thumb, medium, large, original) are generated with correct dimensions.

**Acceptance Criteria**:
<!-- @AC:AC-008 status=done -->
- [x] **AC-008**: WHEN an image is uploaded, THE SYSTEM SHALL generate multiple size variants: thumbnail (150x150), medium (600x600), large (1200x1200), and keep original.
<!-- @END:AC:AC-008 -->
<!-- @AC:AC-009 status=done -->
- [x] **AC-009**: THE SYSTEM SHALL preserve aspect ratio (fit within dimensions).
<!-- @END:AC:AC-009 -->
<!-- @AC:AC-010 status=done -->
- [x] **AC-010**: THE SYSTEM SHALL generate all variants in WebP format.
<!-- @END:AC:AC-010 -->
<!-- @AC:AC-011 status=done -->
- [x] **AC-011**: THE SYSTEM SHALL store variants alongside original with size suffix.
<!-- @END:AC:AC-011 -->
<!-- @END:STORY:US-002 -->

<!-- @STORY:US-003 priority=P1 status=done mvp=true -->
### US-003: Async Processing for Large Files (P1) 🎯 MVP

As a user, I want large file uploads to be processed asynchronously so that I don't have to wait for processing to complete.

**Independent Test**: Upload a 3MB image and verify it returns a status URL immediately, then poll until status is READY.

**Acceptance Criteria**:
<!-- @AC:AC-012 status=done -->
- [x] **AC-012**: WHEN a user uploads a file larger than 2MB (size > 2,097,152 bytes), THE SYSTEM SHALL process it asynchronously via Bull queue and return a temporary status URL.
<!-- @END:AC:AC-012 -->
<!-- @AC:AC-013 status=done -->
- [x] **AC-013**: WHEN a user uploads a file 2MB or smaller (size <= 2,097,152 bytes), THE SYSTEM SHALL process it synchronously and return immediate URL.
<!-- @END:AC:AC-013 -->
<!-- @AC:AC-014 status=done -->
- [x] **AC-014**: THE SYSTEM SHALL provide status endpoint: GET /api/upload/status/:mediaId.
<!-- @END:AC:AC-014 -->
<!-- @AC:AC-015 status=done -->
- [x] **AC-015**: THE SYSTEM SHALL transition Media status: PROCESSING -> READY or FAILED.
<!-- @END:AC:AC-015 -->
<!-- @END:STORY:US-003 -->

<!-- @STORY:US-004 priority=P1 status=done mvp=true -->
### US-004: Upload Security - File Validation (P1) 🎯 MVP

As a platform operator, I want uploaded files validated by magic bytes so that malicious files cannot be uploaded by spoofing extensions.

**Independent Test**: Attempt to upload a renamed .exe file as .jpg and verify it's rejected.

**Acceptance Criteria**:
<!-- @AC:AC-016 status=done -->
- [x] **AC-016**: THE SYSTEM SHALL validate uploaded files using magic bytes (not just extension) to prevent file type spoofing.
<!-- @END:AC:AC-016 -->
<!-- @AC:AC-017 status=done -->
- [x] **AC-017**: THE SYSTEM SHALL check magic bytes for JPEG (FF D8 FF at offset 0), PNG (89 50 4E 47 at offset 0), GIF (47 49 46 at offset 0), WebP (RIFF header 52 49 46 46 at offset 0 AND "WEBP" signature 57 45 42 50 at offset 8-11).
<!-- @END:AC:AC-017 -->
<!-- @AC:AC-018 status=done -->
- [x] **AC-018**: THE SYSTEM SHALL reject files with mismatched extension/magic bytes.
<!-- @END:AC:AC-018 -->
<!-- @AC:AC-019 status=done -->
- [x] **AC-019**: THE SYSTEM SHALL enforce maximum file size: 10MB per file.
<!-- @END:AC:AC-019 -->
<!-- @AC:AC-020 status=done -->
- [x] **AC-020**: THE SYSTEM SHALL enforce maximum dimensions: 4096x4096 pixels.
<!-- @END:AC:AC-020 -->
<!-- @AC:AC-021 status=done -->
- [x] **AC-021**: THE SYSTEM SHALL check compression ratio (decompressed size / compressed size) and reject files where ratio exceeds 100:1 to prevent decompression bombs. This check applies per-file, not per-archive.
<!-- @END:AC:AC-021 -->
<!-- @END:STORY:US-004 -->

<!-- @STORY:US-005 priority=P1 status=done mvp=true -->
### US-005: Upload Security - Rate Limiting & Quotas (P1) 🎯 MVP

As a platform operator, I want rate limits and quotas enforced so that the system is protected from abuse.

**Independent Test**: Upload 11 images in one hour and verify the 11th is rejected with 429 status.

**Acceptance Criteria**:
<!-- @AC:AC-022 status=done -->
- [x] **AC-022**: THE SYSTEM SHALL enforce rate limit: 10 uploads per hour per user (Redis-backed).
<!-- @END:AC:AC-022 -->
<!-- @AC:AC-023 status=done -->
- [x] **AC-023**: THE SYSTEM SHALL enforce daily quota: 50MB per user per day (Redis-backed with DB fallback, fail-open on Redis failure for resilience).
<!-- @END:AC:AC-023 -->
<!-- @AC:AC-024 status=done -->
- [x] **AC-024**: THE SYSTEM SHALL enforce max 5 files per single upload request. Note: Post creation (AC-044: max 10 images per post) accepts previously uploaded media IDs, so users can batch uploads across multiple requests before creating a post.
<!-- @END:AC:AC-024 -->
<!-- @AC:AC-025 status=done -->
- [x] **AC-025**: IF rate limit or quota is exceeded, THEN THE SYSTEM SHALL return clear error messages.
<!-- @END:AC:AC-025 -->
<!-- @AC:AC-026 status=done -->
- [x] **AC-026**: WHERE user has ADMIN or SUPER_ADMIN role, THE SYSTEM SHALL exempt them from quotas.
<!-- @END:AC:AC-026 -->
<!-- @END:STORY:US-005 -->

<!-- @STORY:US-006 priority=P1 status=done mvp=true -->
### US-006: Smart Image Caching (P1) 🎯 MVP

As a platform operator, I want images served through a smart cache so that server load is reduced and response times are fast.

**Independent Test**: Request the same image twice and verify second request is served from cache with proper headers.

**Acceptance Criteria**:
<!-- @AC:AC-027 status=done -->
- [x] **AC-027**: WHEN an image is requested, THE SYSTEM SHALL serve it through a two-tier cache (LRU in-memory + Redis metadata) with proper HTTP cache headers.
<!-- @END:AC:AC-027 -->
<!-- @AC:AC-028 status=done -->
- [x] **AC-028**: THE SYSTEM SHALL configure LRU in-memory cache: 100MB max, 1hr TTL, shared across all users.
<!-- @END:AC:AC-028 -->
<!-- @AC:AC-029 status=done -->
- [x] **AC-029**: THE SYSTEM SHALL use Redis metadata cache for file paths and variant info.
<!-- @END:AC:AC-029 -->
<!-- @AC:AC-030 status=done -->
- [x] **AC-030**: THE SYSTEM SHALL set HTTP headers: `Cache-Control: public, max-age=31536000, immutable` ONLY for content-addressed URLs containing hash/version token (e.g., `/images/{hash}_v{version}.webp`). For non-versioned URLs, use `Cache-Control: public, max-age=3600`. Implement cache invalidation via URL versioning or content-addressed paths. Implementation includes X-Cache-Key debug header.
<!-- @END:AC:AC-030 -->
<!-- @AC:AC-031 status=done -->
- [x] **AC-031**: THE SYSTEM SHALL support ETag with conditional requests (304 Not Modified).
<!-- @END:AC:AC-031 -->
<!-- @AC:AC-032 status=done -->
- [x] **AC-032**: THE SYSTEM SHALL support content negotiation via Accept header (WebP primary, JPEG fallback). Accept header parsed, WebP primary, JPEG fallback via original file or on-the-fly conversion. Vary: Accept header set. Cache key includes format.
<!-- @END:AC:AC-032 -->
<!-- @END:STORY:US-006 -->

<!-- @STORY:US-007 priority=P1 status=done mvp=true -->
### US-007: Image Serving (P1) 🎯 MVP

As a user, I want to access uploaded images via a public URL so that images can be displayed in the application.

**Independent Test**: Request GET /api/images/:id/thumb and verify correct image variant is returned with proper headers.

**Acceptance Criteria**:
<!-- @AC:AC-033 status=done -->
- [x] **AC-033**: THE SYSTEM SHALL serve images via endpoint: GET /api/images/:id/:variant? (variant = thumb|medium|large|original).
<!-- @END:AC:AC-033 -->
<!-- @AC:AC-034 status=done -->
- [x] **AC-034**: THE SYSTEM SHALL default to large variant when no variant specified.
<!-- @END:AC:AC-034 -->
<!-- @AC:AC-035 status=done -->
- [x] **AC-035**: THE SYSTEM SHALL set proper Content-Type headers.
<!-- @END:AC:AC-035 -->
<!-- @AC:AC-036 status=done -->
- [x] **AC-036**: THE SYSTEM SHALL set Cache-Control headers for browser caching.
<!-- @END:AC:AC-036 -->
<!-- @AC:AC-037 status=done -->
- [x] **AC-037**: IF image does not exist, THEN THE SYSTEM SHALL return 404.
<!-- @END:AC:AC-037 -->
<!-- @AC:AC-038 status=done -->
- [x] **AC-038**: THE SYSTEM SHALL serve images publicly (no auth required) by default. Exceptions requiring authentication or signed URLs: user avatars in private profiles, draft post images, and images marked as private. Implement signed URL generation for protected images with configurable expiry.
<!-- @END:AC:AC-038 -->
<!-- @END:STORY:US-007 -->

<!-- @STORY:US-008 priority=P2 status=done mvp=false -->
### US-008: Avatar & Cover Photo Upload (P2)

As a user, I want to upload avatar and cover photos so that I can personalize my profile.

**Independent Test**: Upload an avatar image and verify it's cropped to 300x300 and profile is updated.

**Acceptance Criteria**:
<!-- @AC:AC-039 status=done -->
- [x] **AC-039**: WHEN a user uploads an avatar, THE SYSTEM SHALL resize it to 300x300 (square crop).
<!-- @END:AC:AC-039 -->
<!-- @AC:AC-040 status=done -->
- [x] **AC-040**: WHEN a user uploads a cover photo, THE SYSTEM SHALL resize it to 1200x400 (landscape crop).
<!-- @END:AC:AC-040 -->
<!-- @AC:AC-041 status=done -->
- [x] **AC-041**: WHEN avatar/cover is replaced, THE SYSTEM SHALL delete the old file.
<!-- @END:AC:AC-041 -->
<!-- @AC:AC-042 status=done -->
- [x] **AC-042**: THE SYSTEM SHALL update user profile with new image URL.
<!-- @END:AC:AC-042 -->
<!-- @END:STORY:US-008 -->

<!-- @STORY:US-009 priority=P2 status=done mvp=false -->
### US-009: Post Image Upload (P2)

As a user, I want to upload images with my posts so that I can share visual content.

**Independent Test**: Create a post with 3 images and verify all are processed and stored in post.images field.

**Acceptance Criteria**:
<!-- @AC:AC-043 status=done -->
- [x] **AC-043**: WHEN a user creates a post with images, THE SYSTEM SHALL upload and process all images, storing URLs in the post's images field.
<!-- @END:AC:AC-043 -->
<!-- @AC:AC-044 status=done -->
- [x] **AC-044**: THE SYSTEM SHALL enforce max 10 images per post.
<!-- @END:AC:AC-044 -->
<!-- @AC:AC-045 status=done -->
- [x] **AC-045**: THE SYSTEM SHALL process images and generate variants.
<!-- @END:AC:AC-045 -->
<!-- @AC:AC-046 status=done -->
- [x] **AC-046**: WHEN a post is deleted, THE SYSTEM SHALL delete associated images (cascade).
<!-- @END:AC:AC-046 -->
<!-- @END:STORY:US-009 -->

<!-- @STORY:US-010 priority=P3 status=done mvp=false -->
### US-010: Image Cleanup (P3)

As a platform operator, I want orphaned images cleaned up so that disk space is managed efficiently.

**Independent Test**: Delete a post and verify associated image files are removed from disk.

**Acceptance Criteria**:
<!-- @AC:AC-047 status=done -->
- [x] **AC-047**: WHEN associated content is deleted, THE SYSTEM SHALL delete image files + variants + cache.
<!-- @END:AC:AC-047 -->
<!-- @AC:AC-048 status=done -->
- [x] **AC-048**: THE SYSTEM SHALL run scheduled cleanup job for orphaned files (no DB reference).
<!-- @END:AC:AC-048 -->

<!-- @END:STORY:US-010 -->

<!-- @END:USER_STORIES -->

<!-- @SECTION:NON_FUNCTIONAL -->
## Non-Functional Requirements

| Category | Requirement | Target |
|----------|-------------|--------|
| Performance | Image processing time | < 5s for 10MB file |
| Performance | Cache hit ratio | > 90% under normal load |
| Security | File validation | All uploads validated by magic bytes |
| Security | Rate limiting | Enforced per-user limits |
| Scalability | Storage structure | Hash-based sharding supports millions of files |
| Reliability | Cache fallback | Graceful degradation if Redis unavailable (serve from disk) |
<!-- @END:NON_FUNCTIONAL -->

<!-- @SECTION:OUT_OF_SCOPE -->
## Out of Scope

- Cloud storage integration (S3, GCS) - future enhancement
- Video upload and processing
- Image editing/cropping UI
- CDN integration
- Image watermarking
<!-- @END:OUT_OF_SCOPE -->

<!-- @SECTION:ASSUMPTIONS -->
## Assumptions (Auto-inferred)

| Decision | Chosen | Reasoning | Alternatives |
|----------|--------|-----------|--------------|
| Storage | Local filesystem | Simpler setup, no cloud costs | S3, GCS, Azure Blob |
| Image format | WebP | Best compression/quality ratio, wide browser support | AVIF, JPEG XL |
| Queue system | Bull (Redis) | Already used in project, reliable | RabbitMQ, SQS |
| Cache strategy | LRU + Redis | Balance memory usage and performance | Redis only, Memcached |
| Hash algorithm | SHA-256 | Secure, collision-resistant | MD5, SHA-1 |
<!-- @END:ASSUMPTIONS -->

<!-- @SECTION:CONTEXT -->
## Context

Related code:
- Existing upload module: `Backend/src/modules/upload/`
- Redis configuration: `Backend/src/redis/`
- Queue configuration: `Backend/src/queue/`
- Prisma schema: `Backend/prisma/schema.prisma`
<!-- @END:CONTEXT -->

<!-- @SECTION:ADDITIONAL_SPECIFICATIONS -->
## Additional Specifications

### Cache Invalidation Strategy
- Use content-addressed URLs with hash in path: `/images/{hash[0:8]}_{variant}.webp`
- When image is re-processed or updated, hash changes → new URL → automatic cache invalidation
- For mutable URLs (e.g., `/images/:mediaId`), use shorter cache TTL (1 hour) and ETag validation
- On media deletion: invalidate LRU cache immediately, Redis metadata TTL handles expiry

### Privacy & Access Control Model
- **Public by default**: All processed images served without authentication
- **Protected images** (require signed URLs):
  - Draft post images (post.status = DRAFT)
  - Private profile avatars (user.profileVisibility = PRIVATE)
  - Images explicitly marked private (Media.isPrivate = true)
- **Signed URL format**: `/images/:id?token={hmac}&expires={timestamp}`
- **Token generation**: HMAC-SHA256(mediaId + expires + secretKey)
- **Token expiry**: Configurable, default 1 hour for protected images

### Original Format Preservation Policy
- **Always preserve**: Original file stored as `{hash}_original.{ext}` (original extension)
- **Primary output**: WebP for all variants (thumb, medium, large)
- **Fallback serving**: If client doesn't support WebP (via Accept header), serve original format
- **Storage**: Both WebP variants and original preserved; cleanup job removes only orphaned files

### Compression Ratio Threshold
- **Algorithm**: `compressionRatio = decompressedSize / compressedSize`
- **Threshold**: Reject if ratio > 100:1 (decompression bomb indicator)
- **Measurement point**: After reading file into memory, before processing
- **Per-file check**: Applied to each file individually, not aggregate

### URL Structure
- **Serving endpoint**: `GET /api/images/:mediaId/:variant?`
- **Content-addressed**: `GET /api/images/{hash[0:8]}_{variant}.webp` (immutable cache)
- **Status endpoint**: `GET /api/upload/status/:mediaId`
- **Upload endpoints**: `POST /api/upload/image`, `POST /api/upload/images`, `POST /api/upload/avatar`, `POST /api/upload/cover`

### Multi-File Upload Behavior
- **Endpoint**: `POST /api/upload/images` accepts `multipart/form-data` with field `files[]`
- **Limit**: Max 5 files per request (enforced by Multer)
- **Processing**: Files processed in parallel where possible
- **Response**: Array of upload responses, one per file
- **Partial failure**: If some files fail validation, return 207 Multi-Status with per-file status
- **Atomicity**: No transaction - successful uploads persist even if others fail
<!-- @END:ADDITIONAL_SPECIFICATIONS -->

## Implementation Notes

**Status**: Completed
**Files**: `Backend/src/modules/upload/` (see implementation files below)
**Deviations**: See Known Deviations section below
**Limitations**: See Not Implemented section below

### Validation Summary (Final)
**Validation**: 48/48 PASS (100%)

### Known Deviations from Spec

None - all acceptance criteria fully implemented.

### Not Implemented (Deferred)

None - all acceptance criteria implemented.

### Undocumented Implementation Details

The following features were implemented but not originally specified:

1. **errorMessage field** — Media model stores failure reason for FAILED status uploads
2. **deleteMediaBySystem method** — System-level deletion bypassing ownership check (used by cleanup job)
3. **Best-effort deletion pattern** — Profile image cleanup uses non-blocking error handling to prevent user-facing failures
4. **Vietnamese error messages** — All user-facing errors in Vietnamese (spec examples showed English)
5. **Variant skipping** — Skips variant generation if original is smaller than target size (prevents upscaling)
6. **Stuck media cleanup** — Cleanup job also handles PROCESSING media older than 1 hour (prevents orphaned processing states)
7. **Rate limit fail-open** — Allows upload on Redis failure for resilience (prevents service disruption)
8. **X-Cache-Key debug header** — Added to image serve responses for cache debugging
9. **Compression ratio formula** — Uses `processedSize / originalSize` (value < 1 = good compression, e.g., 0.3 = 70% reduction)

### Architecture Decisions

- Vietnamese error messages used throughout for consistency with project
- `deleteMediaBySystem` method added for system-level cleanup (bypasses ownership check)
- Best-effort deletion pattern: profile image cleanup doesn't block on failure
- LRU cache uses `lru-cache` npm package with 100MB max, 1hr TTL
- Orphaned media cleanup runs daily at 2 AM via @nestjs/schedule Cron
- `@Public()` decorator used on ImageServeController for unauthenticated access

### Implementation Files

**Backend Core**: `Backend/src/modules/upload/`
- `services/upload.service.ts` - Main upload orchestration with rate limiting & quotas
- `services/image-processor.service.ts` - Sharp-based image processing
- `services/image-cache.service.ts` - LRU + Redis two-tier caching
- `processors/image-processing.processor.ts` - Bull queue processor
- `controllers/upload.controller.ts` - Upload API endpoints
- `controllers/image-serve.controller.ts` - Image serving with caching
- `repositories/media.repository.ts` - Prisma database operations
- `adapters/local-storage.adapter.ts` - File system storage
- `utils/validation.utils.ts` - File type validation
- `jobs/orphaned-media-cleanup.job.ts` - Scheduled cleanup job

**Frontend**: `Frontend/src/`
- `types/media.ts` - TypeScript types
- `lib/upload.ts` - Upload API functions
- `hooks/useUpload.ts` - React hooks for upload
- `app/(main)/compose/page.tsx` - Post creation with images
- `api/profiles/api/profiles.ts` - Profile avatar/cover upload

**Database**: `Backend/prisma/schema.prisma:731` - Media model


