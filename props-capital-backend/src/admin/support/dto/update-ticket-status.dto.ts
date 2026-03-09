import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { TicketStatus } from '@prisma/client';

export class UpdateTicketStatusDto {
  @IsEnum(TicketStatus, { message: 'Invalid ticket status' })
  status: TicketStatus;

  @IsOptional()
  @IsString()
  @MaxLength(5000, { message: 'Admin reply must not exceed 5000 characters' })
  adminReply?: string;
}
