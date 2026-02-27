import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt.guard';
import { SupportTicketsService } from './support-tickets.service';
import { CreatePublicTicketDto } from './dto/create-public-ticket.dto';

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;
const rateLimitMap = new Map<string, number[]>();

function getClientIp(req: any): string {
  const forwarded = req.headers?.['x-forwarded-for'];
  if (forwarded) {
    return (typeof forwarded === 'string' ? forwarded : forwarded[0])
      .split(',')[0]
      .trim();
  }
  return req.ip || 'unknown';
}

@Controller('support/public')
export class SupportTicketsPublicController {
  constructor(private readonly service: SupportTicketsService) {}

  @Post('tickets')
  @UseGuards(OptionalJwtAuthGuard)
  async createPublicTicket(@Req() req: any, @Body() dto: CreatePublicTicketDto) {
    const ip = getClientIp(req);
    const now = Date.now();
    const timestamps = (rateLimitMap.get(ip) || []).filter(
      (t) => now - t < RATE_LIMIT_WINDOW_MS,
    );
    if (timestamps.length >= RATE_LIMIT_MAX) {
      throw new BadRequestException(
        'Too many requests. Please wait a minute before trying again.',
      );
    }
    timestamps.push(now);
    rateLimitMap.set(ip, timestamps);

    const userId = req.user?.userId || req.user?.sub || null;
    return this.service.createPublic(userId, dto);
  }
}
