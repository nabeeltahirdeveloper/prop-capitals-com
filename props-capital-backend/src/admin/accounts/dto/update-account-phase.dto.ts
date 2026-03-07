import { IsEnum } from 'class-validator';
import { TradingPhase } from '@prisma/client';

export class UpdateAccountPhaseDto {
  @IsEnum(TradingPhase, { message: 'Invalid trading phase' })
  phase: TradingPhase;
}
