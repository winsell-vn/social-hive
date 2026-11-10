---
spec_version: "1.0"
feature: "redis-caching-strategy"
type: "tasks"
---

# Redis Caching Strategy - Tasks

<!-- @PHASE:PH-1 name="Infrastructure & Priority 1" story=US-001,US-002,US-003,US-004,US-010 -->
## Phase 1: Infrastructure & Priority 1 (2 days)

### Infrastructure Setup

<!-- @TASK:T-001 status=done -->
| Task | Files | DoD | Complexity | Dependencies |
|------|-------|-----|------------|--------------|
| T-001: Create cache-keys.ts with all key generators and TTL constants | `Backend/src/redis/cache-keys.ts` | All CACHE_KEYS and CACHE_TTL exported, TypeScript compiles | Low | None |
<!-- @END:TASK:T-001 -->

<!-- @TASK:T-002 status=done -->
| Task | Files | DoD | Complexity | Dependencies |
|------|-------|-----|------------|--------------|
| T-002: Add `getOrSet()` helper method to RedisService | `Backend/src/redis/redis.service.ts` | Method returns cached data on hit, fetches and caches on miss | Medium | T-001 |
<!-- @END:TASK:T-002 -->

<!-- @TASK:T-003 status=done -->
| Task | Files | DoD | Complexity | Dependencies |
|------|-------|-----|------------|--------------|
| T-003: Add cache metrics (hit/miss counters) to RedisService | `Backend/src/redis/redis.service.ts` | Metrics logged, can be queried for monitoring | Low | T-002 |
<!-- @END:TASK:T-003 -->

<!-- @TASK:T-004 status=done -->
| Task | Files | DoD | Complexity | Dependencies |
|------|-------|-----|------------|--------------|
| T-004: Create CacheInvalidationService skeleton with event listeners | `Backend/src/redis/cache-invalidation.service.ts`, `Backend/src/redis/redis.module.ts` | Service registered, listens to EventEmitter events | Medium | T-001 |
<!-- @END:TASK:T-004 -->

### Priority 1 Caching Implementation

<!-- @TASK:T-005 status=done -->
| Task | Files | DoD | Complexity | Dependencies |
|------|-------|-----|------------|--------------|
| T-005: Implement caching for PostsService.getNewsfeed (60s TTL) | `Backend/src/modules/posts/services/posts.service.ts` | Newsfeed cached, cache hit < 50ms | Low | T-002 |
<!-- @END:TASK:T-005 -->

<!-- @TASK:T-006 status=done -->
| Task | Files | DoD | Complexity | Dependencies |
|------|-------|-----|------------|--------------|
| T-006: Implement caching for NotificationsService.getUnreadCount (30s TTL) | `Backend/src/modules/notifications/services/notifications.service.ts` | Unread count cached per user, cache hit < 50ms | Low | T-002 |
<!-- @END:TASK:T-006 -->

<!-- @TASK:T-007 status=done -->
| Task | Files | DoD | Complexity | Dependencies |
|------|-------|-----|------------|--------------|
| T-007: Implement caching for SearchService.getSuggestions (300s TTL) | `Backend/src/modules/search/services/search.service.ts` | Search suggestions cached by lowercase query | Low | T-002 |
<!-- @END:TASK:T-007 -->

<!-- @TASK:T-008 status=done -->
| Task | Files | DoD | Complexity | Dependencies |
|------|-------|-----|------------|--------------|
| T-008: Implement caching for ProfilesService.getProfileWithVisibilityCheck (300s TTL) | `Backend/src/modules/profiles/services/profiles.service.ts` | Profile data cached by username | Medium | T-002 |
<!-- @END:TASK:T-008 -->

**Checkpoint**: US-001, US-002, US-003, US-004, US-010 independently testable after this phase
<!-- @END:PHASE:PH-1 -->

<!-- @PHASE:PH-2 name="Priority 2 + N+1 Fix" story=US-005,US-006 prereq=PH-1 -->
## Phase 2: Priority 2 + N+1 Fix (2 days)

Prerequisites: Phase 1

### N+1 Query Fix

<!-- @TASK:T-009 status=done -->
| Task | Files | DoD | Complexity | Dependencies |
|------|-------|-----|------------|--------------|
| T-009: Add `batchGetMutualFriendsCounts()` to FriendsRepository | `Backend/src/modules/friends/repositories/friends.repository.ts` | Method returns Map<userId, count> with 2 queries max | High | None |
<!-- @END:TASK:T-009 -->

<!-- @TASK:T-010 status=done -->
| Task | Files | DoD | Complexity | Dependencies |
|------|-------|-----|------------|--------------|
| T-010: Refactor `getFriends()` to use batch query (fix N+1) | `Backend/src/modules/friends/repositories/friends.repository.ts` | Friends list with 50 friends uses 2 queries instead of 51 | High | T-009 |
<!-- @END:TASK:T-010 -->

### Priority 2 Caching

<!-- @TASK:T-011 status=done -->
| Task | Files | DoD | Complexity | Dependencies |
|------|-------|-----|------------|--------------|
| T-011: Implement caching for FriendsService.getFriends (300s TTL) | `Backend/src/modules/friends/services/friends.service.ts` | Friends list cached per user/page/search | Medium | T-010 |
<!-- @END:TASK:T-011 -->

<!-- @TASK:T-012 status=done -->
| Task | Files | DoD | Complexity | Dependencies |
|------|-------|-----|------------|--------------|
| T-012: Implement caching for FriendsService.getSuggestions (600s TTL) | `Backend/src/modules/friends/services/friends.service.ts` | Friend suggestions cached per user | Medium | T-002 |
<!-- @END:TASK:T-012 -->

<!-- @TASK:T-013 status=done -->
| Task | Files | DoD | Complexity | Dependencies |
|------|-------|-----|------------|--------------|
| T-013: Implement caching for profile counts in ProfilesRepository (120s TTL) | `Backend/src/modules/profiles/repositories/profiles.repository.ts` | Post/follower/following counts cached | Low | T-002 |
<!-- @END:TASK:T-013 -->

<!-- @TASK:T-014 status=done -->
| Task | Files | DoD | Complexity | Dependencies |
|------|-------|-----|------------|--------------|
| T-014: Optimize FriendsRepository.getSuggestions intermediate results | `Backend/src/modules/friends/repositories/friends.repository.ts` | Reduce redundant queries in suggestion algorithm | Medium | T-009 |
<!-- @END:TASK:T-014 -->

**Checkpoint**: US-005, US-006 independently testable after this phase
<!-- @END:PHASE:PH-2 -->

<!-- @PHASE:PH-3 name="Priority 3" story=US-007,US-008,US-009 prereq=PH-2 -->
## Phase 3: Priority 3 (1.5 days)

Prerequisites: Phase 2

<!-- @TASK:T-015 status=done -->
| Task | Files | DoD | Complexity | Dependencies |
|------|-------|-----|------------|--------------|
| T-015: Implement caching for GroupsService.getPublicGroups (300s TTL) | `Backend/src/modules/groups/services/groups.service.ts` | Public groups list cached by page/search | Low | T-002 |
<!-- @END:TASK:T-015 -->

<!-- @TASK:T-016 status=done -->
| Task | Files | DoD | Complexity | Dependencies |
|------|-------|-----|------------|--------------|
| T-016: Implement caching for GroupsService.getUserGroups (300s TTL) | `Backend/src/modules/groups/services/groups.service.ts` | User's groups cached per user | Low | T-002 |
<!-- @END:TASK:T-016 -->

<!-- @TASK:T-017 status=done -->
| Task | Files | DoD | Complexity | Dependencies |
|------|-------|-----|------------|--------------|
| T-017: Implement caching for ReactionsService.getPostReactionCounts (60s TTL) | `Backend/src/modules/reactions/services/reactions.service.ts` | Reaction counts cached per post | Low | T-002 |
<!-- @END:TASK:T-017 -->

<!-- @TASK:T-018 status=done -->
| Task | Files | DoD | Complexity | Dependencies |
|------|-------|-----|------------|--------------|
| T-018: Implement caching for AdminService.getAnalytics (60s TTL) | `Backend/src/modules/admin/services/admin.service.ts` | Analytics dashboard cached | Low | T-002 |
<!-- @END:TASK:T-018 -->

<!-- @TASK:T-019 status=done -->
| Task | Files | DoD | Complexity | Dependencies |
|------|-------|-----|------------|--------------|
| T-019: Implement caching for countPendingRequests (60s TTL) | `Backend/src/modules/friends/services/friends.service.ts` | Pending request counts cached per user | Low | T-002 |
<!-- @END:TASK:T-019 -->

**Checkpoint**: US-007, US-008, US-009 independently testable after this phase
<!-- @END:PHASE:PH-3 -->

<!-- @PHASE:PH-4 name="Invalidation & Resilience" story=US-010 prereq=PH-3 -->
## Phase 4: Invalidation & Resilience (1.5 days)

Prerequisites: Phase 3

### Cache Invalidation Implementation

<!-- @TASK:T-020 status=done -->
| Task | Files | DoD | Complexity | Dependencies |
|------|-------|-----|------------|--------------|
| T-020: Implement circuit breaker pattern (already existed) | `Backend/src/redis/redis.service.ts` | Circuit opens after 5 failures, resets after 30s | Medium | T-004 |
<!-- @END:TASK:T-020 -->

<!-- @TASK:T-021 status=done -->
| Task | Files | DoD | Complexity | Dependencies |
|------|-------|-----|------------|--------------|
| T-021: Redis health check endpoint | `Backend/src/health/indicators/redis.health.ts`, `Backend/src/health/health.controller.ts` | Health endpoint at `/health/redis` with Terminus integration | Low | T-004 |
<!-- @END:TASK:T-021 -->

<!-- @TASK:T-022 status=done -->
| Task | Files | DoD | Complexity | Dependencies |
|------|-------|-----|------------|--------------|
| T-022: Cache metrics (already existed) | `Backend/src/redis/redis.service.ts` | Hit rate, hits, misses, errors exposed via health endpoint | Medium | T-004 |
<!-- @END:TASK:T-022 -->

<!-- @TASK:T-023 status=done -->
| Task | Files | DoD | Complexity | Dependencies |
|------|-------|-----|------------|--------------|
| T-023: Cache warming on startup | `Backend/src/redis/cache-warming.service.ts` | Parallel warmup with individual error handling when `CACHE_WARMUP_ENABLED=true` | Low | T-004 |
<!-- @END:TASK:T-023 -->

<!-- @TASK:T-024 status=done -->
| Task | Files | DoD | Complexity | Dependencies |
|------|-------|-----|------------|--------------|
| T-024: Request coalescing | `Backend/src/redis/redis.service.ts` | `getOrSetCoalesced()` prevents cache stampede | Low | T-004 |
<!-- @END:TASK:T-024 -->

### Resilience Implementation

<!-- @TASK:T-025 status=done -->
| Task | Files | DoD | Complexity | Dependencies |
|------|-------|-----|------------|--------------|
| T-025: Probabilistic early refresh | `Backend/src/redis/redis.service.ts` | `getOrSetWithEarlyRefresh()` prevents thundering herd | Medium | T-002 |
<!-- @END:TASK:T-025 -->

<!-- @TASK:T-026 status=done -->
| Task | Files | DoD | Complexity | Dependencies |
|------|-------|-----|------------|--------------|
| T-026: Cache debug headers | `Backend/src/common/interceptors/cache-debug.interceptor.ts` | X-Cache-Status, X-Cache-Key, X-Cache-Age, X-Cache-TTL headers | Medium | T-025 |
<!-- @END:TASK:T-026 -->

### Testing

<!-- @TASK:T-027 status=done -->
| Task | Files | DoD | Complexity | Dependencies |
|------|-------|-----|------------|--------------|
| T-027: Graceful degradation (already existed) | All service files with caching | Application works when Redis unavailable (slower) | Low | T-001 |
<!-- @END:TASK:T-027 -->

<!-- @TASK:T-028 status=done -->
| Task | Files | DoD | Complexity | Dependencies |
|------|-------|-----|------------|--------------|
| T-028: Enhanced logging | `Backend/src/redis/redis.service.ts` | `logCacheStats()` method for cache statistics | Medium | T-025 |
<!-- @END:TASK:T-028 -->

**Checkpoint**: All user stories complete, full cache invalidation working, resilience tested
<!-- @END:PHASE:PH-4 -->

<!-- @SECTION:SUMMARY -->
## Task Summary

| Phase | Tasks | Estimated Duration | Stories Covered |
|-------|-------|-------------------|-----------------|
| Phase 1 | T-001 to T-008 | 2 days | US-001, US-002, US-003, US-004, US-010 |
| Phase 2 | T-009 to T-014 | 2 days | US-005, US-006 |
| Phase 3 | T-015 to T-019 | 1.5 days | US-007, US-008, US-009 |
| Phase 4 | T-020 to T-028 | 1.5 days | US-010 (completion) |
| **Total** | **28 tasks** | **7 days** | **All 10 stories** |

### Complexity Distribution
- Low: 15 tasks
- Medium: 10 tasks
- High: 3 tasks (N+1 fix related)
<!-- @END:SUMMARY -->

