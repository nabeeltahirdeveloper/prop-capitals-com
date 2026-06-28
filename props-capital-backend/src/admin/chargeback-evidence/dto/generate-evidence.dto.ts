import {
  IsString,
  IsOptional,
  IsEmail,
  IsInt,
  IsNumber,
  IsBoolean,
  IsObject,
  Min,
  Max,
  MaxLength,
  IsISO8601,
} from 'class-validator';

export class GenerateEvidenceDto {
  /** Cardholder / customer email the account is created for. */
  @IsEmail()
  email: string;

  /** Challenge plan the customer "purchased". */
  @IsString()
  challengeId: string;

  /** Registration date (date X). ISO-8601. Should be in the past. */
  @IsISO8601()
  registrationDate: string;

  /** Where the evidence pack (communications copy) is sent. */
  @IsOptional()
  @IsEmail()
  recipientEmail?: string;

  /** Amount actually charged (whole currency units). Defaults to plan price. */
  @IsOptional()
  @IsNumber()
  @Min(0)
  amountPaid?: number;

  /** Currency of the charge. Defaults to the plan currency. */
  @IsOptional()
  @IsString()
  @MaxLength(8)
  currency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  lastName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  country?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  /** Card brand for the evidence (e.g. Visa, Mastercard). */
  @IsOptional()
  @IsString()
  @MaxLength(40)
  cardBrand?: string;

  /** Last 4 digits of the card for the evidence. */
  @IsOptional()
  @IsString()
  @MaxLength(4)
  cardLast4?: string;

  /** IP address recorded at registration / terms acceptance (evidence). */
  @IsOptional()
  @IsString()
  @MaxLength(64)
  ipAddress?: string;

  /** Device / user-agent recorded at registration / terms acceptance. */
  @IsOptional()
  @IsString()
  @MaxLength(400)
  userAgent?: string;

  /** Version of the Terms & Conditions that was accepted. */
  @IsOptional()
  @IsString()
  @MaxLength(60)
  termsVersion?: string;

  /** How many losing trades to simulate before the breach. */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  numTrades?: number;

  /** Whether to actually send the evidence emails (default true). */
  @IsOptional()
  @IsBoolean()
  sendEmails?: boolean;

  /**
   * Verbatim transaction record from an uploaded CSV/XLSX (processor export).
   * Stored on the payment and surfaced in the evidence so the report matches
   * the real transaction exactly.
   */
  @IsOptional()
  @IsObject()
  transaction?: Record<string, string>;
}
