import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Deprecated: seed-challenges.ts is now authoritative and seeds the full
// EUR challenge set (including 2K) while deactivating any stragglers.
// This script is kept only to soft-deactivate legacy UK/24K rows by name
// for environments that haven't run the authoritative seed yet.
async function deactivateLegacyChallenges() {
  console.log('Deactivating legacy UK / GBP challenge rows...');

  const result = await prisma.challenge.updateMany({
    where: {
      OR: [
        { accountSize: 24000 },
        { name: { contains: 'UK ' } },
        { name: { contains: '£' } },
        { currency: 'GBP' },
      ],
    },
    data: { isActive: false },
  });

  console.log(`Deactivated ${result.count} legacy rows.`);
}

deactivateLegacyChallenges()
  .catch((e) => {
    console.error('Error deactivating legacy challenges:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
