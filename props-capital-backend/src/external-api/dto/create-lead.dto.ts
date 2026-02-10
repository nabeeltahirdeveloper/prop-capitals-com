import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsArray,
  ValidateNested,
  ArrayMaxSize,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { LeadStatus, LeadPriority } from '@prisma/client';

export class CreateLeadDto {
  @IsString()
  personName: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsEnum(LeadStatus, {
    message: `leadStatus must be one of: ${Object.values(LeadStatus).join(', ')}`,
  })
  leadStatus?: LeadStatus;

  @IsOptional()
  @IsEnum(LeadPriority, {
    message: `priority must be one of: ${Object.values(LeadPriority).join(', ')}`,
  })
  priority?: LeadPriority;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(120)
  age?: number;

  @IsOptional()
  @IsString()
  salary?: string;

  @IsOptional()
  @IsString()
  jobIndustry?: string;

  @IsOptional()
  @IsString()
  workTitle?: string;

  @IsOptional()
  @IsString()
  affiliateId?: string;

  @IsOptional()
  @IsString()
  funnelName?: string;

  @IsOptional()
  @IsString()
  subParameters?: string;
}

export class CreateLeadBulkDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateLeadDto)
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  leads: CreateLeadDto[];
}
