import { toChallengeDto } from './challenge.dto';

describe('toChallengeDto', () => {
  const raw = {
    id: 'c1',
    slug: 'one-step-5k',
    name: '1-Step 5K',
    description: 'Single-phase evaluation',
    accountSize: 5000,
    price: 79,
    currency: 'EUR',
    platform: 'MT5',
    challengeType: 'one_phase',
    phase1TargetPercent: 10,
    phase2TargetPercent: 0,
    dailyDrawdownPercent: 4,
    overallDrawdownPercent: 8,
    minTradingDays: 5,
    maxTradingDays: null,
    profitSplit: 85,
    eaAllowed: true,
    newsTradingAllowed: true,
    weekendHoldingAllowed: true,
    scalingEnabled: false,
    // internal fields that must NOT leak to the public shape
    isActive: true,
    createdAt: new Date('2025-01-01T00:00:00Z'),
    updatedAt: new Date('2025-01-02T00:00:00Z'),
  };

  it('maps every canonical field from the raw challenge record', () => {
    expect(toChallengeDto(raw)).toEqual({
      id: 'c1',
      slug: 'one-step-5k',
      name: '1-Step 5K',
      description: 'Single-phase evaluation',
      accountSize: 5000,
      price: 79,
      currency: 'EUR',
      platform: 'MT5',
      platforms: ['MT5'],
      challengeType: 'one_phase',
      phase1TargetPercent: 10,
      phase2TargetPercent: 0,
      dailyDrawdownPercent: 4,
      overallDrawdownPercent: 8,
      minTradingDays: 5,
      maxTradingDays: null,
      profitSplit: 85,
      eaAllowed: true,
      newsTradingAllowed: true,
      weekendHoldingAllowed: true,
      scalingEnabled: false,
    });
  });

  it('omits internal fields (createdAt, updatedAt, isActive) from the canonical shape', () => {
    const dto = toChallengeDto(raw);
    expect(dto).not.toHaveProperty('createdAt');
    expect(dto).not.toHaveProperty('updatedAt');
    expect(dto).not.toHaveProperty('isActive');
  });

  it('normalizes missing slug/description/maxTradingDays to null', () => {
    const dto = toChallengeDto({
      ...raw,
      slug: undefined,
      description: undefined,
      maxTradingDays: undefined,
    });
    expect(dto.slug).toBeNull();
    expect(dto.description).toBeNull();
    expect(dto.maxTradingDays).toBeNull();
  });

  it('uses explicit platforms when present, else falls back to [platform]', () => {
    expect(
      toChallengeDto({ ...raw, platforms: ['MT5', 'BYBIT'] }).platforms,
    ).toEqual(['MT5', 'BYBIT']);
    expect(toChallengeDto({ ...raw, platforms: [] }).platforms).toEqual([
      'MT5',
    ]);
    expect(toChallengeDto({ ...raw, platforms: undefined }).platforms).toEqual([
      'MT5',
    ]);
  });
});
