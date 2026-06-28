/**
 * Canonical, public-facing shape of a challenge.
 *
 * This is the single source of truth for what the `/challenges` endpoints expose
 * to every consumer (public site, trader panel). Internal columns such as
 * `isActive`, `createdAt` and `updatedAt` are intentionally omitted.
 */
export interface ChallengeDto {
  id: string;
  slug: string | null;
  name: string;
  description: string | null;
  accountSize: number;
  price: number;
  currency: string;
  platform: string;
  platforms: string[];
  challengeType: string;
  phase1TargetPercent: number;
  phase2TargetPercent: number;
  dailyDrawdownPercent: number;
  overallDrawdownPercent: number;
  minTradingDays: number;
  maxTradingDays: number | null;
  profitSplit: number;
  eaAllowed: boolean;
  newsTradingAllowed: boolean;
  weekendHoldingAllowed: boolean;
  scalingEnabled: boolean;
}

/** Map a raw Prisma `Challenge` record to the canonical public shape. */
export function toChallengeDto(c: any): ChallengeDto {
  return {
    id: c.id,
    slug: c.slug ?? null,
    name: c.name,
    description: c.description ?? null,
    accountSize: c.accountSize,
    price: c.price,
    currency: c.currency,
    platform: c.platform,
    platforms:
      Array.isArray(c.platforms) && c.platforms.length > 0
        ? c.platforms
        : c.platform
          ? [c.platform]
          : [],
    challengeType: c.challengeType,
    phase1TargetPercent: c.phase1TargetPercent,
    phase2TargetPercent: c.phase2TargetPercent,
    dailyDrawdownPercent: c.dailyDrawdownPercent,
    overallDrawdownPercent: c.overallDrawdownPercent,
    minTradingDays: c.minTradingDays,
    maxTradingDays: c.maxTradingDays ?? null,
    profitSplit: c.profitSplit,
    eaAllowed: c.eaAllowed,
    newsTradingAllowed: c.newsTradingAllowed,
    weekendHoldingAllowed: c.weekendHoldingAllowed,
    scalingEnabled: c.scalingEnabled,
  };
}
