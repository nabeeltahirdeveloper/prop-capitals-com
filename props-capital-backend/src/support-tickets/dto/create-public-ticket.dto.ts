import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsEnum,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { TicketCategory, TicketPriority } from '@prisma/client';

export class CreatePublicTicketDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

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
