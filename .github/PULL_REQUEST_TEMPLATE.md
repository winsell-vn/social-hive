## What this changes

<!-- One or two sentences. What is different after this PR? -->

## Why

<!-- The problem this solves. Link the issue: Closes #123 -->

Closes #

## How it was verified

```bash
# Backend
cd Backend
npm run build
npm test -- --runInBand

# Frontend
cd Frontend
npm run type-check
npm test
npm run build
```

- [ ] Backend build passes
- [ ] Backend tests pass
- [ ] Frontend type-check passes
- [ ] Frontend tests pass
- [ ] Frontend build passes
- [ ] Prisma schema changes include a migration (`prisma/migrations/`)
- [ ] New behaviour is covered by a test
- [ ] No secrets or `.env` values in the diff
- [ ] Docs updated if public behaviour changed
- [ ] SEO/GEO/AEO output (JSON-LD, `llms.txt`, sitemap) re-checked if affected

## Notes for the reviewer

<!-- Trade-offs, follow-ups, areas you want scrutinised. -->
