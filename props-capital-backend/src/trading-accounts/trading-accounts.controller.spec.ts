import { Test, TestingModule } from '@nestjs/testing';
import { TradingAccountsController } from './trading-accounts.controller';

describe('TradingAccountsController', () => {
  let controller: TradingAccountsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TradingAccountsController],
    }).compile();

    controller = module.get<TradingAccountsController>(TradingAccountsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
