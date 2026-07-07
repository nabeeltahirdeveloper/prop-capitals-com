import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

export type PaymentProvider = 'xoala' | 'worldcard' | 'paytech';
// 'hosted' = WorldCard's hosted-page session (POST /api/v1/session +
//            redirect_url). The customer never enters their card on our
//            domain. Default until the merchant account has S2S APM
//            mapped.
// 's2s'    = WorldCard Server-to-Server SALE. Card entered on /pay/<slug>,
//            POSTed to /payments/worldcard/charge. Requires the protocol
//            mapping to be enabled on the merchant side and the correct
//            PAYMENT_URL.
export type WorldCardFlow = 'hosted' | 's2s';

// ─── Payment provider routing ────────────────────────────────────────────
// The decision tree for which gateway a checkout goes to:
//
//  1. If the customer arrived via a DirectPurchaseLink whose `provider`
//     column is explicitly set ('XOALA' | 'WORLDCARD'), that wins. No
//     50/50 split, no client overrides — the brand owner picked it.
//  2. Otherwise we fall back to the regular-client 50/50 split. The frontend
//     persists the assigned provider in localStorage so the user keeps the
//     same gateway across the whole checkout flow; this endpoint just
//     confirms or assigns one.
//
// Keeping all of this in one place means both the frontend hook AND the
// backend session creators agree on which gateway should handle a given
// payment — there's no risk of the UI showing a Xoala card form while the
// backend creates a WorldCard session.
@Injectable()
export class PaymentProviderRouter {
  private readonly logger = new Logger(PaymentProviderRouter.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) { }

  // Read the WorldCard flow override from env. Defaults to 'hosted'
  // (the Standard Checkout session endpoint POST /api/v1/session, which
  // returns a redirect_url — the customer enters card on WorldCard's
  // own hosted page). The merchant account doesn't have the S2S CARD
  // protocol enabled, so 's2s' is opt-in only and will 404 until
  // WorldCard support maps it on their side.
  worldCardFlow(): WorldCardFlow {
    const raw = (this.configService.get<string>('WORLDCARD_FLOW') || '')
      .trim()
      .toLowerCase();
    return raw === 's2s' ? 's2s' : 'hosted';
  }

  private normalizeProvider(raw: any): PaymentProvider | null {
    if (!raw) return null;
    const s = String(raw).trim().toLowerCase();
    if (s === 'xoala') return 'xoala';
    if (s === 'worldcard' || s === 'world-card' || s === 'wc')
      return 'worldcard';
    if (s === 'paytech' || s === 'flowapay') return 'paytech';
    return null;
  }

  private random5050(): PaymentProvider {
    // Math.random() < 0.5 → xoala, else worldcard. 50/50 by definition.
    return Math.random() < 0.5 ? 'xoala' : 'worldcard';
  }

  // Look up a link by slug and return its forced provider, if any.
  private async lookupLinkProvider(
    linkSlug?: string,
  ): Promise<PaymentProvider | null> {
    if (!linkSlug || typeof linkSlug !== 'string') return null;
    try {
      const link = await (this.prisma as any).directPurchaseLink.findUnique({
        where: { slug: linkSlug },
        select: { provider: true, active: true },
      });
      if (!link || link.active === false) return null;
      return this.normalizeProvider(link.provider);
    } catch (err: any) {
      this.logger.warn(
        `[ProviderRouter] linkSlug=${linkSlug} lookup failed: ${err?.message}`,
      );
      return null;
    }
  }

  /**
   * Resolve which provider should handle a given checkout.
   *
   *   linkSlug          slug of a DirectPurchaseLink the customer clicked
   *   challengeSlug     the route param of /pay/<slug> (also tried as a link)
   *   clientAssigned    provider the client picked (the 50/50 sticky pick)
   *
   * Returns { provider, locked }:
   *   - locked = true when the link forced a specific provider; the frontend
   *     must use the returned `provider` and must NOT reroute.
   *   - locked = false when no link override applied — the client can either
   *     keep using `clientAssigned` if it's valid, or use the new random pick.
   */
  async resolve(input: {
    linkSlug?: string;
    challengeSlug?: string;
    clientAssigned?: string;
  }): Promise<{
    provider: PaymentProvider;
    locked: boolean;
    source: string;
    worldCardFlow: WorldCardFlow;
  }> {
    const worldCardFlow = this.worldCardFlow();
    // 1. Explicit link slug
    const linkProvider = await this.lookupLinkProvider(input.linkSlug);
    if (linkProvider) {
      return {
        provider: linkProvider,
        locked: true,
        source: 'link',
        worldCardFlow,
      };
    }

    // 2. /pay/:slug route param might itself be a link slug (no separate
    //    linkSlug provided). The CheckoutPage forwards both — for /pay/:slug
    //    routes the link slug IS the URL param.
    if (input.challengeSlug && input.challengeSlug !== input.linkSlug) {
      const fromRoute = await this.lookupLinkProvider(input.challengeSlug);
      if (fromRoute) {
        return {
          provider: fromRoute,
          locked: true,
          source: 'route',
          worldCardFlow,
        };
      }
    }

    // 3. No forced provider — honor the client's sticky pick.
    const assigned = this.normalizeProvider(input.clientAssigned);
    if (assigned) {
      return {
        provider: assigned,
        locked: false,
        source: 'client',
        worldCardFlow,
      };
    }

    // 4. Fresh visitor — flip the coin.
    return {
      provider: this.random5050(),
      locked: false,
      source: 'random',
      worldCardFlow,
    };
  }
}
