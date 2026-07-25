import { PrismaClient } from '@prisma/client';

/**
 * In serverless environments (Vercel), each function invocation may spin up a
 * new Node.js instance. We attach the PrismaClient to the global object to
 * reuse the same instance across hot-reloads in development and to avoid
 * exhausting the database connection pool in production.
 */

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

const prisma: PrismaClient =
  global.__prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

export default prisma;
