const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  const grouped = await prisma.payment.groupBy({
    by: ['provider', 'status'],
    _count: { _all: true },
    orderBy: [{ provider: 'asc' }, { status: 'asc' }],
  });
  console.log('Provider × Status counts:\n');
  for (const row of grouped) {
    console.log(`  ${row.provider.padEnd(12)} | ${String(row.status).padEnd(10)} | ${row._count._all}`);
  }
  const total = await prisma.payment.count();
  console.log(`\nTotal: ${total} rows`);
  await prisma.$disconnect();
})();
