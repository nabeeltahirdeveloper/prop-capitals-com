import { IsEnum } from 'class-validator';
import { TradingAccountStatus } from '@prisma/client';

export class UpdateAccountStatusDto {
  @IsEnum(TradingAccountStatus, { message: 'Invalid account status' })
  status: TradingAccountStatus;
}
