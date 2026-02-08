import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create Prisma client with connection pooling
const createPrismaClient = () => {
  // Prisma 7 requires adapter for PostgreSQL connections
  // Prioritize POSTGRES_PRISMA_URL (Vercel) over DATABASE_URL
  const connectionString =
    process.env.POSTGRES_PRISMA_URL ||
    process.env.DATABASE_URL;

  if (!connectionString) {
    // ビルド時（next build）にはDB接続不要のため、エラーを投げずにログのみ
    if (process.env.NODE_ENV === 'production' || process.env.NEXT_PHASE === 'phase-production-build') {
      console.warn(
        'DATABASE_URL is not set. Prisma client will not be available. ' +
        'This is expected during build phase.'
      );
      // ビルド時はダミーのPrismaClientを返す（実際のDB操作は行わない）
      return new PrismaClient();
    }
    throw new Error(
      'DATABASE_URL or POSTGRES_PRISMA_URL environment variable is not set. ' +
      'Please configure your database connection.'
    );
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
  });
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
