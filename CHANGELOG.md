# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Sentry error tracking integration with lazy loading (`client/lib/errorReporting.ts`)
- Request ID middleware for correlation/tracing (`server/src/middleware/requestId.ts`)
- Enhanced logger with configurable levels, file output, and pluggable transports
- Comprehensive health check endpoint (database, Stripe, email, exchange rates)
- HTTP compression middleware (gzip/deflate)
- Cache-Control headers for product, promotion, and exchange-rate endpoints
- Automated database backup service in docker-compose.prod.yml (7-day retention)
- Prettier configuration with format scripts
- Global error handlers for uncaught exceptions and unhandled rejections
- Exponential backoff retry logic for BNR exchange rate fetch
- Email retry mechanism with exponential backoff (3 attempts)
- Generic retry utility (`server/src/lib/retry.ts`)
- Container image vulnerability scanning with Trivy in CI pipeline
- Configurable Prisma connection pool via environment variables

### Changed
- Improved graceful shutdown timeout from 10s to 30s
- CI security scan now fails on high/critical vulnerabilities (removed `|| true`)
- Error boundary now reports errors to Sentry in production

### Fixed
- Test worker cleanup issues (force exit warnings)
- Next.js vulnerabilities (updated to 16.0.10)
- Client errors no longer swallowed in production

### Security
- Added npm audit security scanning without silent failures
- Container image vulnerability scanning for CRITICAL/HIGH issues

## [0.1.0] - 2024-12-01

### Added
- Initial release with full e-commerce functionality
- Product catalog with advanced filtering (brand, concentration, fragrance family, etc.)
- Shopping cart with guest and authenticated user support
- Stripe checkout integration
- User authentication with JWT tokens
- Admin panel for product and order management
- Newsletter subscription system with templated campaigns
- Multi-language support (Romanian, English)
- Multi-currency support (RON, EUR, GBP) with live exchange rates
- Responsive design with dark mode support
- Order confirmation emails with PDF invoice attachments

[Unreleased]: https://github.com/your-repo/perfumes-store/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/your-repo/perfumes-store/releases/tag/v0.1.0
