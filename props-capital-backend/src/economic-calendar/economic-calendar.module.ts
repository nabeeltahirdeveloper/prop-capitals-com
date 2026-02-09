import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';
import { EconomicCalendarController } from './economic-calendar.controller';
import { EconomicCalendarService } from './economic-calendar.service';

@Module({
  imports: [
    HttpModule,
    CacheModule.register({
      ttl: 60 * 10, // 10 min
      max: 500,
    }),
  ],
  controllers: [EconomicCalendarController],
  providers: [EconomicCalendarService],
})
export class EconomicCalendarModule {}