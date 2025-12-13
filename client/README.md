# PerfumesStore Client

Next.js 16 frontend application for the PerfumesStore e-commerce platform.

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **UI**: React 19, Tailwind CSS 4, Radix UI
- **State Management**: Zustand, TanStack Query
- **Forms**: React Hook Form with Zod validation
- **Internationalization**: next-intl (5 languages: EN, RO, FR, DE, ES)
- **Testing**: Vitest (unit), Playwright (E2E)

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- Running backend server (see `/server`)

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME=Perfumes Store
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test` | Run unit tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage |
| `npm run test:e2e` | Run E2E tests |
| `npm run test:e2e:ui` | Run E2E tests with UI |
| `npm run analyze` | Analyze bundle size |

## Project Structure

```
client/
├── app/                    # Next.js App Router pages
│   └── [locale]/          # Internationalized routes
│       ├── (store)/       # Public store pages
│       └── admin/         # Admin dashboard
├── components/            # React components
│   ├── ui/               # Reusable UI primitives
│   ├── store/            # Store-specific components
│   └── admin/            # Admin-specific components
├── lib/                   # Utilities and API clients
│   ├── api/              # API client functions
│   └── hooks/            # Custom React hooks
├── i18n/                  # Internationalization config
├── messages/              # Translation files
└── e2e/                   # Playwright E2E tests
```

## Key Features

- **Server-Side Rendering** for SEO optimization
- **Static Generation** for product catalog pages
- **Image Optimization** with Next.js Image component
- **Responsive Design** mobile-first approach
- **Dark Mode** support via next-themes
- **Accessibility** WCAG 2.1 compliant components

## Testing

### Unit Tests (Vitest)

```bash
npm run test
npm run test:coverage  # With coverage report
```

### E2E Tests (Playwright)

```bash
# Install browsers first
npm run playwright:install

# Run tests
npm run test:e2e

# Run with UI
npm run test:e2e:ui
```

## Building for Production

```bash
npm run build
npm run start
```

The build uses `output: "standalone"` for optimized Docker deployments.

## Docker

The application is containerized for production deployment:

```bash
# Build from project root
docker-compose -f docker-compose.prod.yml up client
```

## Bundle Analysis

To analyze the JavaScript bundle size:

```bash
npm run analyze
```

This generates a visual report of all dependencies and their sizes.
