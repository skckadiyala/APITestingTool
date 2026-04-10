import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

/**
 * Extend the global type to include prisma
 */
declare global {
  var prisma: PrismaClient | undefined;
}

/**
 * Create PostgreSQL connection pool
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * Create Prisma adapter for PostgreSQL
 */
const adapter = new PrismaPg(pool as any);

/**
 * Singleton PrismaClient instance
 * This ensures only one instance is created and reused across the entire application,
 * preventing connection pool exhaustion and improving performance.
 */
let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({ adapter } as any);
} else {
  // In development, use a global variable to preserve the instance across hot reloads
  if (!global.prisma) {
    global.prisma = new PrismaClient({ adapter } as any);
  }
  prisma = global.prisma;
}

// Handle graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export { prisma };
