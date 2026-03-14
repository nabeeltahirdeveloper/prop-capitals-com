import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RejectPayoutDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
