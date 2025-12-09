# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Shared folder is copied via additional_contexts in docker-compose
COPY --from=shared /. ../shared/

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Stage 3: Production
FROM node:20-alpine AS runner
WORKDIR /app

# Platform argument for handling OS-specific issues (windows, linux, darwin)
ARG PLATFORM=linux

ENV NODE_ENV=production

# Install wget for health checks and postgresql-client for migrations/backup
RUN apk add --no-cache wget postgresql-client

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy Prisma schema and generate client for production
COPY prisma ./prisma
RUN npx prisma generate

# Copy built application (TypeScript outputs to dist/app/src due to shared folder structure)
COPY --from=builder /app/dist/app/src ./dist
# Copy shared folder compiled output for runtime imports (../../../shared from dist/schemas/)
COPY --from=builder /app/dist/shared /shared

# Copy uploads directory (will be overwritten by volume mount)
RUN mkdir -p uploads

# Copy entrypoint script for migration handling
COPY entrypoint.sh .
# Convert CRLF to LF on Windows (harmless no-op on unix systems)
RUN if [ "$PLATFORM" = "windows" ]; then \
      sed -i 's/\r$//' entrypoint.sh; \
    fi && chmod +x entrypoint.sh

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 expressjs && \
    chown -R expressjs:nodejs /app

USER expressjs

EXPOSE 4000

ENTRYPOINT ["./entrypoint.sh"]
