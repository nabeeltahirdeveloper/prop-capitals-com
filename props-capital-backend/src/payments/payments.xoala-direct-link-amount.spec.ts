import axios from 'axios';

jest.mock('axios');
jest.mock(
  'src/utils/generate-password.util',
  () => ({
    generatePassword: jest.fn(() => 'generated-password'),
  }),
  { virtual: true },
);
jest.mock(
  'src/email/email.service',
  () => ({
    EmailService: class {},
  }),
  { virtual: true },
);

const { PaymentsService } = jest.requireActual('./payments.service');

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('PaymentsService Xoala direct-link custom amount', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('charges the trusted DirectPurchaseLink amount instead of the challenge default', async () => {
    const challenge = {
      id: 'challenge-5k',
      slug: 'challenge-5k',
      name: '5K Challenge',
      accountSize: 5000,
      challengeType: 'one_phase',
      platform: 'MT5',
      price: 59,
      currency: 'EUR',
      isActive: true,
    };
    const brandLink = {
      id: 'link-id',
      slug: 'eleven-eur-link',
      active: true,
      amount: 11,
      currency: 'EUR',
      provider: 'XOALA',
      platform: 'MT5',
      brandId: 'brand-id',
      brand: { id: 'brand-id', slug: 'brand', commissionRate: 0 },
      challenge,
    };
    const prisma = {
      challenge: {
        findUnique: jest.fn().mockResolvedValue(challenge),
        findFirst: jest.fn(),
      },
      directPurchaseLink: {
        findUnique: jest.fn().mockResolvedValue(brandLink),
      },
      brand: {
        findUnique: jest.fn(),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'user-id',
          email: 'buyer@example.com',
          profile: {},
        }),
      },
      payment: {
        create: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({
            id: 'payment-id',
            metadata: data.metadata,
            reference: data.reference,
          }),
        ),
        update: jest.fn().mockResolvedValue({}),
      },
    };
    const configValues: Record<string, string> = {
      XOALA_S2S_BASE_URL: 'https://gateway.example',
      XOALA_MEMBER_ID: 'member-id',
      XOALA_SECURE_KEY: 'secure-key',
      APP_FRONTEND_URL: 'https://app.example',
      APP_BACKEND_URL: 'https://api.example',
      XOALA_TERMINAL_EUR_VISA: 'terminal-eur-visa',
    };
    const service = new PaymentsService(
      prisma as any,
      {} as any,
      {} as any,
      {} as any,
      { get: jest.fn((key: string) => configValues[key]) } as any,
      { getAuthToken: jest.fn().mockResolvedValue('auth-token') } as any,
      {} as any,
    );

    mockedAxios.post.mockResolvedValueOnce({
      status: 200,
      data: {
        paymentId: '101255913',
        transactionStatus: '3D',
        paymentBrand: 'VISA',
        result: {
          code: '90026',
          description: 'ThreeD Authentication Pending',
        },
        redirect: {
          url: 'https://gateway.example/transaction/PGRRedirect?gw=dtv2',
          method: 'POST',
          listofParameters: [{ name: 'xid', value: 'abc' }],
        },
      },
    });

    const result = await service.createXoalaCharge({
      challengeId: challenge.id,
      slug: challenge.slug,
      linkSlug: brandLink.slug,
      currency: 'EUR',
      firstName: 'Buyer',
      lastName: 'Example',
      email: 'buyer@example.com',
      phone: '+12025550100',
      country: 'IE',
      address: '1 Test Street',
      city: 'Dublin',
      postalCode: 'D01',
      card: {
        number: '4111111111111111',
        expiryMonth: '05',
        expiryYear: '2029',
        cvv: '123',
        holder: 'Buyer Example',
      },
    });

    const gatewayBody = new URLSearchParams(
      mockedAxios.post.mock.calls[0][1] as string,
    );
    expect(gatewayBody.get('amount')).toBe('11.00');
    expect(prisma.payment.create.mock.calls[0][0].data).toMatchObject({
      amount: 1100,
      originalAmount: 1100,
      linkSlug: brandLink.slug,
    });
    expect(result).toMatchObject({
      status: 'requires_action',
      redirectMethod: 'POST',
      redirectParams: [{ name: 'xid', value: 'abc' }],
    });
  });

  it('charges the trusted QuickLink amount instead of the challenge default through Xoala', async () => {
    const challenge = {
      id: 'challenge-5k',
      slug: 'challenge-5k',
      name: '2-Step Challenge - €5K',
      accountSize: 5000,
      challengeType: 'two_phase',
      platform: 'MT5',
      price: 59,
      currency: 'EUR',
      isActive: true,
    };
    const quickLink = {
      id: 'quick-link-id',
      slug: 'custom-quick-link',
      active: true,
      provider: 'XOALA',
      amount: 25,
      currency: 'EUR',
      platform: 'MT5',
      challengeId: challenge.id,
      customerUserId: null,
      customerEmail: 'buyer@example.com',
      customerPhone: '+12025550100',
      customerCountry: 'IE',
      brand: { id: 'brand-id', slug: 'brand', commissionRate: 0 },
      challenge,
    };
    const prisma = {
      challenge: {
        findUnique: jest.fn().mockResolvedValue(challenge),
        findFirst: jest.fn(),
      },
      quickLink: {
        findUnique: jest.fn().mockResolvedValue(quickLink),
      },
      directPurchaseLink: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
      brand: {
        findUnique: jest.fn(),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'user-id',
          email: 'buyer@example.com',
          profile: {},
        }),
      },
      payment: {
        create: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({
            id: 'payment-id',
            metadata: data.metadata,
            reference: data.reference,
          }),
        ),
        update: jest.fn().mockResolvedValue({}),
      },
    };
    const configValues: Record<string, string> = {
      XOALA_S2S_BASE_URL: 'https://gateway.example',
      XOALA_MEMBER_ID: 'member-id',
      XOALA_SECURE_KEY: 'secure-key',
      APP_FRONTEND_URL: 'https://app.example',
      APP_BACKEND_URL: 'https://api.example',
      XOALA_TERMINAL_EUR_VISA: 'terminal-eur-visa',
    };
    const service = new PaymentsService(
      prisma as any,
      {} as any,
      {} as any,
      {} as any,
      { get: jest.fn((key: string) => configValues[key]) } as any,
      { getAuthToken: jest.fn().mockResolvedValue('auth-token') } as any,
      {} as any,
    );

    mockedAxios.post.mockResolvedValueOnce({
      status: 200,
      data: {
        paymentId: '101255914',
        transactionStatus: '3D',
        paymentBrand: 'VISA',
        result: {
          code: '90026',
          description: 'ThreeD Authentication Pending',
        },
        redirect: {
          url: 'https://gateway.example/transaction/PGRRedirect?gw=dtv2',
          method: 'POST',
          listofParameters: [{ name: 'xid', value: 'abc' }],
        },
      },
    });

    const result = await service.chargeQuickLink(quickLink.slug, {
      firstName: 'Buyer',
      lastName: 'Example',
      address: '1 Test Street',
      city: 'Dublin',
      postalCode: 'D01',
      card: {
        number: '4111111111111111',
        expiryMonth: '05',
        expiryYear: '2029',
        cvv: '123',
        holder: 'Buyer Example',
      },
    });

    const gatewayBody = new URLSearchParams(
      mockedAxios.post.mock.calls[0][1] as string,
    );
    expect(gatewayBody.get('amount')).toBe('25.00');
    expect(prisma.payment.create.mock.calls[0][0].data).toMatchObject({
      amount: 2500,
      originalAmount: 2500,
      linkSlug: quickLink.slug,
      brandSlug: quickLink.brand.slug,
    });
    expect(result).toMatchObject({
      status: 'requires_action',
      redirectMethod: 'POST',
      redirectParams: [{ name: 'xid', value: 'abc' }],
    });
  });
});
