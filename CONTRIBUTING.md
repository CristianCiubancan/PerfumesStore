# Contributing Guide

Guidelines for contributing to the Perfumes Store project.

## Getting Started

1. Clone the repository
2. Install dependencies: `npm run install:all`
3. Copy `.env.example` to `.env` and configure
4. Start development: `npm run docker:dev` or `npm run dev`

## Development Workflow

### Branch Naming

Use descriptive branch names:
- `feature/add-wishlist` - new features
- `fix/cart-quantity-bug` - bug fixes
- `refactor/checkout-flow` - refactoring
- `docs/api-endpoints` - documentation
- `chore/update-deps` - maintenance tasks

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Setup commit template (recommended):**
```bash
git config commit.template .gitmessage
```

This enables the project's commit message template with guidelines.

**Types:**
- `feat` - new feature
- `fix` - bug fix
- `docs` - documentation changes
- `style` - formatting, no code change
- `refactor` - code restructuring
- `test` - adding/updating tests
- `chore` - maintenance tasks

**Examples:**
```
feat(cart): add quantity selector component

fix(auth): resolve token refresh race condition

docs(api): update checkout endpoint documentation

refactor(products): extract filter logic to separate service

test(orders): add integration tests for order creation

chore(deps): update Prisma to v6.1.0
```

### Code Style

The project uses:
- **ESLint** for linting
- **Prettier** for formatting
- **TypeScript** with strict mode

Run before committing:
```bash
npm run lint:fix
npm run format
npm run typecheck
```

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes with clear commits
3. Ensure all tests pass: `npm test`
4. Ensure linting passes: `npm run lint`
5. Update documentation if needed
6. Open a PR against `main`

### PR Title Format

Use the same format as commit messages:
```
feat(cart): add quantity selector component
```

### PR Description Template

```markdown
## Summary
Brief description of changes.

## Changes
- Added X
- Updated Y
- Fixed Z

## Testing
How to test these changes.

## Screenshots (if applicable)
```

## Testing Guidelines

### Server Tests (Jest)

```bash
cd server
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

Location: `server/src/__tests__/`

### Client Tests (Vitest)

```bash
cd client
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

Location: `client/__tests__/` or colocated with components

### Writing Tests

- Name test files: `*.test.ts` or `*.test.tsx`
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Mock external dependencies

## Database Changes

When modifying the Prisma schema:

1. Update `server/prisma/schema.prisma`
2. Create a migration: `npm run db:migrate -- --name describe-change`
3. Update seed data if needed: `server/prisma/seed.ts`
4. Test the migration on a fresh database

## API Changes

When adding/modifying API endpoints:

1. Update the route in `server/src/routes/`
2. Add/update controller in `server/src/controllers/`
3. Add validation schemas in the controller
4. Add tests for the endpoint
5. Update README.md API section if public

## Environment Variables

When adding new environment variables:

1. Add to `.env.example` with documentation
2. Update `docker-compose.dev.yml` if needed
3. Update `docker-compose.prod.yml` if needed
4. Document in README.md

## Internationalization

When adding user-facing text:

1. Add keys to all translation files in `client/messages/`
   - `en.json`, `ro.json`, `fr.json`, `de.json`, `es.json`
2. Use `useTranslations()` hook in components
3. Never hardcode user-visible strings

## Security Considerations

- Never commit secrets or credentials
- Validate all user input with Zod
- Use parameterized queries (Prisma handles this)
- Apply rate limiting to public endpoints
- Sanitize output to prevent XSS
- Follow OWASP guidelines

## Questions?

Open an issue for questions about contributing.
