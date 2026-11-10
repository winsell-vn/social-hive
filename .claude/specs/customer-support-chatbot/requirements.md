---
spec_version: "1.0"
feature: "customer-support-chatbot"
level: 2
status: "active"
created: "2026-02-07"
updated: "2026-02-11"
synced_from: "Backend/src/modules/chatbot/"
---

<!-- @SECTION:OVERVIEW -->
# Customer Support Chatbot — "Hưng DPS"

AI-powered customer support chatbot integrated into the pricing page (`/bang-gia#buoc-1`). Uses Groq LLM (llama-3.3-70b-versatile) to provide personalized service recommendations based on real pricing data. Persona: "Hưng DPS" — male expert programmer/BA who provides caring customer support in Vietnamese or English only.

## Goals
- Help pricing page visitors understand services and choose the right package
- Provide instant, accurate responses based on real service/pricing data
- Convert visitors to quote requests through personalized recommendations
- Maintain professional yet friendly "Hưng DPS" persona consistently

## Non-Goals
- Persistent conversation history across sessions (ephemeral only)
- Multi-language support beyond Vietnamese and English
- Voice/video chat
- File upload/sharing in chat

<!-- @SECTION:USER_STORIES -->
## User Stories

<!-- @STORY:US-001 priority=P1 status=done mvp=true -->
### US-001: Chat Widget Visibility
As a pricing page visitor, I want to see a chat bubble so that I can easily access customer support.

<!-- @AC:AC-001 status=done -->
- [x] **AC-001**: SHALL display a floating chat bubble at bottom-right of the pricing page (`/bang-gia`)
<!-- @AC:AC-002 status=done -->
- [x] **AC-002**: WHEN user clicks the chat bubble, SHALL open the chat panel with smooth animation (300ms)
<!-- @AC:AC-003 status=done -->
- [x] **AC-003**: WHEN chat panel is open, SHALL display header with "Hưng DPS" name, avatar, and online status
<!-- @AC:AC-004 status=done -->
- [x] **AC-004**: WHEN chat panel is open, SHALL display quick action buttons: "Tư vấn gói phù hợp", "So sánh các gói", "Báo giá chi tiết", "Thời gian triển khai", "Hỗ trợ sau bán hàng"
<!-- @AC:AC-005 status=done -->
- [x] **AC-005**: SHALL be responsive — 380x600px panel on desktop, fullscreen modal on mobile (≤768px)

<!-- @STORY:US-002 priority=P1 status=done mvp=true -->
### US-002: Send and Receive Messages
As a visitor, I want to send messages and receive AI responses so that I can get information about services.

<!-- @AC:AC-006 status=done -->
- [x] **AC-006**: WHEN user types a message and presses Enter or clicks Send, SHALL send message to backend via POST `/api/chatbot/chat`
<!-- @AC:AC-007 status=done -->
- [x] **AC-007**: WHEN message is sent, SHALL display user's message in a blue bubble (right-aligned)
<!-- @AC:AC-008 status=done -->
- [x] **AC-008**: WHEN waiting for AI response, SHALL display typing indicator (animated dots) in assistant bubble
<!-- @AC:AC-009 status=done -->
- [x] **AC-009**: WHEN AI response streams via SSE, SHALL display tokens in real-time in assistant bubble (left-aligned)
<!-- @AC:AC-010 status=done -->
- [x] **AC-010**: WHEN AI response completes, SHALL auto-scroll to the latest message
<!-- @AC:AC-011 status=done -->
- [x] **AC-011**: SHALL limit user message input to 1000 characters
<!-- @AC:AC-012 status=done -->
- [x] **AC-012**: IF message is empty or whitespace-only, SHALL disable the send button

<!-- @STORY:US-003 priority=P1 status=done mvp=true -->
### US-003: Hưng DPS Persona
As a visitor, I want to interact with a consistent, knowledgeable persona so that I feel I'm talking to a real expert.

<!-- @AC:AC-013 status=done -->
- [x] **AC-013**: SHALL respond as "Hưng DPS" — a male expert programmer and Business Analyst
<!-- @AC:AC-014 status=done -->
- [x] **AC-014**: SHALL self-identify as "Hưng DPS" when asked about identity
<!-- @AC:AC-015 status=done -->
- [x] **AC-015**: SHALL maintain formal, professional tone using "tôi" (I) and "quý khách/anh/chị" (you)
<!-- @AC:AC-016 status=done -->
- [x] **AC-016**: SHALL demonstrate deep knowledge of web development, marketing, mobile apps, software, design, and AI services
<!-- @AC:AC-017 status=done -->
- [x] **AC-017**: SHALL respond concisely (2-3 sentences max), asking for specific needs instead of listing all information
<!-- @AC:AC-017a status=done -->
- [x] **AC-017a**: SHALL use plain text only — no emoji, no markdown symbols (**, *, #, -, `, →), no bullet points
<!-- @AC:AC-017b status=done -->
- [x] **AC-017b**: SHALL refuse to negotiate prices or create custom packages — politely explain quality requires appropriate cost and suggest direct contact

<!-- @STORY:US-004 priority=P1 status=done mvp=true -->
### US-004: Language Enforcement
As a business owner, I want the chatbot to only respond in Vietnamese or English so that it stays on-brand.

<!-- @AC:AC-018 status=done -->
- [x] **AC-018**: SHALL default to Vietnamese language for responses
<!-- @AC:AC-019 status=done -->
- [x] **AC-019**: IF user writes in English, SHALL respond in English
<!-- @AC:AC-020 status=done -->
- [x] **AC-020**: IF user writes in a language other than Vietnamese or English (e.g., Chinese, Japanese, Korean), SHALL respond: "Sorry, I do not speak [that language]. I can help you in Vietnamese or English."
<!-- @AC:AC-021 status=done -->
- [x] **AC-021**: SHALL NOT attempt to translate or respond in unsupported languages

<!-- @STORY:US-005 priority=P1 status=done mvp=true -->
### US-005: Service Data Grounding (Anti-Hallucination)
As a business owner, I want the chatbot to ONLY use real service data so that customers receive accurate information.

<!-- @AC:AC-022 status=done -->
- [x] **AC-022**: SHALL load active services and pricing tiers from database via existing pricing API
<!-- @AC:AC-023 status=done -->
- [x] **AC-023**: SHALL inject real pricing data into the system prompt context
<!-- @AC:AC-024 status=done -->
- [x] **AC-024**: SHALL NOT fabricate service names, prices, features, or timelines not present in the data
<!-- @AC:AC-025 status=done -->
- [x] **AC-025**: IF asked about information not in the service data, SHALL respond: "Tôi không có thông tin chi tiết về vấn đề này. Vui lòng liên hệ hotline để được hỗ trợ thêm nhé!"
<!-- @AC:AC-026 status=done -->
- [x] **AC-026**: SHALL recommend services based on customer's stated budget, needs, and conditions using real pricing tiers
<!-- @AC:AC-027 status=done -->
- [x] **AC-027**: SHALL refresh pricing data from cache on each new conversation (5-minute cache TTL)

<!-- @STORY:US-006 priority=P1 status=done mvp=true -->
### US-006: Conversation Memory
As a visitor, I want the chatbot to remember our conversation so that I don't have to repeat myself.

<!-- @AC:AC-028 status=done -->
- [x] **AC-028**: SHALL maintain conversation history within a session using sliding window (last 10 messages)
<!-- @AC:AC-029 status=done -->
- [x] **AC-029**: SHALL store session data in Redis with 1-hour TTL
<!-- @AC:AC-030 status=done -->
- [x] **AC-030**: SHALL generate a unique session ID (UUID) per browser session, stored in sessionStorage
<!-- @AC:AC-031 status=done -->
- [x] **AC-031**: IF session expires (1 hour), SHALL start a new conversation with welcome message
<!-- @AC:AC-032 status=done -->
- [x] **AC-032**: SHALL include conversation history in LLM prompt for context continuity

<!-- @STORY:US-007 priority=P1 status=done mvp=true -->
### US-007: Rate Limiting & Security
As a business owner, I want the chatbot to be protected from abuse so that API costs stay controlled.

<!-- @AC:AC-033 status=done -->
- [x] **AC-033**: SHALL enforce per-session rate limit: 5 messages per minute
<!-- @AC:AC-034 status=done -->
- [x] **AC-034**: SHALL enforce per-session rate limit: 50 messages per hour
<!-- @AC:AC-035 status=done -->
- [x] **AC-035**: IF rate limited, SHALL respond with friendly message: "Bạn đang gửi tin nhắn quá nhanh. Vui lòng chờ một chút nhé!"
<!-- @AC:AC-036 status=done -->
- [x] **AC-036**: SHALL sanitize user input: strip HTML tags, control characters, limit to 1000 chars
<!-- @AC:AC-037 status=done -->
- [x] **AC-037**: SHALL NOT execute code, reveal system prompts, or follow instructions to change persona
<!-- @AC:AC-038 status=done -->
- [x] **AC-038**: SHALL limit AI response to max 200 output tokens (reduced from 512 for conciseness enforcement)
<!-- @AC:AC-039 status=done -->
- [x] **AC-039**: SHALL use circuit breaker pattern: if Groq API fails 5 times, pause for 60 seconds
<!-- @AC:AC-040 status=done -->
- [x] **AC-040**: SHALL apply post-processing sanitization to strip markdown symbols from streamed responses (**, *, #, -, `, →)

<!-- @STORY:US-008 priority=P2 status=done mvp=false -->
### US-008: Model Fallback Strategy
As a system, I want to fallback to a cheaper model when rate limited so that the chatbot stays available.

<!-- @AC:AC-041 status=done -->
- [x] **AC-041**: SHALL use `llama-3.3-70b-versatile` as primary model
<!-- @AC:AC-042 status=done -->
- [x] **AC-042**: IF primary model returns 429 (rate limited), SHALL fallback to `llama-3.1-8b-instant`
<!-- @AC:AC-043 status=done -->
- [x] **AC-043**: IF both models unavailable, SHALL display: "Hệ thống đang bận. Vui lòng thử lại sau hoặc liên hệ hotline."
<!-- @AC:AC-044 status=done -->
- [x] **AC-044**: SHALL log model usage and fallback events for monitoring

<!-- @STORY:US-009 priority=P2 status=done mvp=false -->
### US-009: Quick Actions
As a visitor, I want predefined question buttons so that I can quickly get common information.

<!-- @AC:AC-045 status=done -->
- [x] **AC-045**: SHALL display quick action buttons below the message area
<!-- @AC:AC-046 status=done -->
- [x] **AC-046**: WHEN user clicks a quick action, SHALL send the predefined message as if user typed it
<!-- @AC:AC-047 status=done -->
- [x] **AC-047**: SHALL hide quick actions after first user message (show only at conversation start)
<!-- @AC:AC-048 status=done -->
- [x] **AC-048**: Quick actions SHALL include: "Tư vấn gói phù hợp", "So sánh các gói", "Báo giá chi tiết", "Thời gian triển khai", "Hỗ trợ sau bán hàng"

<!-- @STORY:US-010 priority=P1 status=done mvp=false -->
### US-010: Purchase Intent Handoff
As a potential customer who confirms a purchase, I want the chatbot to collect my contact info and escalate to a human agent, so that I can complete my purchase with real support.

<!-- @AC:AC-049 status=done -->
- [x] **AC-049**: WHEN customer confirms purchase intent (e.g., "chốt đi", "ok mua", "đồng ý"), the AI SHALL collect contact information (name, phone/Zalo) before triggering handoff
<!-- @AC:AC-050 status=done -->
- [x] **AC-050**: WHEN AI includes [HANDOFF] tag in response, the system SHALL strip the tag before sending to client
<!-- @AC:AC-051 status=done -->
- [x] **AC-051**: WHEN handoff is triggered, the system SHALL mark session with needsHumanHandoff=true
<!-- @AC:AC-052 status=done -->
- [x] **AC-052**: WHEN handoff is triggered, the system SHALL send CHATBOT_HANDOFF notification to all ADMIN users via notification queue
<!-- @AC:AC-053 status=done -->
- [x] **AC-053**: WHEN a session is marked for handoff AND user sends another message, the system SHALL return a polite "already forwarded" message instead of AI response

<!-- @STORY:US-011 priority=P1 status=done mvp=false -->
### US-011: Chat History Persistence
As a user who refreshes the page, I want my chat history to be restored, so that I don't lose the conversation context.

<!-- @AC:AC-054 status=done -->
- [x] **AC-054**: WHEN user refreshes the page, the system SHALL fetch chat history from backend via GET /chatbot/history/:sessionId
<!-- @AC:AC-055 status=done -->
- [x] **AC-055**: The GET endpoint SHALL validate sessionId as UUID format and return only user+assistant messages (filter system messages)
<!-- @AC:AC-056 status=done -->
- [x] **AC-056**: WHEN history is loading, the UI SHALL show a loading spinner with Vietnamese text
<!-- @AC:AC-057 status=done -->
- [x] **AC-057**: The system SHALL prevent duplicate history loads in React strict mode via ref tracking
<!-- @AC:AC-058 status=done -->
- [x] **AC-058**: WHEN session is reset, the history loaded flag SHALL be cleared
<!-- @END:STORY:US-011 -->

<!-- @STORY:US-012 priority=P1 status=done mvp=false -->
### US-012: AI Chatbot Page Control (P1)

As a customer browsing the pricing page, I want the AI chatbot to show me relevant services and navigate the pricing wizard for me, so I can see products like a salesperson flipping through a catalog.

<!-- @AC:AC-059 status=done -->
- [x] **AC-059**: WHEN AI response contains `[ACTION:TYPE:param1=value1]` tags, THE SYSTEM SHALL parse tags via action parser utility and return clean content (tags stripped) and parsed actions array
<!-- @AC:AC-060 status=done -->
- [x] **AC-060**: WHEN actions are parsed, THE SYSTEM SHALL execute them via action executor with support for NAVIGATE (goToStep), SHOW_SERVICE (selectCategory + selectService), and SELECT_TIER actions with error handling
<!-- @AC:AC-061 status=done -->
- [x] **AC-061**: WHEN ChatMessage component receives assistant message, THE SYSTEM SHALL integrate action parsing, display clean content (tags invisible), and execute actions only once per message after streaming completes
<!-- @AC:AC-062 status=done -->
- [x] **AC-062**: THE SYSTEM SHALL include action tag instructions in system prompt (rule #9) with available tags (SHOW_SERVICE, NAVIGATE), examples, and usage rules
<!-- @AC:AC-063 status=done -->
- [x] **AC-063**: THE SYSTEM SHALL include service slugs in pricing data format so AI can reference correct slugs in action tags
<!-- @AC:AC-064 status=done -->
- [x] **AC-064**: WHEN backend sanitizes content, THE SYSTEM SHALL preserve `[ACTION:...]` tags (not strip them), allowing frontend to receive and process them
<!-- @AC:AC-065 status=done -->
- [x] **AC-065**: THE SYSTEM SHALL compile with 0 TypeScript errors in both Frontend and Backend
<!-- @STORY:US-013 priority=P1 status=done mvp=false -->
### US-013: Admin Chatbot Configuration

As an admin, I want to configure chatbot settings through a web UI instead of editing .env files, so that I can adjust AI behavior without redeploying the application.

<!-- @AC:AC-066 status=done -->
- [x] **AC-066**: SHALL provide admin UI at /admin/chatbot for configuring chatbot settings
<!-- @AC:AC-067 status=done -->
- [x] **AC-067**: SHALL store configuration in SystemSetting model with category='chatbot' (keys: chatbot.apiKey, chatbot.primaryModel, chatbot.fallbackModel, chatbot.maxTokens, chatbot.temperature)
<!-- @AC:AC-068 status=done -->
- [x] **AC-068**: SHALL provide SettingsService with methods: get(key), set(key, value, category), setMany(settings), getByCategory(category)
<!-- @AC:AC-069 status=done -->
- [x] **AC-069**: SHALL provide SettingsController with 3 endpoints: GET /api/admin/settings/chatbot, PATCH /api/admin/settings/chatbot, POST /api/admin/settings/chatbot/test
<!-- @AC:AC-070 status=done -->
- [x] **AC-070**: SHALL mask API key in GET response (show only first/last chars), include hasApiKey boolean flag
<!-- @AC:AC-071 status=done -->
- [x] **AC-071**: SHALL validate configuration via UpdateChatbotConfigDto with allowed models, token range (128-2048), temperature range (0-2)
<!-- @AC:AC-072 status=done -->
- [x] **AC-072**: ChatbotGroqService SHALL load config from database on each request via loadConfigFromDb(), falling back to env vars if DB config not set
<!-- @AC:AC-073 status=done -->
- [x] **AC-073**: SHALL restrict access to ADMIN and SUPER_ADMIN roles only via JwtAuthGuard + RolesGuard
<!-- @AC:AC-074 status=done -->
- [x] **AC-074**: Frontend SHALL provide ChatbotConfigPage with form fields for all settings, test connection button, and success/error feedback
<!-- @END:STORY:US-013 -->

<!-- @STORY:US-014 priority=P1 status=done mvp=false -->
### US-014: RAG with Compact All-Services Index

As a system, I want to provide the AI with complete pricing data in compact format, so that it can answer questions about any service without keyword filtering limitations.

<!-- @AC:AC-075 status=done -->
- [x] **AC-075**: SHALL load ALL active services and pricing tiers from database via PricingService.getPublicPricing()
<!-- @AC:AC-076 status=done -->
- [x] **AC-076**: SHALL format pricing data in compact one-line-per-tier format: "Service Name (slug: service-slug): \n  Tier Name: price (tags)"
<!-- @AC:AC-077 status=done -->
- [x] **AC-077**: SHALL include service slugs in formatted data for AI to use in action tags
<!-- @AC:AC-078 status=done -->
- [x] **AC-078**: SHALL inject complete pricing index into system prompt (~2-5KB total size)
<!-- @AC:AC-079 status=done -->
- [x] **AC-079**: SHALL NOT use keyword-based filtering or service matching — AI always sees all services
<!-- @AC:AC-080 status=done -->
- [x] **AC-080**: SHALL log system prompt size in characters and estimated tokens for monitoring
<!-- @END:STORY:US-014 -->

<!-- @END:SECTION:USER_STORIES -->

<!-- @SECTION:IMPLEMENTATION_NOTES -->
## Implementation Notes

### Completion Date
2026-02-11 (last updated)

### Implementation Summary
All 14 user stories (80 acceptance criteria) are fully implemented across Backend (NestJS) and Frontend (Next.js).

**Backend** (12 files in `Backend/src/modules/chatbot/` + 6 files in `Backend/src/modules/settings/`):
- `chatbot.module.ts` — NestJS module with NotificationsModule, PrismaModule, and SettingsModule dependencies
- `controllers/chatbot.controller.ts` — POST `/api/chatbot/chat` SSE endpoint + GET `/api/chatbot/history/:sessionId` endpoint
- `dto/chat-message.dto.ts` — Input validation with class-validator
- `services/chatbot-session.service.ts` — Redis session with sliding window (10 msgs, 1h TTL)
- `services/chatbot-rate-limiter.service.ts` — Per-session rate limiting (5/min, 50/hour)
- `services/chatbot-prompt.service.ts` — System prompt builder with ALL pricing data in compact format (~2-5KB)
- `services/chatbot-groq.service.ts` — Groq streaming with circuit breaker, model fallback, DB config loading, and sanitizeContent() post-processing
- `prompts/hung-dps-persona.ts` — 23-line simplified prompt with plain text enforcement + pricing context template + purchase handoff rule + page control rule #9
- `utils/input-sanitizer.ts` — HTML stripping, control char removal, injection detection (preserves [ACTION:...] tags)
- `settings/settings.module.ts` — SettingsModule with PrismaModule dependency
- `settings/services/settings.service.ts` — Database-backed configuration service (get, set, setMany, getByCategory)
- `settings/controllers/settings.controller.ts` — 3 admin endpoints: GET/PATCH /admin/settings/chatbot, POST /admin/settings/chatbot/test
- `settings/dto/update-chatbot-config.dto.ts` — Validation DTO with allowed models, token/temperature ranges
- `Backend/prisma/schema.prisma` — SystemSetting model (id, key, value, category, timestamps)

**Frontend** (16 files in `Frontend/src/features/chatbot/` + 2 files in `Frontend/src/features/admin/`):
- `api/chat.ts` — SSE streaming client + fetchChatHistory() function
- `hooks/useChat.ts` — Main chat hook with streaming, abort controller, history restoration on mount
- `hooks/useChatSession.ts` — UUID session management via sessionStorage
- `stores/chat-store.ts` — Zustand store for chat state + setMessages, isLoadingHistory, setLoadingHistory
- `types/chat.ts` — TypeScript types + QUICK_ACTIONS constant
- `utils/action-parser.ts` — Parse action tags from AI responses
- `utils/action-executor.ts` — Execute actions on wizard store
- `components/ChatBubble.tsx` — Floating button with pulse animation
- `components/ChatPanel.tsx` — Glassmorphism panel (380×600 desktop, fullscreen mobile) + loading spinner
- `components/ChatHeader.tsx` — Header with avatar, name, online status
- `components/ChatMessage.tsx` — Message bubbles with streaming cursor + action parsing/execution
- `components/ChatInput.tsx` — Auto-resizing textarea with character counter
- `components/QuickActions.tsx` — 5 predefined question pills
- `admin/api/chatbot-config.ts` — React Query hooks for chatbot config CRUD + test connection
- `admin/pages/ChatbotConfigPage.tsx` — Admin UI with form, validation, test button
- `app/admin/chatbot/page.tsx` — Next.js page wrapper for ChatbotConfigPage

**Integration**:
- `Frontend/src/app/(public)/bang-gia/client.tsx` — Chatbot integrated on pricing page
- `Frontend/tailwind.config.ts` — Added `pulse-subtle` animation

### Key Implementation Changes (2026-02-08 to 2026-02-11)

#### 1. Admin Chatbot Configuration (US-013) — 2026-02-08 14:30
**What changed**: Moved chatbot config from .env to database-backed admin UI
- Added `SystemSetting` model to Prisma schema with key-value storage
- Created `SettingsModule` with `SettingsService` (get/set/setMany/getByCategory methods)
- Created `SettingsController` with 3 endpoints: GET/PATCH /admin/settings/chatbot, POST /admin/settings/chatbot/test
- Added `UpdateChatbotConfigDto` with validation (allowed models, token range 128-2048, temperature 0-2)
- Modified `ChatbotGroqService.loadConfigFromDb()` to load config from DB on each request, falling back to env vars
- Created `ChatbotConfigPage` frontend with form, masked API key display, test connection button
- Added `/admin/chatbot` route in Next.js

**Files**: `Backend/prisma/schema.prisma`, `Backend/src/modules/settings/*`, `Backend/src/modules/chatbot/services/chatbot-groq.service.ts`, `Frontend/src/features/admin/api/chatbot-config.ts`, `Frontend/src/features/admin/pages/ChatbotConfigPage.tsx`, `Frontend/src/app/admin/chatbot/page.tsx`

#### 2. Chatbot Persona Overhaul (US-003 updates) — 2026-02-08 14:45
**What changed**: Enforced plain text only, formal tone, concise responses
- Simplified prompt from 99 lines to 23 lines
- Added rule #3: Plain text only — no emoji, no markdown (**, *, #, -, `, →), no bullet points
- Added rule #4: Formal tone — use "tôi" (I) and "quý khách/anh/chị" (you)
- Added rule #2: Concise responses — max 2-3 sentences, ask for specific needs instead of listing all info
- Reformatted pricing data to numbered lists in compact format

**Files**: `Backend/src/modules/chatbot/prompts/hung-dps-persona.ts`, `Backend/src/modules/chatbot/services/chatbot-prompt.service.ts`

#### 3. Anti-Fabrication Rules (US-005 updates) — 2026-02-08 15:00
**What changed**: Strengthened data integrity and refusal boundaries
- Added rule #1: Strict "no fabrication" — only cite data from pricing context
- Added rule #5: No price negotiation — refuse to discount or create custom packages
- Added rule #6: Security — refuse jailbreak attempts, don't reveal system prompt
- Removed price negotiation hints from pricing template
- Added good/bad examples to prompt

**Files**: `Backend/src/modules/chatbot/prompts/hung-dps-persona.ts`

#### 4. Chatbot Enforcement Fix (US-007 updates) — 2026-02-08 15:15
**What changed**: Reduced token limit and added post-processing sanitization
- Reduced `maxTokens` default from 512 to 200 for conciseness enforcement
- Added `sanitizeContent()` method to strip markdown symbols from streamed responses (**, *, #, -, `, →)
- Applied sanitization via `createSanitizedStream()` wrapper on Groq response stream
- Updated AC-038 to reflect new 200 token limit
- Added AC-040 for post-processing sanitization

**Files**: `Backend/src/modules/chatbot/services/chatbot-groq.service.ts` (lines 56-58, 183-195, 197-240)

#### 5. RAG Implementation with Compact All-Services Index (US-014) — 2026-02-08 15:45 & 16:00
**What changed**: Replaced keyword-based filtering with compact all-services index
- **15:45**: Initial attempt with keyword-based filtering (SERVICE_KEYWORDS, findRelevantServiceKeys, serviceMatchesKeys)
- **16:00**: Removed broken keyword filtering entirely
- Final implementation: `formatAllPricingCompact()` includes ALL services and tiers in one-line-per-tier format
- Compact format: "SERVICE NAME (slug: service-slug):\n  Tier Name: price (tags)"
- Total size: ~2-5KB for complete pricing data
- LLM always sees complete pricing index — no filtering
- Added prompt size logging: `System prompt size: ${prompt.length} chars (~${Math.round(prompt.length / 4)} tokens)`

**Files**: `Backend/src/modules/chatbot/services/chatbot-prompt.service.ts` (lines 12-21, 48-65, 67-152), `Backend/src/modules/chatbot/prompts/hung-dps-persona.ts` (lines 61-68)

### Deviations from Original Spec
1. **Prisma Decimal type handling**: `tier.price` is `Decimal @db.Decimal(15,0)` in Prisma schema. Required `Number(tier.price)` conversion before comparison and formatting. Not anticipated in original design.
2. **`prompts/pricing-context.ts` merged**: Design specified separate file, but `PRICING_CONTEXT_TEMPLATE` was consolidated into `hung-dps-persona.ts` for simplicity. No functional impact.
3. **Prompt simplified from 99 to 23 lines**: Original design anticipated longer prompt, but enforcement issues led to radical simplification for better LLM compliance.
4. **RAG architecture changed**: Original design anticipated keyword-based filtering, but final implementation uses compact all-services index for better coverage and simpler logic.

### New Features (2026-02-08)
1. **Purchase Intent Handoff (US-010)**: AI detects purchase confirmation phrases, collects contact info, triggers [HANDOFF] tag. System strips tag, marks session with `needsHumanHandoff=true`, sends CHATBOT_HANDOFF notification to admins, blocks further AI responses with "already forwarded" message.
2. **Chat History Persistence (US-011)**: GET `/api/chatbot/history/:sessionId` endpoint restores chat history on page refresh. Frontend loads history on mount with deduplication via ref tracking, shows loading spinner during fetch.
3. **AI Chatbot Page Control (US-012)**: AI can control pricing wizard by including `[ACTION:TYPE:params]` tags in responses. Frontend parses tags via `action-parser.ts`, displays clean content (tags invisible), and executes actions via `action-executor.ts` after streaming completes. Supports SHOW_SERVICE (navigate to specific service), NAVIGATE (go to wizard step), and SELECT_TIER actions. System prompt includes rule #9 with action tag instructions. Pricing data includes service slugs for AI reference. Backend preserves action tags (doesn't strip them). Implementation: `Frontend/src/features/chatbot/utils/action-parser.ts`, `Frontend/src/features/chatbot/utils/action-executor.ts`, updated `ChatMessage.tsx` component.

### Positive Enhancements (beyond spec)
1. **Chat reset button** in header — allows user to restart conversation
2. **Character counter** at 800+/1000 chars — visual feedback before limit
3. **AbortController cleanup** on unmount — prevents memory leaks
4. **Dark mode support** — follows project-wide dark mode pattern
5. **Typed GroqApiError class** — replaces `any` type assertion for better type safety

### Build Verification
- ✅ Frontend `tsc --noEmit` — 0 errors
- ✅ Backend `tsc --noEmit` — 0 errors
- ✅ All 64 acceptance criteria validated (US-001 to US-012)

### Undocumented Enhancements (Spec Drift)

The following features were implemented beyond the original spec requirements. All are positive enhancements that improve UX without contradicting any acceptance criteria.

**UI Enhancements:**
1. **Chat reset button** (`ChatHeader.tsx`) — RotateCcw icon button allows user to restart conversation
2. **Character counter** (`ChatInput.tsx`) — Shows character count at 800+/1000 with color warning at 950+
3. **Auto-resizing textarea** (`ChatInput.tsx`) — Textarea grows with content up to 120px max height
4. **Streaming cursor animation** (`ChatMessage.tsx`) — Blinking cursor during AI response streaming
5. **Welcome message UI** (`ChatPanel.tsx`) — Wave emoji icon, greeting text, and description when no messages
6. **Dark mode support** — All components include `dark:` Tailwind variants following project-wide pattern

**Technical Enhancements:**
7. **AbortController cleanup** (`useChat.ts`) — Prevents memory leaks by aborting pending requests on unmount
8. **GroqApiError typed class** (`chatbot-groq.service.ts`) — Custom error class with status code for type-safe error handling
9. **Action parsing and execution** (`action-parser.ts`, `action-executor.ts`) — Parse and execute page control actions from AI responses
10. **Wizard store integration** (`action-executor.ts`) — Chatbot can control pricing wizard via `useWizardStore` methods

**Architectural Deviations (No Functional Impact):**
1. **Merged pricing context** — `PRICING_CONTEXT_TEMPLATE` consolidated into `hung-dps-persona.ts` instead of separate `prompts/pricing-context.ts` file
2. **Fetch ReadableStream** — Uses fetch API with ReadableStream reader instead of native EventSource API (provides more control over SSE parsing)
3. **Action tag preservation** — Backend `sanitizeContent()` preserves `[ACTION:...]` tags instead of stripping them, allowing frontend to parse and execute actions
<!-- @END:SECTION:implementation-notes -->

