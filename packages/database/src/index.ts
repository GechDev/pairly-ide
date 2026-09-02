import { PrismaClient } from '@prisma/client';

export * from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __pairly_prisma__: PrismaClient | undefined;
}

export interface DatabaseClientOptions {
  logQueries?: boolean;
}

/**
 * Creates or retrieves a cached PrismaClient instance.
 * Avoids multiple active database connection pools during local dev and reload.
 */
export function getPrismaClient(options: DatabaseClientOptions = {}): PrismaClient {
  const isProduction = typeof process !== 'undefined' && process.env?.['NODE_ENV'] === 'production';

  if (isProduction) {
    return new PrismaClient({
      log: options.logQueries ? ['query', 'error', 'warn'] : ['error', 'warn'],
    });
  }

  const globalScope = globalThis as unknown as { __pairly_prisma__?: PrismaClient };

  if (!globalScope.__pairly_prisma__) {
    globalScope.__pairly_prisma__ = new PrismaClient({
      log: options.logQueries ? ['query', 'error', 'warn'] : ['error', 'warn'],
    });
  }

  return globalScope.__pairly_prisma__;
}

export const prisma = getPrismaClient();
