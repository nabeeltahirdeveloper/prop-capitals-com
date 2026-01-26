import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { BrokerServersService } from './broker-servers.service';
import { BrokerServersController } from './broker-servers.controller';

@Module({
  imports: [PrismaModule],
  providers: [BrokerServersService],
  controllers: [BrokerServersController],
  exports: [BrokerServersService],
})
export class BrokerServersModule {}
