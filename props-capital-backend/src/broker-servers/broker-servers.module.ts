import { Module } from '@nestjs/common';
import { BrokerServersService } from './broker-servers.service';
import { BrokerServersController } from './broker-servers.controller';

@Module({
  providers: [BrokerServersService],
  controllers: [BrokerServersController]
})
export class BrokerServersModule {}
