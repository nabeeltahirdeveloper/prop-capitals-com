import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RejectScalingDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
