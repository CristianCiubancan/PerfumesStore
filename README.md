# Perfumes Store

A modern, full-stack e-commerce platform for perfumes built with Next.js 16 and Express.js.

## Tech Stack

**Frontend:**
- Next.js 16 (App Router, React 19)
- TypeScript
- Tailwind CSS 4
- TanStack Query (React Query)
- Zustand (state management)
- next-intl (i18n - EN, RO, FR, DE, ES)
- Framer Motion (animations)
- Radix UI (accessible components)

**Backend:**
- Express.js 4
- TypeScript
- Prisma 6 (PostgreSQL ORM)
- Zod (validation)
- JWT authentication (access + refresh tokens)

**Infrastructure:**
- PostgreSQL 16
- Docker & Docker Compose
- Stripe (payments)
- Resend (transactional emails)
- GitHub Actions (CI/CD)

## Features

- Product catalog with advanced filtering (gender, concentration, fragrance family, seasons, occasions, price range)
- Multi-currency support with BNR exchange rates (RON base, EUR/USD/GBP display)
- Stripe checkout with webhook-driven order processing
- Guest and authenticated checkout
- Admin dashboard for products, orders, promotions, and newsletters
- Email campaigns with scheduling
- Audit logging for admin actions
- Rate limiting and security headers

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- npm >= 10.0.0
- PostgreSQL 16 (or Docker)
- Stripe account (for payments)
- Resend account (for emails, optional)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd PerfumesStoreClean

# Install all dependencies (root, client, and server)
npm run install:all

# Copy environment example
cp .env.example .env
# Edit .env with your values (see Environment Variables section)
```

### Environment Setup

Required variables in `.env`:

```bash
# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<strong-password>
POSTGRES_DB=perfumes_store

# JWT (generate with: openssl rand -base64 32)
JWT_SECRET=<32+-character-secret>
JWT_REFRESH_SECRET=<32+-character-secret>

# Stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# URLs
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:4000
```

See `.env.example` for all available options.

## Development

### Option 1: Docker (Recommended)

```bash
# Start all services (client, server, postgres)
npm run docker:dev

# Stop services
npm run docker:down
```

Services:
- Client: http://localhost:3000
- Server API: http://localhost:4000
- PostgreSQL: localhost:5433

### Option 2: Manual Setup

```bash
# Start PostgreSQL (use Docker or local install)
docker run -d --name postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=perfumes_store \
  -p 5433:5432 \
  postgres:16-alpine

# Run database migrations
npm run db:migrate

# Seed the database (creates admin user + sample data)
npm run db:seed

# Start both client and server in development mode
npm run dev
```

### Individual Commands

```bash
# Development
npm run dev           # Start both client and server
npm run dev:client    # Start client only
npm run dev:server    # Start server only

# Database
npm run db:migrate    # Run Prisma migrations
npm run db:push       # Push schema without migrations
npm run db:seed       # Seed database
npm run db:studio     # Open Prisma Studio

# Stripe webhook (for local development)
npm run stripe:webhook
```

## Testing

```bash
# Run all tests
npm test

# Run with watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Individual packages
npm run test:client
npm run test:server
```

## Code Quality

```bash
# Linting
npm run lint
npm run lint:fix

# Formatting (Prettier)
npm run format
npm run format:check

# Type checking
npm run typecheck
```

## Building for Production

```bash
# Build both client and server
npm run build

# Start production services
npm start

# Or use Docker
npm run docker:prod
```

## Project Structure

```
PerfumesStoreClean/
├── client/                 # Next.js frontend
│   ├── app/[locale]/       # App router pages
│   │   ├── (auth)/         # Auth pages (login, register)
│   │   ├── admin/          # Admin dashboard
│   │   ├── cart/           # Shopping cart
│   │   ├── checkout/       # Checkout flow
│   │   ├── orders/         # Order history
│   │   ├── product/        # Product detail
│   │   └── store/          # Product catalog
│   ├── components/         # React components
│   ├── hooks/              # Custom hooks
│   ├── lib/                # Utilities
│   ├── messages/           # i18n translations
│   └── types/              # TypeScript types
│
├── server/                 # Express.js backend
│   ├── prisma/             # Database schema & migrations
│   ├── src/
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   └── lib/            # Utilities
│   └── uploads/            # User uploads
│
├── shared/                 # Shared types/utils
├── scripts/                # Shell scripts
├── .github/workflows/      # CI/CD pipelines
├── docker-compose.dev.yml  # Development containers
└── docker-compose.prod.yml # Production containers
```

## API Overview

| Endpoint | Description |
|----------|-------------|
| `GET /api/health` | Health check (DB, Stripe, email) |
| `GET /api/products` | List products with filters |
| `GET /api/products/:slug` | Product details |
| `POST /api/auth/register` | User registration |
| `POST /api/auth/login` | User login |
| `POST /api/auth/refresh` | Refresh access token |
| `POST /api/checkout/session` | Create Stripe checkout |
| `GET /api/exchange-rates` | Current exchange rates |
| `GET /api/promotions/active` | Active promotion |
| `POST /api/newsletter/subscribe` | Newsletter signup |
| `GET /api/admin/*` | Admin endpoints (protected) |

## Supported Locales

- English (en)
- Romanian (ro) - default
- French (fr)
- German (de)
- Spanish (es)

## License

Private - All rights reserved.
