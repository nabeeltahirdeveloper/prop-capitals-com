import { Test, TestingModule } from '@nestjs/testing';
import { TradingAccountsService } from './trading-accounts.service';

describe('TradingAccountsService', () => {
  let service: TradingAccountsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TradingAccountsService],
    }).compile();

    service = module.get<TradingAccountsService>(TradingAccountsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
