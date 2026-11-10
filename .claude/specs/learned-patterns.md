# Learned Patterns

This file captures patterns discovered during implementation that should be followed consistently.

---

## [2026-02-07] API Response Array Safety

**Context**: Bug fix for `services?.map is not a function` in AdminPricingTiersPage
**Pattern**: When fetching array data from API, always validate the response is actually an array before returning from React Query hooks
**Reason**: API responses may return unexpected structures (null, undefined, object instead of array) due to errors, caching issues, or backend changes. Using `Array.isArray(data) ? data : []` prevents runtime errors.

```typescript
// ✅ Good - defensive
const data = response.data?.data;
return Array.isArray(data) ? data : [];

// ❌ Bad - assumes structure
return response.data.data;
```

---

## [2026-02-07] API Response Structure Mismatch

**Context**: Bug fix for "0 services" in pricing wizard - backend returned `{ data: [array] }` but frontend expected `{ data: { services: [array] } }`
**Pattern**: When backend API response structure doesn't match frontend type expectations, wrap/transform the response in the React Query hook's `queryFn` to match the expected type
**Reason**: Keeps the fix localized to one place (the API hook) rather than updating all consumers. Always verify ALL consumers of a hook before making changes.

```typescript
// ✅ Good - transform in hook to match expected type
const response = await apiClient.get<{ data: any }>('/pricing/public');
const data = response.data.data;
return { services: Array.isArray(data) ? data : [] } as PublicPricingResponse;
```

---

## [2026-02-07] Triple-Nested API Response Unwrapping

**Context**: Bug fix for "0 services" in pricing wizard - backend returns `{ success, data: { data: [...] }, timestamp }` and apiClient does NOT unwrap the wrapper
**Pattern**: When backend wraps responses in `{ success, data, timestamp }` and apiClient passes through unchanged, handle triple-nesting defensively:
- `response.data` = axios unwraps HTTP body → `{ success, data: { data: [...] }, timestamp }`
- `response.data.data` = controller's return value → `{ data: [...] }`
- `response.data.data.data` = actual array → `[...]`

**Reason**: The apiClient interceptor does NOT unwrap the `{ success, data, timestamp }` wrapper. Always check both `response.data?.data?.data` and `response.data?.data` to handle both wrapped and unwrapped responses.

```typescript
// ✅ Good - handles triple-nesting defensively
const rawData = response.data?.data?.data || response.data?.data;
const services = Array.isArray(rawData) ? rawData : (Array.isArray(rawData?.data) ? rawData.data : []);

// ❌ Bad - assumes only double-nesting
const data = response.data.data;
return Array.isArray(data) ? data : []; // Returns [] when data is { data: [...] }
```

---

## [2026-02-11] Auth Service Error Logging

**Context**: Bug fix for "Internal server error" in login flow - error occurred after Turnstile verification but actual cause was hidden
**Pattern**: Wrap critical auth flows (login, 2FA verification) in try/catch with detailed logging using NestJS Logger. Log each step (profile fetch, token generation, session creation) to identify failure points.
**Reason**: "Internal server error" from HttpExceptionFilter hides the actual error. Debug logging helps identify which step fails (Prisma, Redis session, JWT generation, etc.)

```typescript
// ✅ Good - detailed logging for debugging
try {
  this.logger.debug(`Fetching profile for user ${user.id}`);
  const userWithProfile = await this.userRepository.findByIdWithProfile(user.id);

  if (!userWithProfile?.profile) {
    this.logger.error(`User ${user.id} has no profile`);
    throw new BadRequestException('Hồ sơ người dùng không tồn tại');
  }
  // ... rest of flow
} catch (error) {
  if (error instanceof BadRequestException) throw error;
  this.logger.error(`Login failed: ${error.message}`, error.stack);
  throw error;
}
```

---

## [2026-02-11] R2 Cleanup Fire-and-Forget Pattern

**Context**: R2 CDN optimization - cleaning up old images when avatar/cover/post images are updated
**Pattern**: Use fire-and-forget with `.catch()` for R2 cleanup AFTER the primary DB operation succeeds. Always extract key with null checks before deletion.
**Reason**: User operation should not be blocked by cleanup. R2 DeleteObject is idempotent, so double-deletes from race conditions are safe. Log errors for monitoring but don't throw.

```typescript
// ✅ Good - fire-and-forget after DB success
const updatedProfile = await this.repository.update(userId, { avatar: newUrl });
if (oldUrl) {
  const key = this.uploadService.extractKeyFromUrl(oldUrl);
  if (key) {
    this.uploadService.deleteImageWithRetry(key).catch(err => {
      this.logger.error(`Cleanup failed for ${key}: ${err.message}`);
    });
  }
}

// ❌ Bad - blocking user operation on cleanup
await this.uploadService.deleteImage(oldKey); // User waits for this
```

---

## [2026-02-11] Race Condition Guard for Unique Constraints

**Context**: Post-to-Blog sync implementation - createFromPost could fail with unique constraint violation on concurrent requests
**Pattern**: When creating records with unique constraints (like sourcePostId), always check for existing record before create, even if caller should have checked. Return existing record instead of throwing.
**Reason**: Concurrent requests can pass the caller's check but fail at DB level. Idempotent create (return existing if found) is safer than failing.

```typescript
// ✅ Good - idempotent create with race condition guard
async createFromPost(data: { sourcePostId: string; ... }) {
  const existing = await this.findBySourcePostId(data.sourcePostId);
  if (existing) return existing; // Already synced, return existing
  // ... proceed with create
}

// ❌ Bad - assumes caller checked, fails on race condition
async createFromPost(data: { sourcePostId: string; ... }) {
  // No check - will throw unique constraint error on race condition
  return this.prisma.blogPost.create({ data });
}
```

---

## [2026-02-12] Content Negotiation Cache Key Must Include Format

**Context**: AC-032 content negotiation implementation - serving WebP or JPEG based on Accept header
**Pattern**: When serving different formats based on Accept header, the cache key MUST include the format to prevent serving wrong format from cache.
**Reason**: Without format in cache key, a WebP cached for Chrome would be served to Safari (which doesn't support WebP), causing broken images.

```typescript
// ✅ Good - format in cache key
const format = supportsWebP ? 'webp' : 'jpeg';
const cacheKey = `${id}:${variant}:${format}`;

// ❌ Bad - same cache key for all formats
const cacheKey = `${id}:${variant}`; // Safari gets Chrome's cached WebP
```

---

## [2026-02-12] Vary Header Required for Content Negotiation

**Context**: AC-032 content negotiation - CDN/proxy must cache different versions based on Accept header
**Pattern**: Always set `Vary: Accept` header when response content depends on Accept header.
**Reason**: Without Vary header, CDN/proxy may cache one format and serve it to all clients regardless of their Accept header.

```typescript
// ✅ Good - Vary header for proper CDN behavior
res.setHeader('Vary', 'Accept');
res.setHeader('Content-Type', responseMimeType);

// ❌ Bad - missing Vary header
res.setHeader('Content-Type', responseMimeType); // CDN caches wrong format
```

---

## [2026-02-21] React Query Mutation Must Await invalidateQueries for Immediate UI Update

**Context**: Profile edit sidebar - skills not updating immediately after save, required F5 refresh
**Pattern**: When mutation's `onSuccess` invalidates queries and UI needs to reflect changes immediately, use `await queryClient.invalidateQueries()` instead of fire-and-forget.
**Reason**: `invalidateQueries()` without await marks queries as stale but doesn't wait for refetch. If the calling code closes a modal or navigates away immediately after `mutateAsync()` resolves, the UI won't have the new data yet.

```typescript
// ✅ Good - await ensures refetch completes before mutateAsync resolves
onSuccess: async () => {
  await queryClient.invalidateQueries({ queryKey: profileKeys.all })
}

// ❌ Bad - fire-and-forget, UI may close before refetch completes
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: profileKeys.all })
}
```

---

## [2026-02-24] MySQL Raw SQL BigInt Arithmetic Operations

**Context**: Bug fix for "Cannot convert a BigInt value to a number" in newsfeed endpoint - MySQL CASE expressions return bigint
**Pattern**: When using Prisma `$queryRaw` with MySQL, always convert numeric results (especially from CASE expressions, COUNT, SUM) to Number immediately after query, BEFORE any arithmetic operations or comparisons.
**Reason**: MySQL returns bigint for CASE expressions and aggregate functions. JavaScript cannot perform arithmetic (`a - b`) or comparison (`a !== b`) between BigInt and Number types. The `BigInt.prototype.toJSON` fix only helps JSON serialization, not arithmetic.

```typescript
// ✅ Good - convert BigInt to Number immediately after query
const rawPosts = await prisma.$queryRaw<any[]>`
  SELECT id, CASE WHEN ... THEN 100 ELSE 60 END as priority_score FROM post
`;
const posts = rawPosts.map(p => ({
  ...p,
  priority_score: Number(p.priority_score),
}));
posts.sort((a, b) => b.priority_score - a.priority_score); // Safe

// ❌ Bad - using BigInt directly in arithmetic
const posts = await prisma.$queryRaw<any[]>`...`;
posts.sort((a, b) => b.priority_score - a.priority_score); // TypeError!
```

---