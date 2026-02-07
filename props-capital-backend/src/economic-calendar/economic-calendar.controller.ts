import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { EconomicCalendarService } from './economic-calendar.service';

@Controller('economic-calendar')
export class EconomicCalendarController {
  constructor(private readonly svc: EconomicCalendarService) {}

  @Get()
  async getMonth(@Query('month') month: string) {
    if (!month) throw new BadRequestException('month is required (YYYY-MM)');
    try {
      return await this.svc.fetchMonthUTC(month);
    } catch (e) {
      throw new BadRequestException(String(e?.message ?? e));
    }
  }
}