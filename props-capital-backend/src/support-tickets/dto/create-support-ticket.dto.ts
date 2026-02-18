import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { TicketCategory, TicketPriority } from '@prisma/client';

export class CreateSupportTicketDto {
  // Accept userId from body as a fallback for clients that pass it explicitly
  @IsOptional()
  @IsString()
  userId?: string;

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
