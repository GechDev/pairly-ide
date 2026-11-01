# ==============================================================================
# Multi-Stage Production Dockerfile for @pairly/realtime (Task T-25)
# Optimized for Railway, Render, Fly.io, and AWS ECS
# ==============================================================================

# --- Stage 1: Base Alpine with pnpm ---
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat curl
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app

# --- Stage 2: Monorepo Pruning with Turborepo ---
FROM base AS pruner
COPY . .
RUN npx turbo prune @pairly/realtime --docker

# --- Stage 3: Dependency Installation & Monorepo Build ---
FROM base AS builder
# Copy dependency manifests first for layer caching
COPY --from=pruner /app/out/json/ .
RUN pnpm install --frozen-lockfile

# Copy pruned source files
COPY --from=pruner /app/out/full/ .

# Compile TypeScript packages and realtime service
RUN pnpm exec turbo run build --filter=@pairly/realtime...

# --- Stage 4: Minimal Hardened Production Runner ---
FROM node:20-alpine AS runner
RUN apk add --no-cache curl

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4001
ENV HOST=0.0.0.0

# Copy node_modules and built packages
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/realtime ./apps/realtime

# Run as non-privileged node user for container hardening
USER node

EXPOSE 4001

# Health check against Fastify /health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:4001/health || exit 1

CMD ["node", "apps/realtime/dist/index.js"]
