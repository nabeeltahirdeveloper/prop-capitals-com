import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Query,
} from '@nestjs/common';
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

  @Get('event')
  async getEventDetail(@Query('path') path: string) {
    if (!path) throw new BadRequestException('path is required');

    // Validate path format: must be /en/economic-calendar/{country}/{indicator}
    const pathPattern = /^\/en\/economic-calendar\/[a-z-]+\/[a-z0-9-]+$/;
    if (!pathPattern.test(path)) {
      throw new BadRequestException(
        'Invalid path format. Expected: /en/economic-calendar/{country}/{indicator}',
      );
    }

    try {
      return await this.svc.fetchEventDetail(path);
    } catch (e) {
      if (e?.message?.includes('404') || e?.message?.includes('not found')) {
        throw new NotFoundException('Event detail page not found');
      }
      throw new BadRequestException(String(e?.message ?? e));
    }
  }
}