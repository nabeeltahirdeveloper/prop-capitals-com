import { Test, TestingModule } from '@nestjs/testing';
import { BrokerServersService } from './broker-servers.service';

describe('BrokerServersService', () => {
  let service: BrokerServersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BrokerServersService],
    }).compile();

    service = module.get<BrokerServersService>(BrokerServersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
