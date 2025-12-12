# Tasks - Issues by Severity

**Source:** code-review.md
**Date:** 2025-12-12
**Last Updated:** 2025-12-12
**Total Issues:** 39 (21 completed, 18 remaining)

---

## CRITICAL (8 issues - 5 completed)

Issues that pose significant risk to production stability, security, or data integrity.

| # | Issue | Category | File:Line | Effort | Status |
|---|-------|----------|-----------|--------|--------|
| 1 | ~~No error tracking (Sentry/Rollbar) - production errors invisible~~ | Observability | `client/lib/errorReporting.ts` | 4h | ✅ Done |
| 2 | No E2E tests (Cypress/Playwright) - critical flows untested | Testing | Project-wide | 40h | |
| 3 | ~~Test worker cleanup issues (force exit warnings)~~ | Testing | `server/src/__tests__/` | 4h | ✅ Done |
| 4 | ~~No automated database backups~~ | DevOps | `docker-compose.prod.yml` | 6h | ✅ Done |
| 5 | ~~Security scan uses `\|\| true` - vulnerabilities don't fail CI~~ | DevOps | `.github/workflows/ci.yml:161-164` | 1h | ✅ Done |
| 6 | No APM/distributed tracing | Observability | Project-wide | 8h | |
| 7 | No metrics collection (Prometheus/CloudWatch) | Observability | Project-wide | 6h | |
| 8 | ~~Console-based logging only, no centralized aggregation~~ | Observability | `server/src/lib/logger.ts` | 5h | ✅ Done |

**Completed:**
- **#1**: Added optional Sentry integration in `client/lib/errorReporting.ts` with lazy loading (works without Sentry installed)
- **#3**: Added `afterAll` cleanup hook in test setup + `forceExit: true` in jest config
- **#4**: Added `postgres-backup` service to `docker-compose.prod.yml` with daily backups and 7-day retention
- **#5**: Changed CI to use `npm audit --audit-level=high` without `|| true`
- **#8**: Enhanced logger with configurable levels, file output, request ID support, and pluggable transports

---

## HIGH (19 issues - 10 completed)

Issues that significantly impact code quality, performance, or maintainability.

| # | Issue | Category | File:Line | Effort | Status |
|---|-------|----------|-----------|--------|--------|
| 9 | ~~Missing `unhandledRejection` global handler~~ | Reliability | `server/src/index.ts` | 1h | ✅ Done |
| 10 | ~~Missing `uncaughtException` global handler~~ | Reliability | `server/src/index.ts` | 1h | ✅ Done |
| 11 | ~~Missing HTTP compression (gzip/brotli)~~ | Performance | `server/src/index.ts` | 1h | ✅ Done |
| 12 | No README.md at project root | Maintainability | Project root | 3h | |
| 13 | No API documentation (Swagger/OpenAPI) | Maintainability | Project-wide | 4h | |
| 14 | 25+ outdated dependencies (Prisma 6→7, Express 4→5) | Maintainability | `server/package.json`, `client/package.json` | 6h | |
| 15 | ~~Fire-and-forget email without retry mechanism~~ | Reliability | `server/src/services/stripe-webhook.service.ts:79` | 4h | ✅ Done |
| 16 | Monolithic store component (346 lines) | Code Quality | `client/app/[locale]/store/store-client.tsx:1-346` | 4h | |
| 17 | Monolithic admin products page (377 lines) | Code Quality | `client/app/[locale]/admin/products/page.tsx:1-377` | 4h | |
| 18 | Only 6% of client components tested | Testing | `client/components/` | 30h | |
| 19 | Campaign controller 27% test coverage | Testing | `server/src/controllers/campaign.controller.ts` | 6h | |
| 20 | Order admin controller 28% test coverage | Testing | `server/src/controllers/order-admin.controller.ts` | 6h | |
| 21 | ~~No container image vulnerability scanning~~ | DevOps | `.github/workflows/ci.yml` | 3h | ✅ Done |
| 22 | No secret management solution (Vault/AWS Secrets Manager) | DevOps | Project-wide | 8h | |
| 23 | ~~No request correlation/tracing IDs~~ | Observability | `server/src/middleware/` | 2h | ✅ Done |
| 24 | ~~Client errors swallowed in production~~ | Observability | `client/components/error-boundary.tsx` | 2h | ✅ Done |
| 25 | Filter counts query fetches all products then aggregates | Performance | `server/src/services/product/filter-count-builder.ts:245-279` | 4h | |
| 26 | ~~No Cache-Control headers for GET endpoints~~ | Performance | `server/src/controllers/product.controller.ts` | 2h | ✅ Done |
| 27 | ~~No CHANGELOG.md or versioning strategy~~ | Maintainability | Project root | 2h | ✅ Done |

**Completed:**
- **#9 & #10**: Added global error handlers in `server/src/index.ts` for uncaught exceptions and unhandled rejections
- **#11**: Added `compression` middleware to server for gzip/deflate compression
- **#15**: Added email retry mechanism with exponential backoff (3 attempts, 2-30s delays) using generic retry utility
- **#21**: Added Trivy container image vulnerability scanning to CI pipeline (fails on CRITICAL/HIGH)
- **#23**: Added `server/src/middleware/requestId.ts` for request correlation IDs (X-Request-ID header)
- **#24**: Updated `ErrorBoundary` to report errors via `reportError()` which sends to Sentry in production
- **#26**: Added Cache-Control headers to product, promotion, and exchange-rate controllers (30s-1hr based on data volatility)
- **#27**: Created CHANGELOG.md with Keep a Changelog format and semantic versioning

---

## MEDIUM (8 issues - 4 completed)

Issues that should be addressed but don't pose immediate risk.

| # | Issue | Category | File:Line | Effort | Status |
|---|-------|----------|-----------|--------|--------|
| 28 | ~~Next.js vulnerabilities (GHSA-w37m-7fhw-fmv9, GHSA-mwv6-3258-q52c)~~ | Security | `client/package.json` | 1h | ✅ Done |
| 29 | Types centralized in single 332-line file | Code Quality | `client/types/index.ts` | 4h | |
| 30 | No runtime security policies (seccomp, AppArmor) | DevOps | `server/Dockerfile`, `client/Dockerfile` | 3h | |
| 31 | ~~Health check only tests database (not Stripe, email)~~ | Observability | `server/src/routes/index.ts:24-31` | 2h | ✅ Done |
| 32 | ~~No lazy loading for product images~~ | Performance | `client/components/` | 2h | ✅ Done |
| 33 | ~~No retry logic for BNR exchange rate fetch~~ | Reliability | `server/src/services/exchange-rate.service.ts:37-42` | 2h | ✅ Done |
| 34 | Inconsistent commit message format | Maintainability | Git history | 1h | |
| 35 | Missing CONTRIBUTING.md | Maintainability | Project root | 2h | |

**Completed:**
- **#28**: Updated Next.js from 16.0.0-beta.0 to 16.0.10 via `npm audit fix`, resolving both vulnerabilities
- **#31**: Enhanced health check to verify database (with latency), Stripe API, email service (Resend), and exchange rate freshness
- **#32**: Added `loading="lazy"` to product images in cart-item-row.tsx and brand-story.tsx (product-card.tsx already had it)
- **#33**: Added exponential backoff retry (3 attempts, 1-10s delays with jitter) for BNR exchange rate fetch

---

## LOW (4 issues - 3 completed)

Nice-to-have improvements with minimal immediate impact.

| # | Issue | Category | File:Line | Effort | Status |
|---|-------|----------|-----------|--------|--------|
| 36 | In-memory rate limiting not distributed | Security | `server/src/services/auth/account.service.ts:20-30` | 4h | |
| 37 | ~~Missing Prettier configuration~~ | Code Quality | Project root | 1h | ✅ Done |
| 38 | ~~Connection pool not explicitly configured~~ | Performance | `server/src/lib/prisma.ts` | 1h | ✅ Done |
| 39 | ~~10-second shutdown timeout may be too short~~ | Reliability | `server/src/index.ts:90-94` | 1h | ✅ Done |

**Completed:**
- **#37**: Added `.prettierrc` and `.prettierignore` at project root with `npm run format` and `npm run format:check` scripts
- **#38**: Added configurable connection pool via env vars (DB_POOL_SIZE, DB_POOL_TIMEOUT, DB_CONNECT_TIMEOUT) with smart defaults
- **#39**: Increased graceful shutdown timeout from 10s to 30s for long-running requests

---

## Summary by Category

| Category | Critical | High | Medium | Low | Completed | Remaining |
|----------|----------|------|--------|-----|-----------|-----------|
| Observability | 4 | 2 | 1 | 0 | **5** | 2 |
| Testing | 2 | 3 | 0 | 0 | **1** | 4 |
| DevOps | 2 | 2 | 1 | 0 | **3** | 2 |
| Maintainability | 0 | 4 | 2 | 0 | **1** | 5 |
| Reliability | 0 | 2 | 1 | 1 | **5** | 0 |
| Performance | 0 | 3 | 1 | 1 | **4** | 1 |
| Code Quality | 0 | 2 | 1 | 1 | **1** | 3 |
| Security | 0 | 0 | 1 | 1 | **1** | 1 |
| **Total** | **8** | **19** | **8** | **4** | **21** | **18** |

---

## Recommended Sprint Plan

### Sprint 1 (Quick Wins - 1 week)
Focus: Immediate security and reliability fixes

- [x] #28 - Fix Next.js vulnerabilities (`npm audit fix`) - 1h ✅
- [x] #9 - Add `unhandledRejection` handler - 1h ✅
- [x] #10 - Add `uncaughtException` handler - 1h ✅
- [x] #11 - Add HTTP compression middleware - 1h ✅
- [x] #5 - Remove `|| true` from CI security scan - 1h ✅
- [x] #37 - Add Prettier configuration - 1h ✅

**Total: ~6 hours (6 completed) ✅ COMPLETE**

### Sprint 2 (Observability - 1-2 weeks)
Focus: Production visibility

- [x] #1 - Implement Sentry error tracking - 4h ✅
- [x] #23 - Add request ID middleware - 2h ✅
- [x] #24 - Fix client error boundary - 2h ✅
- [x] #8 - Set up centralized logging - 5h ✅
- [x] #31 - Enhance health check endpoint - 2h ✅

**Total: ~15 hours (15h completed) ✅ COMPLETE**

### Sprint 3 (Documentation & Quality - 1 week)
Focus: Developer experience

- [ ] #12 - Create README.md - 3h
- [ ] #13 - Add Swagger/OpenAPI docs - 4h
- [ ] #14 - Update outdated dependencies - 6h
- [x] #27 - Set up CHANGELOG and versioning - 2h ✅
- [ ] #35 - Create CONTRIBUTING.md - 2h

**Total: ~17 hours (2h completed, 15h remaining)**

### Sprint 4 (Testing - 2 weeks)
Focus: Test coverage and reliability

- [ ] #2 - Add E2E tests (Playwright) - 40h
- [x] #3 - Fix test teardown issues - 4h ✅
- [ ] #19 - Test campaign controller - 6h
- [ ] #20 - Test order admin controller - 6h

**Total: ~56 hours (4h completed, 52h remaining)**

### Sprint 5 (Infrastructure - 1-2 weeks)
Focus: Production hardening

- [x] #4 - Implement automated backups - 6h ✅
- [x] #21 - Add image vulnerability scanning - 3h ✅
- [ ] #6 - Add APM/tracing (OpenTelemetry) - 8h
- [ ] #7 - Add Prometheus metrics - 6h

**Total: ~23 hours (9h completed, 14h remaining)**

### Backlog (Future Sprints)
- [x] #15 - Email retry mechanism - 4h ✅
- [ ] #16, #17 - Refactor large components - 8h
- [ ] #18 - Client component tests - 30h
- [ ] #22 - Secret management solution - 8h
- [ ] #25 - Optimize filter counts query - 4h
- [x] #26 - Add Cache-Control headers - 2h ✅
- [ ] #29 - Reorganize types by domain - 4h
- [ ] #30 - Add runtime security policies - 3h
- [x] #32 - Add image lazy loading - 2h ✅
- [x] #33 - Add exchange rate retry logic - 2h ✅
- [ ] #34 - Standardize commit messages - 1h
- [ ] #36 - Redis-backed rate limiting - 4h
- [x] #38 - Configure connection pool - 1h ✅
- [x] #39 - Increase shutdown timeout - 1h ✅

---

## Effort Summary

| Priority | Issues | Completed | Remaining Effort |
|----------|--------|-----------|------------------|
| Critical | 8 | 5 | ~54h |
| High | 19 | 10 | ~66h |
| Medium | 8 | 4 | ~10h |
| Low | 4 | 3 | ~4h |
| **Total** | **39** | **21** | **~134h** |

**Progress:** 21/39 issues completed (~54%)
**Effort saved:** ~52h completed
**Remaining:** ~134h (~3-4 sprints with 1 developer)
