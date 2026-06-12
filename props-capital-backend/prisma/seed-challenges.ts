import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const accountSizes = [5000, 10000, 20000, 30000, 50000, 100000, 200000];
const challengeTypes = ['one_phase', 'two_phase'] as const;

// Discounted (charged) price per (type, size). The struck-through "full" price
// shown on the site is derived as price * 3 client-side (utils/fullPrice.js),
// with a single override for 2-step:20K (397). Keep these in sync with the
// frontend fallback in props-capital-frontend/src/components/home/data/mockData.js.
const priceMap = {
  one_phase: {
    5000: 79,
    10000: 99,
    20000: 159,
    30000: 219,
    50000: 299,
    100000: 499,
    200000: 899,
  },
  two_phase: {
    5000: 59,
    10000: 79,
    20000: 129,
    30000: 179,
    50000: 249,
    100000: 399,
    200000: 699,
  },
} as const;

async function seedChallenges() {
  console.log('🌱 Seeding challenges (authoritative)...');

  // Step 1: deactivate every challenge so stragglers (24K, £-named dupes,
  // wrong-priced rows from old seeds) disappear from the listing without
  // breaking Payment foreign keys.
  const deactivated = await prisma.challenge.updateMany({
    data: { isActive: false },
  });
  console.log(`Deactivated ${deactivated.count} existing rows.`);

  // Step 2: for each canonical (size, type), activate ONE row — preferring
  // the most-recent existing match — and update price/name/currency. Any
  // remaining duplicates stay deactivated and hidden from the frontend.
  for (const type of challengeTypes) {
    for (const size of accountSizes) {
      const name = `${type === 'one_phase' ? '1-Step' : '2-Step'} Challenge - €${(size / 1000).toFixed(0)}K`;
      const description = `${type === 'one_phase' ? 'Single-phase evaluation' : 'Two-phase evaluation'} for €${(size / 1000).toFixed(0)}K account`;
      const price = priceMap[type][size];

      const existing = await prisma.challenge.findFirst({
        where: { accountSize: size, challengeType: type },
        orderBy: { createdAt: 'desc' },
      });

      if (existing) {
        const updated = await prisma.challenge.update({
          where: { id: existing.id },
          data: {
            name,
            description,
            price,
            currency: 'EUR',
            isActive: true,
          },
        });
        console.log(`✓ Activated: ${updated.name} (€${updated.price}) [id=${updated.id}]`);
        continue;
      }

      const created = await prisma.challenge.create({
        data: {
          name,
          description,
          accountSize: size,
          price,
          currency: 'EUR',
          platform: 'MT5',
          challengeType: type,
          phase1TargetPercent: type === 'one_phase' ? 10.0 : 8.0,
          phase2TargetPercent: type === 'one_phase' ? 0 : 5.0,
          dailyDrawdownPercent: type === 'one_phase' ? 4.0 : 5.0,
          overallDrawdownPercent: type === 'one_phase' ? 8.0 : 10.0,
          minTradingDays: 0,
          maxTradingDays: null,
          profitSplit: type === 'one_phase' ? 85.0 : 90.0,
          isActive: true,
          newsTradingAllowed: true,
          weekendHoldingAllowed: true,
          eaAllowed: true,
          scalingEnabled: false,
        },
      });
      console.log(`✓ Created: ${created.name} (€${created.price})`);
    }
  }

  console.log('✅ Challenges seeded successfully!');
}

seedChallenges()
  .catch((e) => {
    console.error('❌ Error seeding challenges:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
