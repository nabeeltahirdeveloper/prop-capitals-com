import { Test, TestingModule } from '@nestjs/testing';
import { ChallengesService } from './challenges.service';
import { PrismaService } from '../prisma/prisma.service';

const rawChallenge = {
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
  isActive: true,
  createdAt: new Date('2025-01-01T00:00:00Z'),
  updatedAt: new Date('2025-01-02T00:00:00Z'),
};

describe('ChallengesService', () => {
  let service: ChallengesService;

  const prismaMock = {
    challenge: {
      findMany: jest.fn().mockResolvedValue([rawChallenge]),
      findUnique: jest.fn().mockResolvedValue(rawChallenge),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    prismaMock.challenge.findMany.mockResolvedValue([rawChallenge]);
    prismaMock.challenge.findUnique.mockResolvedValue(rawChallenge);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChallengesService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<ChallengesService>(ChallengesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('findAll returns canonical DTOs without internal fields', async () => {
    const result = await service.findAll();

    expect(result).toHaveLength(1);
    expect(result[0]).not.toHaveProperty('isActive');
    expect(result[0]).not.toHaveProperty('createdAt');
    expect(result[0]).not.toHaveProperty('updatedAt');
    expect(result[0]).toMatchObject({
      id: 'c1',
      accountSize: 5000,
      challengeType: 'one_phase',
      profitSplit: 85,
    });
  });

  it('findOne returns the canonical DTO shape', async () => {
    const result = await service.findOne('c1');

    expect(result).not.toHaveProperty('isActive');
    expect(result).toMatchObject({ id: 'c1', accountSize: 5000 });
  });
});
