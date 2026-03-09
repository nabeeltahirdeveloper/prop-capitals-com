import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsInt, Min } from 'class-validator';
import { CreateLeadCrmDto } from './create-lead.dto';

export class UpdateLeadCrmDto extends PartialType(CreateLeadCrmDto) {
  @IsOptional()
  @IsInt()
  @Min(0)
  callAttempts?: number;
}
