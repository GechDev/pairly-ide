import { PrismaClient } from '@prisma/client';

export * from '@prisma/client';
export * from './snapshots.js';

declare global {
  // eslint-disable-next-line no-var
  var __pairly_prisma__: PrismaClient | undefined;
}

export interface DatabaseClientOptions {
  logQueries?: boolean;
  databaseUrl?: string;
}

export interface DatabaseHealthResult {
  ok: boolean;
  latencyMs: number;
  error?: string;
}

/**
 * Optimizes PostgreSQL connection URLs for serverless PgBouncer poolers (Neon, Supabase, AWS RDS Proxy).
 */
export function buildHardenedDatabaseUrl(rawUrl?: string): string | undefined {
  if (!rawUrl) return undefined;

  try {
    const parsed = new URL(rawUrl);

    // If host is a known serverless pooler (e.g. Neon -pooler, Supabase pooler, or pgbouncer=true)
    const isPooler =
      parsed.searchParams.get('pgbouncer') === 'true' ||
      parsed.hostname.includes('pooler') ||
      parsed.hostname.includes('neon.tech') ||
      parsed.hostname.includes('supabase.co');

    if (isPooler) {
      if (!parsed.searchParams.has('connection_limit')) {
        parsed.searchParams.set('connection_limit', '10');
      }
      if (!parsed.searchParams.has('pool_timeout')) {
        parsed.searchParams.set('pool_timeout', '20');
      }
      if (!parsed.searchParams.has('sslmode')) {
        parsed.searchParams.set('sslmode', 'require');
      }
    }

    return parsed.toString();
  } catch {
    return rawUrl;
  }
}

/**
 * Creates or retrieves a cached PrismaClient instance with connection pooling safeguards.
 * Avoids exhausting database connection pools during local dev, reload, and serverless execution.
 */
export function getPrismaClient(options: DatabaseClientOptions = {}): PrismaClient {
  const isProduction = typeof process !== 'undefined' && process.env?.['NODE_ENV'] === 'production';

  const rawUrl = options.databaseUrl || process.env?.['DATABASE_URL'];
  const hardenedUrl = buildHardenedDatabaseUrl(rawUrl);

  const prismaOptions: any = {
    log: options.logQueries ? ['query', 'error', 'warn'] : ['error', 'warn'],
  };

  if (hardenedUrl) {
    prismaOptions.datasources = {
      db: {
        url: hardenedUrl,
      },
    };
  }

  if (isProduction) {
    return new PrismaClient(prismaOptions);
  }

  const globalScope = globalThis as unknown as {
    __pairly_prisma__?: PrismaClient;
  };

  if (!globalScope.__pairly_prisma__) {
    globalScope.__pairly_prisma__ = new PrismaClient(prismaOptions);
  }

  return globalScope.__pairly_prisma__;
}

/**
 * Validates database connectivity and measures round-trip latency.
 */
export async function checkDatabaseHealth(
  client: PrismaClient = prisma,
): Promise<DatabaseHealthResult> {
  const start = Date.now();
  try {
    // Standard lightweight health probe query
    await client.$queryRawUnsafe('SELECT 1');
    return {
      ok: true,
      latencyMs: Date.now() - start,
    };
  } catch (err: unknown) {
    return {
      ok: false,
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : 'Database connectivity check failed',
    };
  }
}

/**
 * Cleanly disconnects the Prisma client connection pool.
 */
export async function disconnectPrisma(): Promise<void> {
  const globalScope = globalThis as unknown as {
    __pairly_prisma__?: PrismaClient;
  };
  if (globalScope.__pairly_prisma__) {
    await globalScope.__pairly_prisma__.$disconnect();
    globalScope.__pairly_prisma__ = undefined;
  }
}

export const prisma = getPrismaClient();
