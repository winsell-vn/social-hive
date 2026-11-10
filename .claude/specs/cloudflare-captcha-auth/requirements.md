---
spec_version: "1.0"
feature: "cloudflare-captcha-auth"
level: 2
status: "implemented"
created: "2026-02-08"
updated: "2026-02-08"
tags: ["auth", "security", "captcha", "cloudflare", "turnstile"]
---

<!-- @SECTION:OVERVIEW -->
# Cloudflare Turnstile CAPTCHA - Auth Endpoints

Replace @Throttle() rate limiting with Cloudflare Turnstile CAPTCHA verification on register, login, and forgot-password endpoints.
<!-- @END:OVERVIEW -->

<!-- @SECTION:USER_STORIES -->
## User Stories

<!-- @STORY:US-001 priority=P1 status=done mvp=true -->
### US-001: Registration with CAPTCHA (P1) 🎯 MVP

As a user, I want CAPTCHA verification on registration so that bot registrations are prevented.

**Independent Test**: Submit registration form with valid/invalid CAPTCHA tokens and verify appropriate responses.

**Acceptance Criteria**:

<!-- @AC:AC-001 status=done -->
- [x] **AC-001**: WHEN user submits registration form, THE SYSTEM SHALL include a Cloudflare Turnstile CAPTCHA widget
<!-- @END:AC:AC-001 -->

<!-- @AC:AC-002 status=done -->
- [x] **AC-002**: WHEN CAPTCHA token is valid, THE SYSTEM SHALL proceed with registration normally
<!-- @END:AC:AC-002 -->

<!-- @AC:AC-003 status=done -->
- [x] **AC-003**: WHEN CAPTCHA token is invalid or missing, THE SYSTEM SHALL return 400 with message "Xác minh CAPTCHA thất bại"
<!-- @END:AC:AC-003 -->

<!-- @AC:AC-004 status=done -->
- [x] **AC-004**: WHEN registration endpoint is called, THE SYSTEM SHALL skip throttle/rate limit (@SkipThrottle)
<!-- @END:AC:AC-004 -->
<!-- @END:STORY:US-001 -->

<!-- @STORY:US-002 priority=P1 status=done mvp=true -->
### US-002: Login with CAPTCHA (P1) 🎯 MVP

As a user, I want CAPTCHA verification on login so that brute-force attacks are prevented.

**Independent Test**: Submit login form with valid/invalid CAPTCHA tokens and verify appropriate responses.

**Acceptance Criteria**:

<!-- @AC:AC-005 status=done -->
- [x] **AC-005**: WHEN user submits login form, THE SYSTEM SHALL include a Cloudflare Turnstile CAPTCHA widget
<!-- @END:AC:AC-005 -->

<!-- @AC:AC-006 status=done -->
- [x] **AC-006**: WHEN CAPTCHA token is valid, THE SYSTEM SHALL proceed with login normally
<!-- @END:AC:AC-006 -->

<!-- @AC:AC-007 status=done -->
- [x] **AC-007**: WHEN CAPTCHA token is invalid or missing, THE SYSTEM SHALL return 400 with message "Xác minh CAPTCHA thất bại"
<!-- @END:AC:AC-007 -->

<!-- @AC:AC-008 status=done -->
- [x] **AC-008**: WHEN login endpoint is called, THE SYSTEM SHALL skip throttle/rate limit (@SkipThrottle)
<!-- @END:AC:AC-008 -->
<!-- @END:STORY:US-002 -->

<!-- @STORY:US-003 priority=P1 status=done mvp=true -->
### US-003: Forgot Password with CAPTCHA (P1) 🎯 MVP

As a user, I want CAPTCHA verification on forgot password so that spam requests are prevented.

**Independent Test**: Submit forgot password form with valid/invalid CAPTCHA tokens and verify appropriate responses.

**Acceptance Criteria**:

<!-- @AC:AC-009 status=done -->
- [x] **AC-009**: WHEN user submits forgot password form, THE SYSTEM SHALL include a Cloudflare Turnstile CAPTCHA widget
<!-- @END:AC:AC-009 -->

<!-- @AC:AC-010 status=done -->
- [x] **AC-010**: WHEN CAPTCHA token is valid, THE SYSTEM SHALL proceed with forgot password normally
<!-- @END:AC:AC-010 -->

<!-- @AC:AC-011 status=done -->
- [x] **AC-011**: WHEN CAPTCHA token is invalid or missing, THE SYSTEM SHALL return 400 with message "Xác minh CAPTCHA thất bại"
<!-- @END:AC:AC-011 -->

<!-- @AC:AC-012 status=done -->
- [x] **AC-012**: WHEN forgot password endpoint is called, THE SYSTEM SHALL skip throttle/rate limit (@SkipThrottle)
<!-- @END:AC:AC-012 -->
<!-- @END:STORY:US-003 -->

<!-- @END:USER_STORIES -->

<!-- @SECTION:NON_FUNCTIONAL -->
## Non-Functional Requirements

<!-- @AC:NFR-001 status=done -->
- [x] **NFR-001**: THE SYSTEM SHALL complete Turnstile verification within 3 seconds
<!-- @END:AC:NFR-001 -->

<!-- @AC:NFR-002 status=done -->
- [x] **NFR-002**: THE SYSTEM SHALL display CAPTCHA widget visibly and accessibly on all 3 forms
<!-- @END:AC:NFR-002 -->

<!-- @AC:NFR-003 status=done -->
- [x] **NFR-003**: THE SYSTEM SHALL use environment variables for Turnstile keys (never hardcoded)
<!-- @END:AC:NFR-003 -->
<!-- @END:NON_FUNCTIONAL -->

<!-- @SECTION:ASSUMPTIONS -->
## Assumptions (Auto-inferred)

| Decision | Chosen | Reasoning | Alternatives |
|----------|--------|-----------|--------------|
| CAPTCHA Provider | Cloudflare Turnstile | Privacy-friendly, free tier, no user friction | reCAPTCHA, hCaptcha |
| Error Message Language | Vietnamese | Matches existing app localization | English |
| Rate Limiting Strategy | Replace throttle with CAPTCHA | CAPTCHA provides better bot protection | Keep both |
<!-- @END:ASSUMPTIONS -->

<!-- @SECTION:OUT_OF_SCOPE -->
## Out of Scope

- CAPTCHA on other endpoints (change password, etc.)
- CAPTCHA bypass for automated testing
- Admin dashboard CAPTCHA analytics
<!-- @END:OUT_OF_SCOPE -->

## Implementation Notes

**Status**: Completed

**Completed**: 2026-02-08

**Files Modified/Created:**

Backend:
- `Backend/src/modules/auth/services/turnstile.service.ts` (NEW) - Cloudflare API verification service
- `Backend/src/modules/auth/dto/register.dto.ts` - Added turnstileToken field
- `Backend/src/modules/auth/dto/login.dto.ts` - Added turnstileToken field
- `Backend/src/modules/auth/dto/forgot-password.dto.ts` - Added turnstileToken field
- `Backend/src/modules/auth/controllers/auth.controller.ts` - Added @SkipThrottle(), CAPTCHA verification
- `Backend/src/modules/auth/auth.module.ts` - Added TurnstileService provider
- `Backend/src/config/configuration.ts` - Added turnstile config
- `Backend/.env.example` - Added TURNSTILE_SECRET_KEY

Frontend:
- `Frontend/src/features/auth/types/auth.ts` - Added turnstileToken to input types
- `Frontend/src/features/auth/components/RegisterForm.tsx` - Added Turnstile widget
- `Frontend/src/features/auth/components/LoginForm.tsx` - Added Turnstile widget
- `Frontend/src/features/auth/components/ForgotPasswordForm.tsx` - Added Turnstile widget
- `Frontend/.env.example` - Added NEXT_PUBLIC_TURNSTILE_SITE_KEY

**Deviations**: None

**Limitations**: None

**Future Improvements (from code review)**:
- Extract CAPTCHA verification to a reusable `TurnstileGuard` (NestJS guard)
- Extract Turnstile widget to a reusable `TurnstileField` React component
- Add `@IsNotEmpty()` decorator to turnstileToken DTOs for defense in depth
- Type turnstileRef properly with `TurnstileInstance` instead of `any`

