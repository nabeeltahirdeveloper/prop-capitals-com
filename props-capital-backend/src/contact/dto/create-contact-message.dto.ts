import { IsString, IsNotEmpty, IsEmail, IsOptional, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { ContactCategory } from '@prisma/client';

export class CreateContactMessageDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsOptional()
  @Transform(({ value }) => value?.toUpperCase())
  @IsEnum(ContactCategory, { message: 'Invalid contact category' })
  category?: ContactCategory;

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  message: string;
}
