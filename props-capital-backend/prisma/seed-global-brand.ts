/**
 * Seeds the "Global" brand with three WORLDCARD-only DirectPurchaseLinks.
 *
 * Spec (from product):
 *   Username: Global
 *   Links:    199, 299, 320 (three packages, custom amounts)
 *   Gateway:  WorldCard for ALL three (no Xoala routing)
 *
 * Idempotent: re-running this script does not duplicate the brand or its
 * links. Existing links keep their slugs (which is what's already been
 * handed out to the brand). Provider gets forced to 'WORLDCARD' even on
 * re-runs so an accidental admin edit can be re-pinned by replaying the
 * seed.
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

const BRAND_NAME = 'Global';
const BRAND_USERNAME = 'Global';
const BRAND_SLUG = 'global';
// One-time initial password. Prefer an operator-supplied value via
// GLOBAL_BRAND_INITIAL_PASSWORD; otherwise generate a strong random one (printed
// once below). Never hardcode a credential in source. The admin should rotate it
// via the admin console after first login.
const INITIAL_PASSWORD =
  process.env.GLOBAL_BRAND_INITIAL_PASSWORD?.trim() ||
  randomBytes(18).toString('base64url');
const LINK_AMOUNTS = [199, 299, 320];

async function seedGlobalBrand() {
  console.log(`🌱 Seeding "${BRAND_NAME}" brand + WorldCard links...`);

  const passwordHash = await bcrypt.hash(INITIAL_PASSWORD, 10);

  // Brand lookup is case-insensitive (Username unique constraint is
  // case-sensitive at the DB level, but we want to match either form).
  let brand = await prisma.brand.findFirst({
    where: { OR: [{ username: BRAND_USERNAME }, { slug: BRAND_SLUG }] },
  });

  if (!brand) {
    brand = await prisma.brand.create({
      data: {
        name: BRAND_NAME,
        slug: BRAND_SLUG,
        username: BRAND_USERNAME,
        passwordHash,
        accountType: 'brand',
        status: 'active',
        approvalStatus: 'active',
        commissionRate: 10,
        resellerCommission: 0,
      },
    });
    console.log(
      `✓ Created brand "${BRAND_NAME}" (id=${brand.id}, slug=${BRAND_SLUG}, username=${BRAND_USERNAME})`,
    );
    console.log(`  initial password (capture & rotate): ${INITIAL_PASSWORD}`);
  } else {
    console.log(`✓ Brand "${BRAND_NAME}" already exists (id=${brand.id})`);
  }

  // Inspect existing Global links by amount so we don't duplicate when
  // the seed is re-run after the brand owner has shared the slugs.
  const existingLinks = await (prisma as any).directPurchaseLink.findMany({
    where: { brandId: brand.id },
    select: { id: true, slug: true, amount: true, provider: true },
  });
  const byAmount: Record<number, any> = {};
  for (const l of existingLinks) {
    if (l.amount != null) byAmount[Number(l.amount)] = l;
  }

  for (const amount of LINK_AMOUNTS) {
    const existing = byAmount[amount];
    if (existing) {
      if (existing.provider !== 'WORLDCARD') {
        await (prisma as any).directPurchaseLink.update({
          where: { id: existing.id },
          data: { provider: 'WORLDCARD' },
        });
        console.log(`  ↺ Re-pinned $${amount} link (slug=${existing.slug}) to WORLDCARD`);
      } else {
        console.log(`  ✓ $${amount} link already exists (slug=${existing.slug}, WORLDCARD)`);
      }
      continue;
    }

    const slug = randomLinkSlug();
    // Best-effort match a challenge so the destination URL renders the
    // /checkout platform picker (instead of bouncing customers to the
    // marketing /Challenges page). Customer is still charged `amount`
    // — the matched challenge only provides drawdown config + platform.
    const matched = await findClosestChallengeForAmount(amount);
    const created = await (prisma as any).directPurchaseLink.create({
      data: {
        slug,
        name: `Global $${amount}`,
        brandId: brand.id,
        amount,
        currency: 'USD',
        active: true,
        provider: 'WORLDCARD',
        ...(matched ? { challengeId: matched.id } : {}),
      },
    });
    console.log(
      `  + Created $${amount} link (slug=${created.slug}, WORLDCARD${matched ? `, challenge=${matched.id}` : ', no challenge matched'})`,
    );
  }

  console.log('✅ Global brand seed complete.');
}

function randomLinkSlug() {
  return Math.random().toString(36).slice(2, 10);
}

async function findClosestChallengeForAmount(amount: number): Promise<any | null> {
  if (!Number.isFinite(amount) || amount <= 0) return null;
  const challenges = await prisma.challenge.findMany({
    where: { isActive: true },
    select: { id: true, price: true, challengeType: true, accountSize: true },
  });
  if (challenges.length === 0) return null;
  const scored = challenges.map((c: any) => ({
    c,
    diff: Math.abs(Number(c.price ?? 0) - amount),
    typeRank: c.challengeType === 'one_phase' ? 0 : 1,
    size: Number(c.accountSize ?? 0),
  }));
  scored.sort((a: any, b: any) =>
    a.diff !== b.diff
      ? a.diff - b.diff
      : a.typeRank !== b.typeRank
        ? a.typeRank - b.typeRank
        : a.size - b.size,
  );
  return scored[0].c;
}


seedGlobalBrand()
  .catch((e) => {
    console.error('❌ Error seeding Global brand:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
