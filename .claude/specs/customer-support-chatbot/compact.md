# Compact: Customer Support Chatbot — "Hưng DPS"

> Checkpoint: 2026-02-08

## Summary

User requested building an AI-powered customer support chatbot integrated into the pricing page (`/bang-gia#buoc-1`) of their Vietnamese web development agency social media platform (ChungToiXayWeb). The chatbot persona is "Hưng DPS" — a male expert programmer/BA who provides caring customer support in Vietnamese or English only, using real pricing data from the database to prevent hallucination.

Phase 1 discovery ran 5 parallel subagents: spec-finder (NOT_FOUND), spec-codebase-analyzer (detailed tech stack analysis), spec-task-classifier (Level 2 MEDIUM), spec-researcher (Groq model comparison), and spec-ui-ux-pro-max (glassmorphism chat widget design). Then spec-planner created a 6-phase implementation plan. User confirmed the plan with "yes". spec-writer created the full Level 2 spec (requirements.md + design.md).

Key model decision: `llama-3.3-70b-versatile` as primary (best reasoning, unofficial Vietnamese support via transfer learning), `llama-3.1-8b-instant` as fallback when rate limited. No guard model to conserve Groq rate limits (30 RPM free tier). Architecture uses SSE streaming (not WebSocket), Redis for ephemeral sessions (1h TTL), and system prompt injection for pricing data (23 services fit in context, no vector DB needed).

Prior to this conversation, the AI Seeding System (Phase 11) was completed and validated — reply scheduling, topic diversity, feed AI capping all passing. A critical SQL column name bug (snake_case vs camelCase) was found and fixed. 14 files staged for that feature.

## Q&A

**Q**: User wants a CSKH chatbot on pricing page using Groq, reading real service data, persona "Hưng DPS", Vietnamese/English only, must not fabricate info. Which model from their list is smartest?
**A**: Researched all 6 available models. Recommended `llama-3.3-70b-versatile` (primary) + `llama-3.1-8b-instant` (fallback). Vietnamese not officially supported by any production model but 70b has good multilingual transfer. Created 6-phase implementation plan.

**Q**: User confirmed plan with "yes"
**A**: Created Level 2 spec at `.claude/specs/customer-support-chatbot/` with requirements.md (9 user stories, 47 acceptance criteria) and design.md (architecture, API, security, UI design).

## Files Changed

- `.claude/specs/customer-support-chatbot/requirements.md` - New spec: 9 user stories (US-001→009), 47 acceptance criteria (AC-001→047), EARS notation
- `.claude/specs/customer-support-chatbot/design.md` - New spec: system architecture, API design (SSE endpoint), data flow, system prompt design, security design, UI specs, config, testing strategy

## Reference Files

- `Backend/src/modules/ai-seeding/services/groq-client.service.ts` - Existing Groq API client to extend for streaming
- `Backend/src/modules/pricing/services/pricing.service.ts` - Pricing data API (getPublicPricing, cached 5min)
- `Frontend/src/app/(public)/bang-gia/page.tsx` - Pricing page where chatbot will be integrated
- `Frontend/src/features/pricing/components/wizard/WizardContainer.tsx` - 4-step wizard with #buoc-1 hash navigation
- `Frontend/src/features/pricing/constants/categories.ts` - 23 services across 6 categories
- `Backend/prisma/schema.prisma` - Service + PricingTier models (lines 516-590)
- `Backend/src/redis/cache-keys.ts` - Redis key patterns to extend
- `Backend/src/app.module.ts` - Module registration point

## Timeline

1. Ran 5 parallel discovery subagents (finder, analyzer, classifier, researcher, UI/UX designer)
2. Synthesized findings → delegated to spec-planner for implementation plan
3. Presented 6-phase plan with risk assessment, model recommendation, architecture decisions
4. User confirmed → delegated to spec-writer
5. Spec created: requirements.md + design.md at `.claude/specs/customer-support-chatbot/`
6. **Next**: Implementation (Phase 1: Backend Foundation → Phase 6: Testing)

---
**Original request**: "Tích hợp vào /bang-gia#buoc-1 một nhân viên CSKH AI tên Hưng DPS, dùng Groq model thông minh, đọc data dịch vụ thật, recommend khách hàng, ghi nhớ hội thoại, chỉ nói Tiếng Việt/English, cấm bịa thông tin"

---
**To resume**: `continue from previous conversation .claude/specs/customer-support-chatbot/compact.md`

