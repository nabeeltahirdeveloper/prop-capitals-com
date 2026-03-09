import { IsObject, IsString, IsIn } from 'class-validator';

export const ALLOWED_GROUPS = ['general', 'branding', 'payments', 'integrations'] as const;
export type SettingsGroup = (typeof ALLOWED_GROUPS)[number];

export const ALLOWED_KEYS: Record<SettingsGroup, string[]> = {
  general: ['platform_name', 'support_email', 'maintenance_mode'],
  branding: ['primary_color', 'secondary_color', 'logo_url'],
  payments: ['stripe_enabled', 'paypal_enabled', 'crypto_enabled', 'stripe_key', 'paypal_client_id'],
  integrations: ['mt4_enabled', 'mt5_enabled', 'ctrader_enabled', 'dxtrade_enabled'],
};

export const SENSITIVE_KEYS = ['payments.stripe_key', 'payments.paypal_client_id'];

export class BulkUpdateSettingsDto {
  @IsObject()
  settings: Record<string, any>;
}

export class CreateSettingDto {
  @IsString()
  key: string;

  @IsString()
  value: string;

  @IsString()
  description?: string;
}
