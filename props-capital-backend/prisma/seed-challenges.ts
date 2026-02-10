import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedChallenges() {
  console.log('🌱 Seeding challenges...');

  const accountSizes = [5000, 10000, 25000, 50000, 100000, 200000];
  const challengeTypes = ['one_phase', 'two_phase'];

  const priceMap = {
    one_phase: {
      5000: 55,
      10000: 99,
      25000: 189,
      50000: 299,
      100000: 499,
      200000: 949,
    },
    two_phase: {
      5000: 45,
      10000: 79,
      25000: 159,
      50000: 249,
      100000: 449,
      200000: 849,
    },
  };

  for (const type of challengeTypes) {
    for (const size of accountSizes) {
      const name = `${type === 'one_phase' ? '1-Step' : '2-Step'} Challenge - $${(size / 1000).toFixed(0)}K`;
      const price = priceMap[type][size];

      // Check if challenge already exists
      const existing = await prisma.challenge.findFirst({
        where: {
          accountSize: size,
          challengeType: type,
        },
      });

      if (existing) {
        console.log(`✓ Challenge already exists: ${name}`);
        continue;
      }

      const challenge = await prisma.challenge.create({
        data: {
          name,
          description: `${type === 'one_phase' ? 'Single-phase evaluation' : 'Two-phase evaluation'} for $${(size / 1000).toFixed(0)}K account`,
          accountSize: size,
          price,
          platform: 'MT5', // Default platform
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

      console.log(`✓ Created: ${challenge.name} ($${challenge.price})`);
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
