import * as crypto from 'crypto';

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

const { normalizeWorldCardPaymentStatus, WorldCardWebhookService } =
  jest.requireActual('./worldcard.service');

const reverseString = (value: string) => value.split('').reverse().join('');

const buildHostedCallbackSource = (input: any): string => {
  if (input === null || input === undefined) return '';
  if (Array.isArray(input)) {
    return input.map((value) => buildHostedCallbackSource(value)).join('');
  }
  if (typeof input === 'object') {
    return Object.keys(input)
      .sort()
      .map((key) => buildHostedCallbackSource(input[key]))
      .join('');
  }
  return reverseString(String(input));
};

const buildHostedCallbackHash = (
  payloadWithoutHash: Record<string, any>,
  password: string,
) =>
  crypto
    .createHash('md5')
    .update(
      (buildHostedCallbackSource(payloadWithoutHash) + password).toUpperCase(),
    )
    .digest('hex');

const buildCheckoutCallbackHash = (
  payloadWithoutHash: Record<string, any>,
  password: string,
) => {
  const source =
    payloadWithoutHash.id +
    payloadWithoutHash.order_number +
    payloadWithoutHash.order_amount +
    payloadWithoutHash.order_currency +
    payloadWithoutHash.order_description +
    password;
  const md5 = crypto
    .createHash('md5')
    .update(source.toUpperCase())
    .digest('hex');
  return crypto.createHash('sha1').update(md5).digest('hex');
};

describe('normalizeWorldCardPaymentStatus', () => {
  it.each([
    ['success', 'settled', 'succeeded'],
    ['SUCCESS', 'SETTLED', 'succeeded'],
    ['SUCCESS', 'SUCCESS', 'succeeded'],
    ['SUCCESS', 'APPROVED', 'succeeded'],
    ['SUCCESS', 'AUTHORIZED', 'succeeded'],
    ['SUCCESS', 'AUTHORISED', 'succeeded'],
    ['SUCCESS', 'CAPTURED', 'succeeded'],
    ['APPROVED', '', 'succeeded'],
    ['SUCCESS', 'PENDING', 'pending'],
    ['REDIRECT', '3DS', 'pending'],
    ['UNDEFINED', 'PREPARE', 'pending'],
    ['fail', 'decline', 'failed'],
    ['DECLINED', 'APPROVED', 'failed'],
    ['SUCCESS', 'DECLINED', 'failed'],
    ['SUCCESS', 'CHARGEBACK', 'failed'],
  ] as const)(
    'maps result=%s status=%s to %s',
    (result, status, expectedStatus) => {
      expect(normalizeWorldCardPaymentStatus(result, status)).toBe(
        expectedStatus,
      );
    },
  );
});

describe('WorldCardWebhookService', () => {
  const merchantPassword = 'merchant-secret';
  const payment = {
    id: 'payment-id',
    reference: 'WC-approved-1',
    amount: 10000,
    status: 'pending',
    billingEmail: 'buyer@example.com',
    metadata: {
      flow: 'worldcard-hosted',
    },
  };

  const createWebhookService = () => {
    const prisma = {
      payment: {
        findUnique: jest.fn().mockResolvedValue(payment),
        update: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({
            ...payment,
            ...data,
          }),
        ),
      },
    };
    const paymentsService = {
      provisionChallengeAfterPaymentSuccess: jest.fn().mockResolvedValue({
        id: 'trading-account-id',
      }),
    };
    const service = new WorldCardWebhookService(
      prisma as any,
      {
        get: jest.fn((key: string) =>
          key === 'WORLDCARD_PASSWORD' ? merchantPassword : undefined,
        ),
      } as any,
      paymentsService as any,
    );
    return { prisma, paymentsService, service };
  };

  it('marks a documented Checkout settled callback as succeeded for the admin back office', async () => {
    const { prisma, paymentsService, service } = createWebhookService();
    const callbackBody = {
      id: 'wc-public-payment-id',
      order_number: payment.reference,
      order_amount: '100.00',
      order_currency: 'USD',
      order_description: '100K Challenge Account',
      order_status: 'settled',
      type: 'sale',
      status: 'success',
    };
    const payload = {
      ...callbackBody,
      hash: buildCheckoutCallbackHash(callbackBody, merchantPassword),
    };

    await expect(service.handleCallback(payload)).resolves.toBe('OK');

    expect(prisma.payment.update).toHaveBeenCalledWith({
      where: { id: payment.id },
      data: expect.objectContaining({
        providerPaymentId: 'wc-public-payment-id',
        orderStatus: 'settled',
        callbackPayload: payload,
        status: 'succeeded',
      }),
    });
    expect(
      paymentsService.provisionChallengeAfterPaymentSuccess,
    ).toHaveBeenCalledWith(payment.id);
  });

  it('marks an approved WorldCard callback as succeeded for the admin back office', async () => {
    const { prisma, paymentsService, service } = createWebhookService();
    const callbackBody = {
      order_id: payment.reference,
      result: 'SUCCESS',
      status: 'APPROVED',
      amount: '100.00',
      trans_id: 'wc-transaction-id',
    };
    const payload = {
      ...callbackBody,
      hash: buildHostedCallbackHash(callbackBody, merchantPassword),
    };

    await expect(service.handleCallback(payload)).resolves.toBe('OK');

    expect(prisma.payment.update).toHaveBeenCalledWith({
      where: { id: payment.id },
      data: expect.objectContaining({
        providerPaymentId: 'wc-transaction-id',
        orderStatus: 'APPROVED',
        callbackPayload: payload,
        status: 'succeeded',
      }),
    });
    expect(
      paymentsService.provisionChallengeAfterPaymentSuccess,
    ).toHaveBeenCalledWith(payment.id);
  });
});
