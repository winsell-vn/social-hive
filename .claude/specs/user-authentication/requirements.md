---
spec_version: "1.0"
feature: "user-authentication"
level: 2
status: "active"
created: "2026-01-30"
updated: "2026-02-11"
tags: ["auth", "session", "security", "remember-me", "jwt"]
synced_from: "Backend/src/modules/auth/services/auth.service.ts"
---

<!-- @SECTION:OVERVIEW -->
# Remember Me with Smart Session Renewal

Add "Ghi nhớ đăng nhập" (Remember Me) checkbox to login page with smart session renewal that automatically extends session when user is active, while maintaining security through token rotation.
<!-- @END:OVERVIEW -->

<!-- @SECTION:USER_STORIES -->
## User Stories

<!-- @STORY:US-001 priority=P1 status=done mvp=true -->
### US-001: Remember Me Checkbox (P1) 🎯 MVP

As a user, I want to check "Ghi nhớ đăng nhập" when logging in so that I stay logged in for 30 days without re-entering credentials.

**Independent Test**: Login with checkbox checked, close browser, reopen after 24+ hours - should still be logged in.
<!-- @END:STORY:US-001 -->

<!-- @STORY:US-002 priority=P1 status=done mvp=true -->
### US-002: Dynamic Session Expiry (P1) 🎯 MVP

As a system, I want to set different session durations based on rememberMe flag so that security is balanced with user convenience.

**Independent Test**: Login without rememberMe - session expires in 24h. Login with rememberMe - session expires in 30d.
<!-- @END:STORY:US-002 -->

<!-- @STORY:US-003 priority=P2 status=done mvp=false -->
### US-003: Smart Session Renewal (P2)

As a user, I want my session to automatically extend when I'm actively using the app so that I don't get logged out during active use.

**Independent Test**: Stay active for 20 minutes, verify token refresh occurs when access token nears expiry.
<!-- @END:STORY:US-003 -->

<!-- @STORY:US-004 priority=P2 status=done mvp=false -->
### US-004: Idle Timeout Warning (P2)

As a user without rememberMe, I want to see a warning before being logged out due to inactivity so that I can choose to stay logged in.

**Independent Test**: Login without rememberMe, stay idle for 30 minutes - warning modal appears with "Stay logged in" button.
<!-- @END:STORY:US-004 -->

<!-- @STORY:US-005 priority=P2 status=done mvp=false -->
### US-005: Auto-Logout on Inactivity (P2)

As a system, I want to automatically log out non-rememberMe users after 1 hour of inactivity so that shared/public computers remain secure.

**Independent Test**: Login without rememberMe, stay idle for 1 hour - automatically logged out.
<!-- @END:STORY:US-005 -->

<!-- @STORY:US-006 priority=P2 status=done mvp=false -->
### US-006: Username in JWT Token (P2)

As a system, I want to include username in the JWT access token payload so that WebSocket connections can identify users for real-time features without additional database queries.

**Independent Test**: Login successfully, decode access token - verify username field is present in payload.
**Inferred from**: `Backend/src/modules/auth/services/auth.service.ts:670-678`
<!-- @END:STORY:US-006 -->

<!-- @END:USER_STORIES -->

<!-- @SECTION:ACCEPTANCE_CRITERIA -->
## Acceptance Criteria

<!-- @CRITERIA_GROUP:login_ui story=US-001 -->
### Login UI

<!-- @AC:AC-001 status=done -->
- [x] **AC-001**: WHEN the login page loads, THE SYSTEM SHALL display a "Ghi nhớ đăng nhập" checkbox below the password field.
<!-- @END:AC:AC-001 -->

<!-- @AC:AC-002 status=done -->
- [x] **AC-002**: WHEN the user submits login with rememberMe checked, THE SYSTEM SHALL pass `rememberMe: true` to the backend.
<!-- @END:AC:AC-002 -->

<!-- @AC:AC-003 status=done -->
- [x] **AC-003**: THE SYSTEM SHALL persist the rememberMe preference in the auth store with localStorage.
<!-- @END:AC:AC-003 -->

<!-- @END:CRITERIA_GROUP:login_ui -->

<!-- @CRITERIA_GROUP:session_duration story=US-002 -->
### Session Duration

<!-- @AC:AC-004 status=done -->
- [x] **AC-004**: WHEN user logs in without rememberMe, THE SYSTEM SHALL set refresh token expiry to 24 hours.
<!-- @END:AC:AC-004 -->

<!-- @AC:AC-005 status=done -->
- [x] **AC-005**: WHEN user logs in with rememberMe, THE SYSTEM SHALL set refresh token expiry to 30 days.
<!-- @END:AC:AC-005 -->

<!-- @AC:AC-006 status=done -->
- [x] **AC-006**: THE SYSTEM SHALL keep access token expiry at 15 minutes regardless of rememberMe.
<!-- @END:AC:AC-006 -->

<!-- @AC:AC-007 status=done -->
- [x] **AC-007**: THE SYSTEM SHALL store rememberMe flag in Session model for server-side validation.
<!-- @END:AC:AC-007 -->

<!-- @END:CRITERIA_GROUP:session_duration -->

<!-- @CRITERIA_GROUP:smart_renewal story=US-003 -->
### Smart Session Renewal

<!-- @AC:AC-008 status=done -->
- [x] **AC-008**: WHEN user activity is detected and access token expires within 5 minutes, THE SYSTEM SHALL trigger token refresh.
<!-- @END:AC:AC-008 -->

<!-- @AC:AC-009 status=done -->
- [x] **AC-009**: THE SYSTEM SHALL debounce activity detection to 30 seconds to prevent excessive API calls.
<!-- @END:AC:AC-009 -->

<!-- @AC:AC-010 status=done -->
- [x] **AC-010**: WHILE the browser tab is hidden, THE SYSTEM SHALL pause activity tracking.
<!-- @END:AC:AC-010 -->

<!-- @AC:AC-011 status=done -->
- [x] **AC-011**: THE SYSTEM SHALL track mouse, keyboard, scroll, and touch events as user activity.
<!-- @END:AC:AC-011 -->

<!-- @END:CRITERIA_GROUP:smart_renewal -->

<!-- @CRITERIA_GROUP:idle_timeout story=US-004,US-005 -->
### Idle Timeout (Non-RememberMe Only)

<!-- @AC:AC-012 status=done -->
- [x] **AC-012**: WHILE user is logged in without rememberMe and idle for 30 minutes, THE SYSTEM SHALL display an idle warning modal.
<!-- @END:AC:AC-012 -->

<!-- @AC:AC-013 status=done -->
- [x] **AC-013**: WHEN user clicks "Stay logged in" on idle warning, THE SYSTEM SHALL reset the idle timer and dismiss the modal.
<!-- @END:AC:AC-013 -->

<!-- @AC:AC-014 status=done -->
- [x] **AC-014**: IF user remains idle for 1 hour without rememberMe, THEN THE SYSTEM SHALL automatically log out the user.
<!-- @END:AC:AC-014 -->

<!-- @AC:AC-015 status=done -->
- [x] **AC-015**: WHERE rememberMe is enabled, THE SYSTEM SHALL NOT apply idle timeout (rely on 30-day absolute expiry).
<!-- @END:AC:AC-015 -->

<!-- @END:CRITERIA_GROUP:idle_timeout -->

<!-- @CRITERIA_GROUP:security -->
### Security

<!-- @AC:AC-016 status=done -->
- [x] **AC-016**: THE SYSTEM SHALL maintain existing token rotation on refresh (new refresh token issued each time).
<!-- @END:AC:AC-016 -->

<!-- @AC:AC-017 status=done -->
- [x] **AC-017**: THE SYSTEM SHALL enforce absolute session timeout of 30 days maximum regardless of activity.
<!-- @END:AC:AC-017 -->

<!-- @END:CRITERIA_GROUP:security -->

<!-- @CRITERIA_GROUP:jwt_payload story=US-006 -->
### JWT Token Payload

<!-- @AC:AC-018 status=done -->
- [x] **AC-018**: WHEN generating an access token, THE SYSTEM SHALL include the username field in the JWT payload.
<!-- @END:AC:AC-018 -->

<!-- @AC:AC-019 status=done -->
- [x] **AC-019**: WHEN the user profile exists, THE SYSTEM SHALL fetch the username from the user profile before token generation.
<!-- @END:AC:AC-019 -->

<!-- @AC:AC-020 status=done -->
- [x] **AC-020**: THE SYSTEM SHALL include username in access tokens for login, 2FA verification, password change, and token refresh operations.
<!-- @END:AC:AC-020 -->

<!-- @END:CRITERIA_GROUP:jwt_payload -->

<!-- @END:ACCEPTANCE_CRITERIA -->

<!-- @SECTION:IMPLEMENTATION_NOTES -->
## Implementation Notes

### Completed: 2026-01-30 (Remember Me Feature)

**Status**: Completed

**Files Modified:**
- **Backend (6 files)**:
  - `Backend/prisma/schema.prisma` - Added `rememberMe Boolean @default(false)` to Session model
  - `Backend/src/config/configuration.ts` - Added session duration configs
  - `Backend/src/modules/auth/dto/login.dto.ts` - Added `rememberMe?: boolean` field
  - `Backend/src/modules/auth/services/auth.service.ts` - Dynamic session expiry logic
  - `Backend/src/modules/auth/services/session.service.ts` - Store rememberMe in session
  - `Backend/src/modules/auth/services/auth.service.spec.ts` - Updated tests

- **Frontend (8 files)**:
  - `Frontend/src/features/auth/types/auth.ts` - Added rememberMe to LoginInput and AuthState
  - `Frontend/src/features/auth/api/auth.ts` - Pass rememberMe to backend
  - `Frontend/src/features/auth/stores/auth-store.ts` - Store rememberMe preference
  - `Frontend/src/features/auth/components/LoginForm.tsx` - Added checkbox UI
  - `Frontend/src/features/auth/hooks/useActivityTracker.ts` - NEW: Activity tracking hook
  - `Frontend/src/features/auth/components/IdleWarningModal.tsx` - NEW: Idle warning modal
  - `Frontend/src/app/(dashboard)/layout.tsx` - Integrated activity tracker
  - `Frontend/src/components/ui/checkbox.tsx` - NEW: Checkbox component

**Dependencies Added:**
- `jwt-decode` - For decoding JWT tokens to check expiry
- `@radix-ui/react-checkbox` - For checkbox UI component

**Database Migration:**
- `20260130100000_add_remember_me_to_session` - Added `rememberMe Boolean @default(false)` to Session model

**Deviations from Original Design:**
- None - implementation follows spec exactly

**Known Limitations:**
- Tokens stored in localStorage (XSS risk accepted for now)
- Activity tracking pauses when tab is hidden (by design)

### Updated: 2026-02-11 (JWT Token Enhancement)

**Status**: Synced from implementation

**Change Summary:**
- Added username field to JWT access token payload for WebSocket real-time features

**Files Modified:**
- **Backend (1 file)**:
  - `Backend/src/modules/auth/services/auth.service.ts:670-678` - Modified `generateAccessToken()` to include username in JWT payload
  - Updated in methods: `login()` (line 205), `refreshTokens()` (line 294), `changePassword()` (line 409), `verifyLogin2FA()` (line 606)

**Implementation Details:**
- Username is fetched from user profile via `findByIdWithProfile()` before token generation
- All token generation paths (login, 2FA, refresh, password change) now include username
- Username field is optional in JWT payload to handle edge cases where profile might not exist

**Purpose:**
- Enables WebSocket connections to identify users without additional database queries
- Supports real-time features like typing indicators in P2P messaging

**Deviations from Original Design:**
- None - this is a backward-compatible enhancement

<!-- @END:IMPLEMENTATION_NOTES -->

<!-- @SECTION:ASSUMPTIONS -->
## Assumptions (Auto-inferred)

| Decision | Chosen | Reasoning | Alternatives |
|----------|--------|-----------|--------------|
| Idle warning timing | 30 minutes | Balance security/UX for shared computers | 15 min, 45 min |
| Auto-logout timing | 1 hour | Standard for banking/sensitive apps | 30 min, 2 hours |
| Activity debounce | 30 seconds | Prevent battery drain, reduce API calls | 10s, 60s |
| Token refresh threshold | 5 minutes before expiry | Enough buffer for network latency | 2 min, 10 min |
| RememberMe duration | 30 days | Industry standard for "remember me" | 14 days, 90 days |

> These assumptions were made based on industry standards and security best practices.
<!-- @END:ASSUMPTIONS -->

<!-- @SECTION:OUT_OF_SCOPE -->
## Out of Scope

- HttpOnly cookie migration (future security enhancement)
- Device fingerprinting for session validation
- Geolocation-based session validation
- "Trust this device" feature with device registration
- Session activity logging/audit trail
<!-- @END:OUT_OF_SCOPE -->

