---
spec_version: "1.0"
feature: "admin-access-control"
level: 1
status: "current"
created: "2026-01-31"
updated: "2026-01-31"
tags: ["admin", "access-control", "roles", "security"]
---

<!-- @SECTION:OVERVIEW -->
# Admin Access Control Fix

Fix frontend-backend mismatches in role/tier enums and implement missing admin module to enable proper admin access control with SUPER_ADMIN support.
<!-- @END:OVERVIEW -->

<!-- @SECTION:USER_STORIES -->
## User Stories

<!-- @STORY:US-001 priority=P1 status=done mvp=true -->
### US-001: Role and Tier Type Synchronization (P1) 🎯 MVP

As a developer, I want frontend types to match backend Prisma schema exactly so that role-based access control works correctly.

**Independent Test**: Verify `Frontend/src/features/auth/types/auth.ts` Role and Tier types match `Backend/prisma/schema.prisma` enums.
<!-- @END:STORY:US-001 -->

<!-- @STORY:US-002 priority=P1 status=done mvp=true -->
### US-002: SUPER_ADMIN Access to Admin Routes (P1) 🎯 MVP

As a SUPER_ADMIN user, I want to access all /admin routes so that I can manage the platform with highest privileges.

**Independent Test**: Login as SUPER_ADMIN, navigate to /admin/*, verify access granted.
<!-- @END:STORY:US-002 -->

<!-- @STORY:US-003 priority=P1 status=done mvp=true -->
### US-003: Admin Module Backend Implementation (P1) 🎯 MVP

As an admin, I want backend endpoints for analytics, user management, and moderation so that frontend admin features work correctly.

**Independent Test**: Call `/admin/analytics`, `/admin/users`, `/admin/moderation/queue` endpoints with admin token, verify responses.
<!-- @END:STORY:US-003 -->

<!-- @END:USER_STORIES -->

<!-- @SECTION:ACCEPTANCE_CRITERIA -->
## Acceptance Criteria

<!-- @CRITERIA_GROUP:type_sync story=US-001 -->
### Type Synchronization

<!-- @AC:AC-001 status=done -->
- [x] **AC-001**: THE SYSTEM SHALL define frontend User.role as `'GUEST' | 'USER' | 'ADMIN' | 'SUPER_ADMIN'` matching backend Role enum.
<!-- @END:AC:AC-001 -->

<!-- @AC:AC-002 status=done -->
- [x] **AC-002**: THE SYSTEM SHALL define frontend User.tier as `'NEWCOMER' | 'CONTRIBUTOR' | 'EXPERT' | 'MASTER' | 'LEGEND'` matching backend Tier enum.
<!-- @END:AC:AC-002 -->

<!-- @AC:AC-003 status=done -->
- [x] **AC-003**: THE SYSTEM SHALL update `Frontend/src/features/admin/types/admin.ts` UserManagement.role to include SUPER_ADMIN.
<!-- @END:AC:AC-003 -->

<!-- @END:CRITERIA_GROUP:type_sync -->

<!-- @CRITERIA_GROUP:admin_guard story=US-002 -->
### AdminGuard Updates

<!-- @AC:AC-004 status=done -->
- [x] **AC-004**: WHEN user with SUPER_ADMIN role accesses /admin routes, THE SYSTEM SHALL grant access.
<!-- @END:AC:AC-004 -->

<!-- @AC:AC-005 status=done -->
- [x] **AC-005**: WHEN user with ADMIN role accesses /admin routes, THE SYSTEM SHALL grant access.
<!-- @END:AC:AC-005 -->

<!-- @AC:AC-006 status=done -->
- [x] **AC-006**: WHEN user with USER or GUEST role accesses /admin routes, THE SYSTEM SHALL redirect to /.
<!-- @END:AC:AC-006 -->

<!-- @AC:AC-007 status=done -->
- [x] **AC-007**: THE SYSTEM SHALL enforce role hierarchy: SUPER_ADMIN > ADMIN > USER > GUEST.
<!-- @END:AC:AC-007 -->

<!-- @END:CRITERIA_GROUP:admin_guard -->

<!-- @CRITERIA_GROUP:backend_admin story=US-003 -->
### Backend Admin Module

<!-- @AC:AC-008 status=done -->
- [x] **AC-008**: WHEN admin calls GET /admin/analytics, THE SYSTEM SHALL return platform stats (totalUsers, totalPosts, totalComments, pendingPosts, activeUsers).
<!-- @END:AC:AC-008 -->

<!-- @AC:AC-009 status=done -->
- [x] **AC-009**: WHEN admin calls GET /admin/users, THE SYSTEM SHALL return paginated user list with management data.
<!-- @END:AC:AC-009 -->

<!-- @AC:AC-010 status=done -->
- [x] **AC-010**: WHEN admin calls GET /admin/moderation/queue, THE SYSTEM SHALL return pending posts for moderation.
<!-- @END:AC:AC-010 -->

<!-- @AC:AC-011 status=done -->
- [x] **AC-011**: WHEN admin calls POST /admin/moderation/:postId/approve, THE SYSTEM SHALL approve the post.
<!-- @END:AC:AC-011 -->

<!-- @AC:AC-012 status=done -->
- [x] **AC-012**: WHEN admin calls POST /admin/moderation/:postId/reject, THE SYSTEM SHALL reject the post with reason.
<!-- @END:AC:AC-012 -->

<!-- @AC:AC-013 status=done -->
- [x] **AC-013**: THE SYSTEM SHALL protect all /admin/* endpoints with RolesGuard requiring ADMIN or SUPER_ADMIN role.
<!-- @END:AC:AC-013 -->

<!-- @END:CRITERIA_GROUP:backend_admin -->

<!-- @END:ACCEPTANCE_CRITERIA -->

<!-- @SECTION:ASSUMPTIONS -->
## Assumptions (Auto-inferred)

| Decision | Chosen | Reasoning | Alternatives |
|----------|--------|-----------|--------------|
| Remove MODERATOR from Role enum | Yes | Backend Prisma schema doesn't have MODERATOR in Role enum | Keep MODERATOR (breaks sync) |
| Admin module path prefix | `/admin` | Frontend expects `/admin/*` endpoints | Use existing `/moderation` (breaks frontend) |
| Reuse ModerationService | Yes | Existing service has moderation logic | Create new AdminModerationService |

> These assumptions were made based on backend Prisma schema as source of truth.
<!-- @END:ASSUMPTIONS -->

<!-- @SECTION:IMPLEMENTATION_NOTES -->
## Implementation Notes

**Status**: Completed
**Completed**: 2026-01-31

### Files Modified

**Frontend**:
- `Frontend/src/features/auth/types/auth.ts` - Role and Tier types fixed
- `Frontend/src/features/admin/types/admin.ts` - UserManagement.role updated
- `Frontend/src/features/admin/components/AdminGuard.tsx` - SUPER_ADMIN check added
- `Frontend/src/components/auth/AdminGuard.tsx` - SUPER_ADMIN check added, allowModerator removed
- `Frontend/src/features/admin/api/admin.ts` - Role type fixed
- `Frontend/src/features/admin/components/UserTable.tsx` - Role filter and labels fixed
- `Frontend/src/features/auth/components/ProtectedRoute.tsx` - Role type fixed

**Backend**:
- `Backend/src/modules/admin/admin.module.ts` - Created
- `Backend/src/modules/admin/controllers/admin.controller.ts` - Created
- `Backend/src/modules/admin/services/admin.service.ts` - Created
- `Backend/src/modules/admin/dto/admin-analytics.dto.ts` - Created
- `Backend/src/modules/admin/dto/get-users.dto.ts` - Created
- `Backend/src/modules/admin/dto/update-user.dto.ts` - Created

### Deviations from Original Spec

- **AC-007**: Removed MODERATOR role from hierarchy (SUPER_ADMIN > ADMIN > USER > GUEST) - role doesn't exist in backend Prisma schema
- **AdminGuard API**: Removed `allowModerator` prop from AdminGuard component for cleaner API

### Limitations

None
<!-- @END:IMPLEMENTATION_NOTES -->

<!-- @SECTION:CONTEXT -->
## Context

### Files to Modify

**Frontend Type Fixes**:
- `Frontend/src/features/auth/types/auth.ts:10-11` - Fix Role and Tier types
- `Frontend/src/features/admin/types/admin.ts:25` - Fix UserManagement.role

**Frontend AdminGuard Fixes**:
- `Frontend/src/features/admin/components/AdminGuard.tsx:27` - Add SUPER_ADMIN check
- `Frontend/src/components/auth/AdminGuard.tsx:47-51` - Add SUPER_ADMIN check

**Backend New Module**:
- Create `Backend/src/modules/admin/` with AdminModule, AdminController, AdminService
- Register AdminModule in `Backend/src/app.module.ts`

### Reference Files
- Backend Role/Tier enums: `Backend/prisma/schema.prisma:441-448,480-488`
- Existing moderation: `Backend/src/modules/moderation/controllers/moderation.controller.ts`
- RolesGuard pattern: `Backend/src/modules/auth/guards/roles.guard.ts`
<!-- @END:CONTEXT -->

