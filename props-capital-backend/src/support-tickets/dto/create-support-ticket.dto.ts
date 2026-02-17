import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { TicketCategory, TicketPriority } from '@prisma/client';

export class CreateSupportTicketDto {
  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsOptional()
  @Transform(({ value }) => value?.toUpperCase())
  @IsEnum(TicketCategory, { message: 'Invalid ticket category' })
  category?: TicketCategory;

  @IsOptional()
  @Transform(({ value }) => value?.toUpperCase())
  @IsEnum(TicketPriority, { message: 'Invalid ticket priority' })
  priority?: TicketPriority;
}
