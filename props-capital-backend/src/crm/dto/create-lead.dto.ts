import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsInt,
  IsNumber,
  IsDateString,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import {
  LeadStatus,
  LeadOnlineStatus,
  PaymentMethod,
  PaymentProvider,
  LeadPriority,
} from '@prisma/client';

export class CreateLeadCrmDto {
  @IsString()
  @MaxLength(255)
  personName: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  source?: string;

  @IsOptional()
  @IsEnum(LeadStatus, {
    message: `leadStatus must be one of: ${Object.values(LeadStatus).join(', ')}`,
  })
  leadStatus?: LeadStatus;

  @IsOptional()
  @IsEnum(LeadOnlineStatus, {
    message: `onlineStatus must be one of: ${Object.values(LeadOnlineStatus).join(', ')}`,
  })
  onlineStatus?: LeadOnlineStatus;

  @IsOptional()
  @IsDateString()
  leadReceivedDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  ftdAmount?: number;

  @IsOptional()
  @IsEnum(PaymentMethod, {
    message: `paymentMethod must be one of: ${Object.values(PaymentMethod).join(', ')}`,
  })
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @IsEnum(PaymentProvider, {
    message: `paymentProvider must be one of: ${Object.values(PaymentProvider).join(', ')}`,
  })
  paymentProvider?: PaymentProvider;

  @IsOptional()
  @IsEnum(LeadPriority, {
    message: `priority must be one of: ${Object.values(LeadPriority).join(', ')}`,
  })
  priority?: LeadPriority;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  assignedAgent?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(120)
  age?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  salary?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  jobIndustry?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  workTitle?: string;

  @IsOptional()
  @IsDateString()
  convertedAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  affiliateId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  funnelName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  subParameters?: string;
}
