import { PaymentsService } from './payments.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-platform-password'),
}));

jest.mock(
  'src/utils/generate-password.util',
  () => ({
    generatePassword: jest.fn(() => 'generated-platform-password'),
  }),
  { virtual: true },
);

describe('PaymentsService', () => {
  const createService = () => {
    const tx = {
      payment: {
        findUnique: jest.fn().mockResolvedValue({ tradingAccountId: null }),
        update: jest.fn().mockResolvedValue({}),
      },
      tradingAccount: {
        create: jest.fn().mockResolvedValue({
          id: 'acct_123456789',
          platform: 'MT5',
        }),
        findUnique: jest.fn(),
      },
      coupon: {
        update: jest.fn(),
      },
    };

    const prisma = {
      payment: {
        findUnique: jest.fn(),
        count: jest.fn(),
      },
      quickLink: {
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
      },
      tradingAccount: {
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
      },
      user: {
        update: jest.fn(),
      },
      userProfile: {
        findUnique: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(tx)),
    };

    const notificationsService = {
      create: jest.fn(),
    };
    const emailService = {
      sendPlatformAccountCredentials: jest.fn().mockResolvedValue({ success: true }),
      sendPurchaseReceiptEmail: jest.fn().mockResolvedValue({ success: true }),
      sendSetPasswordEmail: jest.fn().mockResolvedValue({ success: true }),
    };
    const couponsService = {
      getCouponByCode: jest.fn(),
    };
    const configValues: Record<string, string> = {
      EMAIL_QUICK_LINK_CREDENTIALS_RECIPIENT: 'dummy@prop-capitals.com',
    };
    const configService = {
      get: jest.fn((key: string) => configValues[key]),
    };

    const service = new PaymentsService(
      prisma as any,
      notificationsService as any,
      emailService as any,
      couponsService as any,
      configService as any,
      {} as any,
      {} as any,
    );

    return {
      service,
      prisma,
      tx,
      notificationsService,
      emailService,
      configValues,
    };
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('routes QuickLink MT5 credentials to the configured internal inbox', async () => {
    const {
      service,
      prisma,
      tx,
      notificationsService,
      emailService,
    } = createService();
    prisma.payment.findUnique.mockResolvedValue({
      id: 'payment_1',
      status: 'succeeded',
      reference: 'WC-quicklink-1',
      linkSlug: 'quick-slug',
      tradingAccountId: null,
      couponCode: null,
      amount: 9900,
      currency: 'EUR',
      metadata: { platform: 'MT5' },
      user: {
        id: 'user_1',
        email: 'customer@example.com',
        passwordSet: false,
      },
      challenge: {
        id: 'challenge_1',
        name: 'Two Step 50K',
        accountSize: 50000,
        platform: 'MT5',
        currency: 'EUR',
      },
    });
    prisma.quickLink.findUnique.mockResolvedValue({
      id: 'quicklink_1',
      active: true,
    });

    const account = await service.provisionChallengeAfterPaymentSuccess('payment_1');

    expect(account).toEqual({ id: 'acct_123456789', platform: 'MT5' });
    expect(emailService.sendPlatformAccountCredentials).toHaveBeenCalledWith(
      'dummy@prop-capitals.com',
      'customer-acct_123@prop-capitals.com',
      'generated-platform-password',
      {
        id: 'acct_123',
        platform: 'MT5',
      },
      'setup',
      {
        customerEmail: 'customer@example.com',
        paymentReference: 'WC-quicklink-1',
        linkSlug: 'quick-slug',
      },
    );
    expect(emailService.sendPurchaseReceiptEmail).not.toHaveBeenCalled();
    expect(emailService.sendSetPasswordEmail).not.toHaveBeenCalled();
    expect(notificationsService.create).not.toHaveBeenCalled();
    expect(prisma.quickLink.update).toHaveBeenCalledWith({
      where: { id: 'quicklink_1' },
      data: { active: false },
    });
    expect(tx.payment.update).toHaveBeenCalledWith({
      where: { id: 'payment_1' },
      data: { tradingAccountId: 'acct_123456789' },
    });
  });
});
