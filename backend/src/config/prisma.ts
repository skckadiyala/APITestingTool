import { PrismaClient } from '@prisma/client';

/**
 * Extend the global type to include prisma
 */
declare global {
  var prisma: PrismaClient | undefined;
}

/**
 * Singleton PrismaClient instance
 * This ensures only one instance is created and reused across the entire application,
 * preventing connection pool exhaustion and improving performance.
 */
let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  // In development, use a global variable to preserve the instance across hot reloads
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
}

// Handle graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export { prisma };
