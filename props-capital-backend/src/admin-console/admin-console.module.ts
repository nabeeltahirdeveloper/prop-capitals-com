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

@Module({
  imports: [PrismaModule],
  controllers: [AdminConsoleController],
  providers: [AdminConsoleService, AdminConsoleLogInterceptor],
  exports: [AdminConsoleService],
})
export class AdminConsoleModule implements NestModule, OnApplicationBootstrap {
  constructor(private readonly svc: AdminConsoleService) {}

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
  }

  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(VisitTrackingMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.GET });
  }
}
