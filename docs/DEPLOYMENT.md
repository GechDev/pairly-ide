# Pairly IDE — Production Deployment Guide

This guide provides end-to-end instructions for deploying Pairly to production with high availability, low latency, and zero self-hosted infrastructure maintenance.

---

## 1. Architecture Overview

Pairly uses a modern split-tier cloud architecture:

```
                  ┌───────────────────────────────┐
                  │          End Users            │
                  └──────────────┬────────────────┘
                                 │
                   ┌─────────────┴─────────────┐
                   │                           │
                   ▼                           ▼
        ┌─────────────────────┐     ┌─────────────────────┐
        │   Vercel / Cloud    │     │  Railway / Render   │
        │ Next.js Web Client  │     │ Fastify WebSockets  │
        │      (Tier 1)       │     │      (Tier 2)       │
        └──────────┬──────────┘     └──────────┬──────────┘
                   │                           │
                   ├─────────────┬─────────────┤
                   ▼             ▼             ▼
          ┌──────────────┐ ┌──────────┐ ┌──────────────┐
          │     Neon     │ │ Upstash  │ │ LiveKit Cloud│
          │  PostgreSQL  │ │  Redis   │ │ Audio/Video  │
          └──────────────┘ └──────────┘ └──────────────┘
```

- **Frontend & Serverless API Routes (`apps/web`)**: Hosted on **Vercel** with global edge caching and automatic HTTPS.
- **Stateful Realtime Collaboration Engine (`apps/realtime`)**: Hosted as a hardened container on **Railway**, **Render**, or **Fly.io** using [`apps/realtime/Dockerfile`](file:///c:/Users/Admin/Desktop/code_editor/pairly-ide/apps/realtime/Dockerfile).
- **Code Execution**: Remote execution via Piston engine (automatically falls back to high-capacity public Piston endpoints).
- **Managed Data Stores**: Serverless PostgreSQL (Neon / Supabase), Redis (Upstash), and WebRTC SFU (LiveKit Cloud).

---

## 2. Infrastructure Setup (Managed Services)

### A. Database (PostgreSQL)

1. Create a serverless PostgreSQL instance on [Neon](https://neon.tech) or [Supabase](https://supabase.com).
2. Copy the pooled connection string (with `sslmode=require` and `pgbouncer=true`).
3. Run database migrations:
   ```bash
   pnpm --filter @pairly/database exec prisma migrate deploy
   ```

### B. Redis (Room Caching & Clustering)

1. Create a Redis database on [Upstash](https://upstash.com).
2. Copy the `rediss://...` connection URI.

### C. LiveKit Cloud (Audio / Video SFU)

1. Create a project at [LiveKit Cloud](https://cloud.livekit.io).
2. Note your `LIVEKIT_URL` (e.g., `wss://pairly-xxxx.livekit.cloud`), `LIVEKIT_API_KEY`, and `LIVEKIT_API_SECRET`.

---

## 3. Deploying Realtime Engine (`@pairly/realtime`)

### Option A: Railway (Recommended)

1. Link your GitHub repository in [Railway](https://railway.app).
2. Set service build settings:
   - **Dockerfile Path**: `apps/realtime/Dockerfile`
   - **Docker Context**: `.` (monorepo root)
3. In Service Settings -> Variables, add:
   ```env
   PORT=4001
   HOST=0.0.0.0
   DATABASE_URL=postgresql://...
   REDIS_URL=rediss://...
   ```
4. Set Health Check path to `/health`.
5. Under Settings -> Networking, generate a public domain (e.g., `pairly-realtime.up.railway.app`). Note the `wss://` URI for Step 4.

### Option B: Render

1. Create a **Web Service** on [Render](https://render.com).
2. Select **Docker** environment.
3. Configure:
   - **Dockerfile Path**: `./apps/realtime/Dockerfile`
   - **Docker Context**: `.`
4. Add environment variables `PORT=4001`, `HOST=0.0.0.0`, `DATABASE_URL`, and `REDIS_URL`.

---

## 4. Deploying Web Application (`apps/web`) on Vercel

1. Import your GitHub repository in [Vercel](https://vercel.com).
2. In Project Settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/web` (or enable Turborepo build from root)
   - **Build Command**: `cd ../.. && pnpm turbo run build --filter=@pairly/web...`
   - **Output Directory**: `.next`
3. Configure Environment Variables in Vercel:
   ```env
   NODE_ENV=production
   NEXT_PUBLIC_APP_URL=https://your-domain.com
   NEXT_PUBLIC_REALTIME_URL=wss://pairly-realtime.up.railway.app
   DATABASE_URL=postgresql://...
   REDIS_URL=rediss://...
   LIVEKIT_URL=wss://your-project.livekit.cloud
   LIVEKIT_API_KEY=APIxxxxxxxxx
   LIVEKIT_API_SECRET=secretxxxxxxxxx
   AI_DEFAULT_PROVIDER=anthropic
   ANTHROPIC_API_KEY=sk-ant-api03-...
   ```
4. Deploy! Vercel will trigger automatic builds on each git push.

---

## 5. Post-Deployment Smoke Verification

Run these checks against your deployed endpoints:

```bash
# 1. Realtime health check
curl -f https://pairly-realtime.up.railway.app/health
# Expected output: {"status":"ok","service":"@pairly/realtime","rooms":0,...}

# 2. Web landing page
curl -I https://your-domain.com
# Expected output: HTTP/2 200

# 3. Media token generation endpoint
curl -s "https://your-domain.com/api/v1/rooms/test-room/media/token?username=deploy-test"
# Expected output: {"token":"...","url":"wss://..."}
```
