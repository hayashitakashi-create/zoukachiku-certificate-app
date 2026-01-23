import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Skip Prisma initialization during build time
const createPrismaClient = () => {
  if (process.env.SKIP_DB_INIT === 'true') {
    return {} as PrismaClient;
  }
  return new PrismaClient({
    log: ['query', 'error', 'warn'],
  });
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
