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
      await (this.prisma as any).directPurchaseLink.create({
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
