---
spec_version: "1.0"
feature: "user-settings-management"
level: 3
status: "active"
created: "2026-01-30"
updated: "2026-02-11"
tags: ["security", "settings", "2fa", "sessions", "account", "privacy"]
synced_from: "Backend/src/modules/users/controllers/users.controller.ts"
---

<!-- @SECTION:OVERVIEW -->
# User Settings Management

Comprehensive user settings management system providing security features (password management, 2FA, session management, account deletion), privacy controls (profile visibility with crawler bypass for SEO), and notification preferences. Features toast notifications and WCAG 2.1 AA accessibility compliance.
<!-- @END:OVERVIEW -->

<!-- @SECTION:USER_STORIES -->
## User Stories

<!-- @STORY:US-001 priority=P1 status=done mvp=true -->
### US-001: Password Change (P1) 🎯 MVP

As a user, I want to change my password with current password verification so that I can maintain account security.

**Independent Test**: User can change password, receives success toast, and session is regenerated.

**Acceptance Criteria**:
<!-- @AC:AC-001 status=done -->
- [x] **AC-001**: WHEN user submits password change form WITH valid current password AND new password meeting requirements THEN THE SYSTEM SHALL update password AND regenerate session AND show success toast "Đổi mật khẩu thành công"
<!-- @END:AC:AC-001 -->

<!-- @AC:AC-002 status=done -->
- [x] **AC-002**: WHEN user submits password change form WITH invalid current password THEN THE SYSTEM SHALL show error toast "Mật khẩu hiện tại không đúng"
<!-- @END:AC:AC-002 -->

<!-- @AC:AC-003 status=done -->
- [x] **AC-003**: WHEN user types new password THEN THE SYSTEM SHALL display password strength indicator showing weak/medium/strong
<!-- @END:AC:AC-003 -->

<!-- @AC:AC-004 status=done -->
- [x] **AC-004**: WHEN new password does not meet requirements (min 8 chars, uppercase, lowercase, number) THEN THE SYSTEM SHALL prevent submission AND show validation errors
<!-- @END:AC:AC-004 -->
<!-- @END:STORY:US-001 -->

<!-- @STORY:US-002 priority=P1 status=done mvp=true -->
### US-002: Two-Factor Authentication Setup (P1) 🎯 MVP

As a user, I want to enable TOTP-based 2FA with QR code and backup codes so that I can add an extra layer of security.

**Independent Test**: User can enable 2FA, scan QR code, verify with TOTP code, and receive backup codes.

**Acceptance Criteria**:
<!-- @AC:AC-005 status=done -->
- [x] **AC-005**: WHEN user clicks "Bật xác thực 2 bước" THEN THE SYSTEM SHALL display QR code AND secret key AND 10 backup codes
<!-- @END:AC:AC-005 -->

<!-- @AC:AC-006 status=done -->
- [x] **AC-006**: WHEN user enters valid TOTP code THEN THE SYSTEM SHALL enable 2FA AND show success toast "Đã bật xác thực 2 bước"
<!-- @END:AC:AC-006 -->

<!-- @AC:AC-007 status=done -->
- [x] **AC-007**: WHEN user with 2FA enabled logs in THEN THE SYSTEM SHALL prompt for TOTP code before completing login
<!-- @END:AC:AC-007 -->

<!-- @AC:AC-008 status=done -->
- [x] **AC-008**: WHEN user enters valid backup code THEN THE SYSTEM SHALL allow login AND mark code as used
<!-- @END:AC:AC-008 -->

<!-- @AC:AC-009 status=done -->
- [x] **AC-009**: WHEN user clicks "Tắt xác thực 2 bước" WITH valid password THEN THE SYSTEM SHALL disable 2FA AND show success toast
<!-- @END:AC:AC-009 -->
<!-- @END:STORY:US-002 -->

<!-- @STORY:US-003 priority=P1 status=done mvp=true -->
### US-003: Session Management (P1) 🎯 MVP

As a user, I want to view and manage my active sessions so that I can detect unauthorized access and revoke sessions.

**Independent Test**: User can view sessions list, revoke individual session, and logout all other devices.

**Acceptance Criteria**:
<!-- @AC:AC-010 status=done -->
- [x] **AC-010**: WHEN user views security settings THEN THE SYSTEM SHALL display list of active sessions with device info, browser, IP address, and last active time
<!-- @END:AC:AC-010 -->

<!-- @AC:AC-011 status=done -->
- [x] **AC-011**: WHEN user clicks "Đăng xuất" on a session THEN THE SYSTEM SHALL revoke that session AND show success toast "Đã đăng xuất thiết bị"
<!-- @END:AC:AC-011 -->

<!-- @AC:AC-012 status=done -->
- [x] **AC-012**: WHEN user clicks "Đăng xuất tất cả thiết bị khác" THEN THE SYSTEM SHALL revoke all sessions except current AND show success toast
<!-- @END:AC:AC-012 -->

<!-- @AC:AC-013 status=done -->
- [x] **AC-013**: THE SYSTEM SHALL highlight current session with "Thiết bị này" badge
<!-- @END:AC:AC-013 -->
<!-- @END:STORY:US-003 -->

<!-- @STORY:US-004 priority=P2 status=done mvp=false -->
### US-004: Account Deletion with Grace Period (P2)

As a user, I want to delete my account with a 14-day grace period so that I can recover if I change my mind.

**Independent Test**: User can request deletion, receive email, and cancel within grace period.

**Acceptance Criteria**:
<!-- @AC:AC-014 status=done -->
- [x] **AC-014**: WHEN user requests account deletion WITH valid password THEN THE SYSTEM SHALL soft-delete account AND schedule hard delete in 14 days AND send email notification
<!-- @END:AC:AC-014 -->

<!-- @AC:AC-015 status=done -->
- [x] **AC-015**: WHEN user cancels deletion within grace period THEN THE SYSTEM SHALL restore account AND show success toast "Đã hủy yêu cầu xóa tài khoản"
<!-- @END:AC:AC-015 -->

<!-- @AC:AC-016 status=done -->
- [x] **AC-016**: WHEN grace period expires THEN THE SYSTEM SHALL hard-delete account and all associated data
<!-- @END:AC:AC-016 -->

<!-- @AC:AC-017 status=done -->
- [x] **AC-017**: WHILE account is in deletion grace period THEN THE SYSTEM SHALL show banner with remaining days and cancel option
<!-- @END:AC:AC-017 -->
<!-- @END:STORY:US-004 -->

<!-- @STORY:US-005 priority=P2 status=done mvp=false -->
### US-005: UI/UX Improvements (P2)

As a user, I want consistent toast notifications and loading states so that I have clear feedback on my actions.

**Independent Test**: All settings operations show toast notifications, loading skeletons display during data fetch.

**Acceptance Criteria**:
<!-- @AC:AC-018 status=done -->
- [x] **AC-018**: WHEN any settings operation succeeds THEN THE SYSTEM SHALL show toast notification (not browser alert)
<!-- @END:AC:AC-018 -->

<!-- @AC:AC-019 status=done -->
- [x] **AC-019**: WHEN settings page loads THEN THE SYSTEM SHALL show skeleton loaders until data is ready
<!-- @END:AC:AC-019 -->

<!-- @AC:AC-020 status=done -->
- [x] **AC-020**: WHEN user is in dark mode THEN THE SYSTEM SHALL render all settings components with consistent dark theme colors
<!-- @END:AC:AC-020 -->

<!-- @AC:AC-021 status=done -->
- [x] **AC-021**: THE SYSTEM SHALL provide aria-labels, aria-describedby, and keyboard navigation for all interactive elements
<!-- @END:AC:AC-021 -->
<!-- @END:STORY:US-005 -->

<!-- @STORY:US-006 priority=P1 status=done mvp=true -->
### US-006: User Settings API (P1) 🎯 MVP

As a user, I want to view and update my account, privacy, and notification settings through a unified API so that I can manage my preferences.

**Independent Test**: User can GET settings, PATCH account/privacy/notifications settings.
**Inferred from**: `Backend/src/modules/users/controllers/users.controller.ts`

**Acceptance Criteria**:
<!-- @AC:AC-022 status=done -->
- [x] **AC-022**: WHEN user requests GET /users/settings THEN THE SYSTEM SHALL return all settings including account, privacy, notification, security, and deletion status
<!-- @END:AC:AC-022 -->

<!-- @AC:AC-023 status=done -->
- [x] **AC-023**: WHEN user updates PATCH /users/settings/account WITH displayName, bio, or email THEN THE SYSTEM SHALL update profile and user data AND return updated settings
<!-- @END:AC:AC-023 -->

<!-- @AC:AC-024 status=done -->
- [x] **AC-024**: WHEN user updates PATCH /users/settings/privacy WITH profileVisibility or showActivityStatus THEN THE SYSTEM SHALL update UserSettings AND return updated settings
<!-- @END:AC:AC-024 -->

<!-- @AC:AC-025 status=done -->
- [x] **AC-025**: WHEN user updates PATCH /users/settings/notifications WITH notification preferences THEN THE SYSTEM SHALL update UserSettings AND return updated settings
<!-- @END:AC:AC-025 -->
<!-- @END:STORY:US-006 -->

<!-- @STORY:US-007 priority=P1 status=done mvp=true -->
### US-007: Profile Visibility Privacy Enforcement (P1) 🎯 MVP

As a user, I want my profile visibility settings (PUBLIC/FRIENDS/PRIVATE) enforced at the API level so that my privacy is protected, while allowing search engine crawlers for SEO.

**Independent Test**: User sets profile to FRIENDS, non-friend gets 403, crawler can access.
**Inferred from**: `Backend/src/modules/profiles/services/profiles.service.ts:getProfileWithVisibilityCheck()`

**Acceptance Criteria**:
<!-- @AC:AC-026 status=done -->
- [x] **AC-026**: WHEN profile visibility is PUBLIC THEN THE SYSTEM SHALL allow all users (authenticated and unauthenticated) to view profile
<!-- @END:AC:AC-026 -->

<!-- @AC:AC-027 status=done -->
- [x] **AC-027**: WHEN profile visibility is FRIENDS AND requester is not authenticated THEN THE SYSTEM SHALL return 403 "Trang cá nhân này chỉ hiển thị với bạn bè"
<!-- @END:AC:AC-027 -->

<!-- @AC:AC-028 status=done -->
- [x] **AC-028**: WHEN profile visibility is FRIENDS AND requester is authenticated but not friend THEN THE SYSTEM SHALL check friendship status AND return 403 if not friends
<!-- @END:AC:AC-028 -->

<!-- @AC:AC-029 status=done -->
- [x] **AC-029**: WHEN profile visibility is PRIVATE AND requester is not profile owner THEN THE SYSTEM SHALL return 403 "Trang cá nhân này đang ở chế độ riêng tư"
<!-- @END:AC:AC-029 -->

<!-- @AC:AC-030 status=done -->
- [x] **AC-030**: WHEN User-Agent matches search engine crawler patterns (googlebot, bingbot, etc.) THEN THE SYSTEM SHALL bypass visibility restrictions for SEO
<!-- @END:AC:AC-030 -->

<!-- @AC:AC-031 status=done -->
- [x] **AC-031**: WHEN profile is returned THEN THE SYSTEM SHALL sanitize response by removing user.settings to prevent exposure of privacy settings
<!-- @END:AC:AC-031 -->
<!-- @END:STORY:US-007 -->
<!-- @END:USER_STORIES -->

<!-- @SECTION:NON_FUNCTIONAL -->
## Non-Functional Requirements

| Requirement | Target | Measurement |
|-------------|--------|-------------|
| Settings page load | < 500ms | Time to interactive |
| API response time | < 200ms | Server response time |
| Security | OWASP compliant | Security audit |
| Accessibility | WCAG 2.1 AA | Automated + manual testing |
<!-- @END:NON_FUNCTIONAL -->

<!-- @SECTION:SUCCESS_METRICS -->
## Success Metrics

| Metric | Target |
|--------|--------|
| 2FA adoption rate | 20% of active users within 3 months |
| Password change success rate | > 95% |
| Session revocation usage | Track for security insights |
| Account deletion cancellation rate | > 30% (indicates grace period value) |
<!-- @END:SUCCESS_METRICS -->

<!-- @SECTION:ASSUMPTIONS -->
## Assumptions (Auto-inferred)

| Decision | Chosen | Reasoning | Alternatives |
|----------|--------|-----------|--------------|
| TOTP algorithm | SHA1, 6 digits, 30s | Industry standard (RFC 6238), compatible with Google Authenticator | SHA256, 8 digits |
| Backup codes count | 10 codes | Balance between security and usability | 5, 15 codes |
| Grace period duration | 14 days | Industry standard (GDPR compliance) | 7 days, 30 days |
| Password requirements | 8+ chars, mixed case, number | OWASP recommendations | 12+ chars, special chars |
| Session display limit | 10 most recent | UX consideration | All sessions, paginated |
<!-- @END:ASSUMPTIONS -->

<!-- @SECTION:OUT_OF_SCOPE -->
## Out of Scope

- SMS-based 2FA (only TOTP supported)
- Hardware security keys (WebAuthn/FIDO2)
- Password manager integration
- Social login management
- Email change with verification flow
- Account export/download data (GDPR)
<!-- @END:OUT_OF_SCOPE -->

<!-- @SECTION:CONTEXT -->
## Context

### Existing Code References
- Auth controller: `Backend/src/modules/auth/controllers/auth.controller.ts`
- Session service: `Backend/src/modules/auth/services/session.service.ts`
- User repository: `Backend/src/modules/auth/repositories/user.repository.ts`
- Users controller: `Backend/src/modules/users/controllers/users.controller.ts`
- Users service: `Backend/src/modules/users/services/users.service.ts`
- Users repository: `Backend/src/modules/users/repositories/users.repository.ts`
- Profiles service: `Backend/src/modules/profiles/services/profiles.service.ts`
- Profiles repository: `Backend/src/modules/profiles/repositories/profiles.repository.ts`
- Settings API: `Frontend/src/features/settings/api/settings.ts`
- Settings types: `Frontend/src/features/settings/types/settings.ts`
- Security settings component: `Frontend/src/features/settings/components/SecuritySettings.tsx`
- Profile page client: `Frontend/src/app/(main)/profile/[username]/ProfilePageClient.tsx`
- useSettings hook: `Frontend/src/features/settings/hooks/useSettings.ts`
- Prisma schema: `Backend/prisma/schema.prisma` (User, Session, UserSettings, ProfileVisibility enum)
- Toast setup: `Frontend/src/app/layout.tsx` (Sonner Toaster configured)

### Current State
- UserSettings model with profileVisibility (PUBLIC/FRIENDS/PRIVATE), showActivityStatus, notification preferences, 2FA fields
- User model with deletionRequestedAt, deletionScheduledFor fields for grace period
- GET /users/settings endpoint returns unified settings response
- PATCH /users/settings/account, /privacy, /notifications endpoints for updates
- DELETE /users/account with password verification for soft delete
- POST /users/account/cancel-deletion to restore account
- Profile visibility enforced in profiles.service.ts with crawler bypass
- Crawler detection supports 20+ search engines and social media bots
- Frontend displays privacy error UI with lock/users icons
<!-- @END:CONTEXT -->

<!-- @SECTION:IMPLEMENTATION_NOTES -->
## Implementation Notes

**Status**: Completed
**Implementation Date**: 2026-01-30
**Last Synced**: 2026-02-11
**Quality Score**: 9.5/10

**Key Files**:
- Backend: `Backend/src/modules/auth/` (controllers, services)
- Backend: `Backend/src/modules/users/` (controllers, services, repositories, DTOs)
- Backend: `Backend/src/modules/profiles/` (services, repositories, controllers)
- Frontend: `Frontend/src/features/settings/components/` (SecuritySettings, TwoFactorSetup, SessionsManager, etc.)
- Frontend: `Frontend/src/app/(main)/profile/[username]/ProfilePageClient.tsx`

**Deviations**: None - all acceptance criteria met as specified

**Limitations**: Unit tests not yet created (integration testing completed)

**Undocumented Features Discovered**:

1. **2FA Backup Code Auto-Detection**
   - Implementation: `Backend/src/modules/auth/services/two-factor.service.ts:isBackupCode()`
   - Behavior: Automatically detects backup code (8 hex chars) vs TOTP (6 digits)
   - User benefit: No need to specify code type during login

2. **Session Current Flag**
   - Implementation: `Backend/src/modules/auth/services/session.service.ts`
   - Behavior: `isCurrent` boolean identifies current session via refresh token comparison
   - User benefit: Prevents accidental self-logout

3. **Password Strength 4-Level System**
   - Implementation: `Frontend/src/features/settings/components/PasswordStrengthIndicator.tsx`
   - Levels: weak/medium/strong/very-strong
   - Visual: Color-coded progress bar with Vietnamese labels

4. **2FA Setup Multi-Step Wizard**
   - Implementation: `Frontend/src/features/settings/components/TwoFactorSetup.tsx`
   - Flow: qrcode → verify → backup (3 steps)
   - State management: Step-based navigation with guided setup

5. **Device Type Parsing**
   - Implementation: `Frontend/src/features/settings/components/SessionsManager.tsx:parseDeviceInfo()`
   - Behavior: User-agent parsing extracts browser, OS, device type
   - Display: Vietnamese labels for user-friendly presentation

6. **Deletion Days Remaining Calculation**
   - Implementation: `Frontend/src/features/settings/components/AccountDeletionBanner.tsx`
   - Behavior: Real-time calculation of days until deletion
   - Display: Countdown keeps users informed of deadline

7. **Avatar Upload Endpoint**
   - Implementation: `Backend/src/modules/users/controllers/users.controller.ts`
   - Endpoint: POST /users/avatar (multipart/form-data)
   - Purpose: Supports account profile customization

8. **Unified Settings API**
   - Implementation: `Backend/src/modules/users/controllers/users.controller.ts`
   - Endpoints: GET /users/settings, PATCH /users/settings/{account,privacy,notifications}
   - Response: Unified UserSettingsResponse with all settings + deletion status
   - Benefit: Single source of truth for all user preferences

9. **Profile Visibility Enforcement with SEO Crawler Bypass**
   - Implementation: `Backend/src/modules/profiles/services/profiles.service.ts:getProfileWithVisibilityCheck()`
   - Behavior: Enforces PUBLIC/FRIENDS/PRIVATE at API level, bypasses for 20+ crawler patterns
   - Crawlers: googlebot, bingbot, slurp, duckduckbot, facebookexternalhit, twitterbot, linkedinbot, etc.
   - Benefit: Privacy protection without sacrificing SEO

10. **Privacy Error UI**
    - Implementation: `Frontend/src/app/(main)/profile/[username]/ProfilePageClient.tsx`
    - Behavior: Detects 403 errors, shows lock/users icon based on error message
    - Display: Vietnamese error messages with login prompt for unauthenticated users

11. **Settings Response Sanitization**
    - Implementation: `Backend/src/modules/profiles/services/profiles.service.ts:sanitizeProfileResponse()`
    - Behavior: Removes user.settings from profile responses to prevent exposure
    - Benefit: Privacy settings not leaked in public API responses
<!-- @END:IMPLEMENTATION_NOTES -->

