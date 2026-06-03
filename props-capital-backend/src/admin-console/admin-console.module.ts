import {
  MiddlewareConsumer,
  Module,
  NestModule,
  OnApplicationBootstrap,
  RequestMethod,
} from '@nestjs/common';
import { AdminConsoleController } from './admin-console.controller';
import { AdminConsoleService } from './admin-console.service';
import { AdminConsoleLogInterceptor } from './admin-console-log.interceptor';
import { VisitTrackingMiddleware } from './visit-tracking.middleware';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [PrismaModule],
  controllers: [AdminConsoleController],
  providers: [AdminConsoleService, AdminConsoleLogInterceptor],
  exports: [AdminConsoleService],
})
export class AdminConsoleModule implements NestModule, OnApplicationBootstrap {
  constructor(
    private readonly svc: AdminConsoleService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * On startup, run a one-time idempotent backfill so every brand in the
   * database has its full set of direct purchase links (Main + one per active
   * Challenge). Brands created before this logic landed, or brands whose
   * links got deleted, are caught here. Idempotent — already-provisioned
   * (brandId, challengeId) pairs are skipped inside autoCreateBrandLinks.
   */
  async onApplicationBootstrap() {
    try {
      const result = await this.svc.backfillBrandLinks();
      // eslint-disable-next-line no-console
      console.log(
        `[AdminConsole] Direct purchase link backfill complete: ` +
          `${result.brands_processed} brands, ${result.total_links_created} new links created.`,
      );
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error(
        '[AdminConsole] Backfill failed (will retry on next startup):',
        err?.message,
      );
    }

    // Also ensure the "Global" brand exists with its three WORLDCARD-only
    // links ($199 / $299 / $320). Idempotent — see ensureGlobalBrand().
    try {
      const summary = await this.ensureGlobalBrand();
      // eslint-disable-next-line no-console
      console.log(
        `[AdminConsole] Global brand seed: brand=${summary.brandStatus}, links created=${summary.linksCreated}, repinned=${summary.linksRepinned}.`,
      );
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error(
        '[AdminConsole] Global brand seed failed (will retry on next startup):',
        err?.message,
      );
    }

    // Backfill: any amount-only link still missing a challengeId (e.g.
    // Global's three before this code shipped, or admin-created links from
    // before auto-match landed) gets one attached by best-effort price
    // match. Without this the link's destination_url falls back to the
    // public /Challenges page; with it, the customer lands on the
    // platform picker as intended.
    try {
      const attached = await this.attachChallengesToOrphanLinks();
      if (attached > 0) {
        // eslint-disable-next-line no-console
        console.log(
          `[AdminConsole] Attached challenges to ${attached} legacy amount-only link(s).`,
        );
      }
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error(
        '[AdminConsole] Orphan-link backfill failed (will retry on next startup):',
        err?.message,
      );
    }
  }

  /**
   * Walk every active DirectPurchaseLink that has an `amount` but no
   * `challengeId` and no custom_url override, and assign the best-fit
   * challenge so the link's destination URL points to /checkout (platform
   * picker) instead of the marketing /Challenges page.
   *
   * Idempotent: links that already have a challengeId or a custom_url
   * are skipped.
   */
  private async attachChallengesToOrphanLinks(): Promise<number> {
    const orphans = await (this.prisma as any).directPurchaseLink.findMany({
      where: { challengeId: null, active: true },
      select: { id: true, amount: true, metadata: true },
    });
    let attached = 0;
    for (const l of orphans) {
      const meta = (l.metadata && typeof l.metadata === 'object') ? l.metadata : {};
      // Skip links the admin explicitly pointed at a custom URL.
      if (meta?.custom_url) continue;
      const amount = Number(l.amount ?? 0);
      if (!Number.isFinite(amount) || amount <= 0) continue;
      const matched = await this.svc.findClosestChallengeForAmount(amount);
      if (!matched) continue;
      await (this.prisma as any).directPurchaseLink.update({
        where: { id: l.id },
        data: { challengeId: matched.id },
      });
      attached += 1;
    }
    return attached;
  }

  /**
   * Provisions the "Global" brand and its three pinned WorldCard links.
   * Safe to call repeatedly; never duplicates or overwrites existing
   * data beyond re-pinning the provider override.
   */
  private async ensureGlobalBrand() {
    const BRAND_NAME = 'Global';
    const BRAND_USERNAME = 'Global';
    const BRAND_SLUG = 'global';
    const DEFAULT_PASSWORD = 'GlobalBrand@2026';
    const LINK_AMOUNTS = [199, 299, 320];

    let brand = await this.prisma.brand.findFirst({
      where: { OR: [{ username: BRAND_USERNAME }, { slug: BRAND_SLUG }] },
    });

    let brandStatus: 'created' | 'existing' = 'existing';
    if (!brand) {
      const bcrypt = await import('bcrypt');
      const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
      brand = await this.prisma.brand.create({
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
      brandStatus = 'created';
    }

    const existing = await (this.prisma as any).directPurchaseLink.findMany({
      where: { brandId: brand.id },
      select: { id: true, slug: true, amount: true, provider: true },
    });
    const byAmount = new Map<number, any>();
    for (const l of existing) {
      if (l.amount != null) byAmount.set(Number(l.amount), l);
    }

    let linksCreated = 0;
    let linksRepinned = 0;
    for (const amount of LINK_AMOUNTS) {
      const found = byAmount.get(amount);
      if (found) {
        if (found.provider !== 'WORLDCARD') {
          await (this.prisma as any).directPurchaseLink.update({
            where: { id: found.id },
            data: { provider: 'WORLDCARD' },
          });
          linksRepinned += 1;
        }
        continue;
      }
      const slug = Math.random().toString(36).slice(2, 10);
      // Best-effort match a challenge so the destination URL renders the
      // platform picker step instead of dumping the customer on the public
      // /Challenges page. The matched challenge's drawdown rules apply
      // post-purchase; the customer-facing price still comes from `amount`.
      const matched = await this.svc.findClosestChallengeForAmount(amount);
      await (this.prisma as any).directPurchaseLink.create({
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
      linksCreated += 1;
    }

    return { brandStatus, linksCreated, linksRepinned };
  }

  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(VisitTrackingMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.GET });
  }
}
