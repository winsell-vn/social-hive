---
spec_version: "1.0"
feature: "redis-caching-strategy"
level: 3
status: "done"
created: "2026-01-31"
updated: "2026-01-31"
tags: ["caching", "redis", "performance", "optimization"]
---

<!-- @SECTION:OVERVIEW -->
# Redis Caching Strategy

Implement comprehensive Redis caching across the social media platform to improve response times, reduce database load, and enhance user experience. This feature introduces cache-aside pattern with event-driven invalidation for all high-traffic endpoints.
<!-- @END:OVERVIEW -->

<!-- @SECTION:USER_STORIES -->
## User Stories

<!-- @STORY:US-001 priority=P1 status=done mvp=true -->
### US-001: Newsfeed Caching (P1) 🎯 MVP

As a user, I want the newsfeed to load quickly so that I can browse content without waiting.

**Independent Test**: Request newsfeed endpoint, verify response time < 100ms on cache hit.

**Acceptance Criteria**:
<!-- @AC:AC-001 status=done -->
- [x] **AC-001**: WHEN user requests newsfeed THE SYSTEM SHALL check Redis cache first before querying database.
<!-- @END:AC:AC-001 -->
<!-- @AC:AC-002 status=done -->
- [x] **AC-002**: IF cache hit THEN THE SYSTEM SHALL return cached data within 50ms.
<!-- @END:AC:AC-002 -->
<!-- @AC:AC-003 status=done -->
- [x] **AC-003**: IF cache miss THEN THE SYSTEM SHALL query database, cache result with 60 second TTL, and return data.
<!-- @END:AC:AC-003 -->
<!-- @AC:AC-004 status=done -->
- [x] **AC-004**: WHEN new post is published THE SYSTEM SHALL invalidate all newsfeed cache entries.
<!-- @END:AC:AC-004 -->
<!-- @END:STORY:US-001 -->

<!-- @STORY:US-002 priority=P1 status=done mvp=true -->
### US-002: Profile Caching (P1) 🎯 MVP

As a user, I want profile pages to load quickly so that I can view user information without delay.

**Independent Test**: Request profile endpoint, verify response time < 100ms on cache hit.

**Acceptance Criteria**:
<!-- @AC:AC-005 status=done -->
- [x] **AC-005**: WHEN user views profile THE SYSTEM SHALL check cache for profile data using username as key.
<!-- @END:AC:AC-005 -->
<!-- @AC:AC-006 status=done -->
- [x] **AC-006**: IF cache hit THEN THE SYSTEM SHALL return cached profile within 50ms.
<!-- @END:AC:AC-006 -->
<!-- @AC:AC-007 status=done -->
- [x] **AC-007**: THE SYSTEM SHALL cache profile data with 300 second TTL.
<!-- @END:AC:AC-007 -->
<!-- @AC:AC-008 status=done -->
- [x] **AC-008**: WHEN profile is updated THE SYSTEM SHALL invalidate profile cache for that username.
<!-- @END:AC:AC-008 -->
<!-- @END:STORY:US-002 -->

<!-- @STORY:US-003 priority=P1 status=done mvp=true -->
### US-003: Notification Unread Count Caching (P1) 🎯 MVP

As a user, I want notification count to update without slow polling so that I stay informed efficiently.

**Independent Test**: Poll unread count endpoint, verify response time < 50ms on cache hit.

**Acceptance Criteria**:
<!-- @AC:AC-009 status=done -->
- [x] **AC-009**: WHEN frontend polls unread count THE SYSTEM SHALL return cached count.
<!-- @END:AC:AC-009 -->
<!-- @AC:AC-010 status=done -->
- [x] **AC-010**: THE SYSTEM SHALL cache unread count with 30 second TTL for freshness.
<!-- @END:AC:AC-010 -->
<!-- @AC:AC-011 status=done -->
- [x] **AC-011**: WHEN notification is created THE SYSTEM SHALL invalidate unread count cache for recipient.
<!-- @END:AC:AC-011 -->
<!-- @AC:AC-012 status=done -->
- [x] **AC-012**: WHEN notification is marked as read THE SYSTEM SHALL invalidate unread count cache for user.
<!-- @END:AC:AC-012 -->
<!-- @END:STORY:US-003 -->

<!-- @STORY:US-004 priority=P1 status=done mvp=true -->
### US-004: Search Suggestions Caching (P1) 🎯 MVP

As a user, I want search autocomplete to be instant so that I can find content quickly.

**Independent Test**: Request search suggestions, verify response time < 50ms on cache hit.

**Acceptance Criteria**:
<!-- @AC:AC-013 status=done -->
- [x] **AC-013**: WHEN user types search query THE SYSTEM SHALL return cached suggestions if available.
<!-- @END:AC:AC-013 -->
<!-- @AC:AC-014 status=done -->
- [x] **AC-014**: THE SYSTEM SHALL use lowercase query as cache key component.
<!-- @END:AC:AC-014 -->
<!-- @AC:AC-015 status=done -->
- [x] **AC-015**: THE SYSTEM SHALL cache search suggestions with 300 second TTL.
<!-- @END:AC:AC-015 -->
<!-- @END:STORY:US-004 -->

<!-- @STORY:US-005 priority=P2 status=done mvp=false -->
### US-005: Friend Suggestions Caching (P2)

As a user, I want friend suggestions to load quickly so that I can discover new connections.

**Independent Test**: Request friend suggestions, verify response time < 100ms on cache hit.

**Acceptance Criteria**:
<!-- @AC:AC-016 status=done -->
- [x] **AC-016**: THE SYSTEM SHALL cache friend-of-friends query results per user.
<!-- @END:AC:AC-016 -->
<!-- @AC:AC-017 status=done -->
- [x] **AC-017**: THE SYSTEM SHALL cache friend suggestions with 600 second TTL due to query complexity.
<!-- @END:AC:AC-017 -->
<!-- @AC:AC-018 status=done -->
- [x] **AC-018**: WHEN friendship status changes THE SYSTEM SHALL invalidate friend suggestions cache for affected users.
<!-- @END:AC:AC-018 -->
<!-- @END:STORY:US-005 -->

<!-- @STORY:US-006 priority=P2 status=done mvp=false -->
### US-006: Friends List Caching with N+1 Fix (P2)

As a user, I want my friends list to load quickly with mutual friend counts displayed.

**Independent Test**: Request friends list with 50 friends, verify single batch query for mutual counts.

**Acceptance Criteria**:
<!-- @AC:AC-019 status=done -->
- [x] **AC-019**: WHEN loading friends list THE SYSTEM SHALL use batch query for mutual friend counts (fix N+1 problem).
<!-- @END:AC:AC-019 -->
<!-- @AC:AC-020 status=done -->
- [x] **AC-020**: THE SYSTEM SHALL cache complete friends list with mutual counts.
<!-- @END:AC:AC-020 -->
<!-- @AC:AC-021 status=done -->
- [x] **AC-021**: THE SYSTEM SHALL cache friends list with 300 second TTL.
<!-- @END:AC:AC-021 -->
<!-- @AC:AC-022 status=done -->
- [x] **AC-022**: WHEN friendship changes THE SYSTEM SHALL invalidate friends list cache for affected users.
<!-- @END:AC:AC-022 -->
<!-- @END:STORY:US-006 -->

<!-- @STORY:US-007 priority=P3 status=done mvp=false -->
### US-007: Groups Caching (P3)

As a user, I want group lists to load quickly so that I can browse communities efficiently.

**Independent Test**: Request public groups list, verify response time < 100ms on cache hit.

**Acceptance Criteria**:
<!-- @AC:AC-023 status=done -->
- [x] **AC-023**: THE SYSTEM SHALL cache public groups list with 300 second TTL.
<!-- @END:AC:AC-023 -->
<!-- @AC:AC-024 status=done -->
- [x] **AC-024**: THE SYSTEM SHALL cache user's groups list per user with 300 second TTL.
<!-- @END:AC:AC-024 -->
<!-- @AC:AC-025 status=done -->
- [x] **AC-025**: WHEN user joins or leaves group THE SYSTEM SHALL invalidate user's groups cache.
<!-- @END:AC:AC-025 -->
<!-- @END:STORY:US-007 -->

<!-- @STORY:US-008 priority=P3 status=done mvp=false -->
### US-008: Reaction Counts Caching (P3)

As a user, I want reaction counts to display quickly on posts.

**Independent Test**: Request post reaction counts, verify response time < 50ms on cache hit.

**Acceptance Criteria**:
<!-- @AC:AC-026 status=done -->
- [x] **AC-026**: THE SYSTEM SHALL cache post reaction counts with 60 second TTL.
<!-- @END:AC:AC-026 -->
<!-- @AC:AC-027 status=done -->
- [x] **AC-027**: WHEN reaction is added or removed THE SYSTEM SHALL invalidate reaction counts cache for that post.
<!-- @END:AC:AC-027 -->
<!-- @END:STORY:US-008 -->

<!-- @STORY:US-009 priority=P3 status=done mvp=false -->
### US-009: Admin Analytics Caching (P3)

As an admin, I want the dashboard to load quickly so that I can monitor platform health.

**Independent Test**: Request admin analytics, verify response time < 200ms on cache hit.

**Acceptance Criteria**:
<!-- @AC:AC-028 status=done -->
- [x] **AC-028**: THE SYSTEM SHALL cache aggregated analytics with 60 second TTL.
<!-- @END:AC:AC-028 -->
<!-- @AC:AC-029 status=done -->
- [x] **AC-029**: THE SYSTEM SHALL accept slightly stale analytics data for performance.
<!-- @END:AC:AC-029 -->
<!-- @END:STORY:US-009 -->

<!-- @STORY:US-010 priority=P1 status=done mvp=true -->
### US-010: Cache Infrastructure (P1) 🎯 MVP

As a developer, I want centralized cache management so that caching is consistent and maintainable.

**Independent Test**: Verify cache key generators produce consistent keys, circuit breaker activates on Redis failure.

**Acceptance Criteria**:
<!-- @AC:AC-030 status=done -->
- [x] **AC-030**: THE SYSTEM SHALL provide centralized cache key management via CACHE_KEYS constant.
<!-- @END:AC:AC-030 -->
<!-- @AC:AC-031 status=done -->
- [x] **AC-031**: THE SYSTEM SHALL provide cache invalidation service listening to domain events.
<!-- @END:AC:AC-031 -->
<!-- @AC:AC-032 status=done -->
- [x] **AC-032**: THE SYSTEM SHALL implement circuit breaker pattern for Redis failures.
<!-- @END:AC:AC-032 -->
<!-- @AC:AC-033 status=done -->
- [x] **AC-033**: IF Redis is unavailable THEN THE SYSTEM SHALL gracefully fallback to database queries.
<!-- @END:AC:AC-033 -->
<!-- @END:STORY:US-010 -->

<!-- @END:USER_STORIES -->

<!-- @SECTION:NON_FUNCTIONAL_REQUIREMENTS -->
## Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-01 | Cache hit latency | < 50ms |
| NFR-02 | Target cache hit rate | > 80% |
| NFR-03 | Redis unavailability handling | Application must work (slower) when Redis unavailable |
| NFR-04 | User data isolation | User-specific data must use user-isolated cache keys |
<!-- @END:NON_FUNCTIONAL_REQUIREMENTS -->

<!-- @SECTION:ASSUMPTIONS -->
## Assumptions (Auto-inferred)

| Decision | Chosen | Reasoning | Alternatives |
|----------|--------|-----------|--------------|
| Cache pattern | Cache-aside | Industry standard, simple to implement, works well with read-heavy workloads | Write-through, Write-behind |
| Invalidation strategy | Event-driven | Ensures cache consistency, leverages existing NestJS patterns | TTL-only, Manual invalidation |
| TTL strategy | Variable per data type | Balance freshness vs performance based on data volatility | Fixed TTL for all |
| Serialization | JSON | Native support in RedisService, human-readable | MessagePack, Protobuf |
<!-- @END:ASSUMPTIONS -->

<!-- @SECTION:OUT_OF_SCOPE -->
## Out of Scope

- Redis Cluster setup (single instance assumed)
- Cache warming strategies
- Cache compression
- Distributed locking
- Real-time cache metrics dashboard
<!-- @END:OUT_OF_SCOPE -->

<!-- @SECTION:SUCCESS_METRICS -->
## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Newsfeed p95 latency | < 100ms | Application metrics |
| Profile page p95 latency | < 100ms | Application metrics |
| Database query reduction | > 50% | Query count comparison |
| Cache hit rate | > 80% | Redis metrics |
<!-- @END:SUCCESS_METRICS -->

