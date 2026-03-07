import { IsOptional, IsBoolean } from 'class-validator';

export class UpdateNotificationPreferencesDto {
  @IsOptional()
  @IsBoolean()
  tradeNotifications?: boolean;

  @IsOptional()
  @IsBoolean()
  accountAlerts?: boolean;

  @IsOptional()
  @IsBoolean()
  payoutUpdates?: boolean;

  @IsOptional()
  @IsBoolean()
  challengeUpdates?: boolean;

  @IsOptional()
  @IsBoolean()
  marketingEmails?: boolean;

  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;
}
