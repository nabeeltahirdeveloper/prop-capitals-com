import { IsString, IsOptional, IsInt, IsEnum, MinLength, MaxLength, Min, Max } from 'class-validator';
import { ChallengePlatform } from '@prisma/client';

export class CreateBrokerServerDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsEnum(ChallengePlatform)
  platform: ChallengePlatform;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  server_address: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  server_port?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
