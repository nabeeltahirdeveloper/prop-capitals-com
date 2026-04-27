import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const GBP_CHALLENGES = [
  {
    slug: 'uk-25k',
    name: 'UK 25K Challenge',
    description: 'Two-phase evaluation for £25,000 funded account',
    accountSize: 25000,
    price: 245,
    currency: 'GBP',
    challengeType: 'two_phase',
    phase1TargetPercent: 8.0,
    phase2TargetPercent: 5.0,
    dailyDrawdownPercent: 5.0,
    overallDrawdownPercent: 10.0,
    profitSplit: 90.0,
  },
  {
    slug: 'uk-50k',
    name: 'UK 50K Challenge',
    description: 'Two-phase evaluation for £50,000 funded account',
    accountSize: 50000,
    price: 490,
    currency: 'GBP',
    challengeType: 'two_phase',
    phase1TargetPercent: 8.0,
    phase2TargetPercent: 5.0,
    dailyDrawdownPercent: 5.0,
    overallDrawdownPercent: 10.0,
    profitSplit: 90.0,
  },
  {
    slug: 'uk-100k',
    name: 'UK 100K Challenge',
    description: 'Two-phase evaluation for £100,000 funded account',
    accountSize: 100000,
    price: 970,
    currency: 'GBP',
    challengeType: 'two_phase',
    phase1TargetPercent: 8.0,
    phase2TargetPercent: 5.0,
    dailyDrawdownPercent: 5.0,
    overallDrawdownPercent: 10.0,
    profitSplit: 90.0,
  },
];

async function seedGbpChallenges() {
  console.log('Seeding GBP challenges...');

  for (const c of GBP_CHALLENGES) {
    const existing = await prisma.challenge.findUnique({ where: { slug: c.slug } });
    if (existing) {
      const updated = await prisma.challenge.update({
        where: { slug: c.slug },
        data: {
          name: c.name,
          description: c.description,
          accountSize: c.accountSize,
          price: c.price,
          currency: c.currency,
          challengeType: c.challengeType,
          phase1TargetPercent: c.phase1TargetPercent,
          phase2TargetPercent: c.phase2TargetPercent,
          dailyDrawdownPercent: c.dailyDrawdownPercent,
          overallDrawdownPercent: c.overallDrawdownPercent,
          profitSplit: c.profitSplit,
          isActive: true,
        },
      });
      console.log(`Updated: ${updated.slug} (${updated.name}) - £${updated.price}`);
      continue;
    }

    const created = await prisma.challenge.create({
      data: {
        slug: c.slug,
        name: c.name,
        description: c.description,
        accountSize: c.accountSize,
        price: c.price,
        currency: c.currency,
        platform: 'MT5',
        challengeType: c.challengeType,
        phase1TargetPercent: c.phase1TargetPercent,
        phase2TargetPercent: c.phase2TargetPercent,
        dailyDrawdownPercent: c.dailyDrawdownPercent,
        overallDrawdownPercent: c.overallDrawdownPercent,
        minTradingDays: 0,
        maxTradingDays: null,
        profitSplit: c.profitSplit,
        isActive: true,
        newsTradingAllowed: true,
        weekendHoldingAllowed: true,
        eaAllowed: true,
        scalingEnabled: false,
      },
    });
    console.log(`Created: ${created.slug} (${created.name}) - £${created.price}`);
  }

  console.log('GBP challenges seeded.');
}

seedGbpChallenges()
  .catch((e) => {
    console.error('Error seeding GBP challenges:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
