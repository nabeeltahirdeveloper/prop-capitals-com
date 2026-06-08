import sgMail from '@sendgrid/mail';
import { EmailService } from './email.service';

jest.mock('@sendgrid/mail', () => ({
  __esModule: true,
  default: {
    setApiKey: jest.fn(),
    send: jest.fn(),
  },
}));

describe('EmailService', () => {
  const createConfig = (values: Record<string, string | undefined>) => ({
    get: jest.fn((key: string, defaultValue?: string) =>
      values[key] ?? defaultValue,
    ),
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([undefined, 'true', '1', 'yes', 'production'])(
    'keeps email sending enabled when EMAIL_ENABLED is %s',
    (emailEnabled) => {
      const service = new EmailService(
        createConfig({
          EMAIL_ENABLED: emailEnabled,
          SENDGRID_API_KEY: 'sendgrid-key',
        }) as any,
      );

      expect(service.getStatus().enabled).toBe(true);
      expect(service.getStatus().configured).toBe(true);
      expect(sgMail.setApiKey).toHaveBeenCalledWith('sendgrid-key');
    },
  );

  it.each(['false', '0', 'off', 'no', 'disabled', ' FALSE '])(
    'disables email sending only for explicit false-like EMAIL_ENABLED value %s',
    (emailEnabled) => {
      const service = new EmailService(
        createConfig({
          EMAIL_ENABLED: emailEnabled,
          SENDGRID_API_KEY: 'sendgrid-key',
        }) as any,
      );

      expect(service.getStatus().enabled).toBe(false);
      expect(service.getStatus().configured).toBe(false);
      expect(sgMail.setApiKey).not.toHaveBeenCalled();
    },
  );
});
