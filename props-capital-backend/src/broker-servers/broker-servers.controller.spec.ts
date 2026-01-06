import { Test, TestingModule } from '@nestjs/testing';
import { BrokerServersController } from './broker-servers.controller';

describe('BrokerServersController', () => {
  let controller: BrokerServersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BrokerServersController],
    }).compile();

    controller = module.get<BrokerServersController>(BrokerServersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
