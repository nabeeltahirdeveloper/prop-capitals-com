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

const prisma = new PrismaClient();

const BRAND_NAME = 'Global';
const BRAND_USERNAME = 'Global';
const BRAND_SLUG = 'global';
// One-time password; the admin should change it via the admin console
// after first login. Kept here so re-running the seed yields a stable
// known credential during onboarding.
const DEFAULT_PASSWORD = 'GlobalBrand@2026';
const LINK_AMOUNTS = [199, 299, 320];

async function seedGlobalBrand() {
  console.log(`🌱 Seeding "${BRAND_NAME}" brand + WorldCard links...`);

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

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
    console.log(`  default password: ${DEFAULT_PASSWORD}`);
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
    const created = await (prisma as any).directPurchaseLink.create({
      data: {
        slug,
        name: `Global $${amount}`,
        brandId: brand.id,
        amount,
        currency: 'USD',
        active: true,
        provider: 'WORLDCARD',
      },
    });
    console.log(`  + Created $${amount} link (slug=${created.slug}, WORLDCARD)`);
  }

  console.log('✅ Global brand seed complete.');
}

function randomLinkSlug() {
  return Math.random().toString(36).slice(2, 10);
}

seedGlobalBrand()
  .catch((e) => {
    console.error('❌ Error seeding Global brand:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
