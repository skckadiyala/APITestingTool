import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.requestHistory.count();
  console.log(`\nTotal history records: ${count}`);
  
  const recent = await prisma.requestHistory.findMany({
    take: 5,
    orderBy: { executedAt: 'desc' },
    select: {
      id: true,
      method: true,
      url: true,
      userId: true,
      statusCode: true,
      executedAt: true,
    },
  });
  
  console.log('\nRecent history entries:');
  console.table(recent);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
