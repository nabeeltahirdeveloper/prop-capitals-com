import { AdminConsoleService } from './admin-console.service';

describe('AdminConsoleService transaction brand assignment', () => {
  const basePayment = {
    id: 'payment_1',
    userId: 'user_1',
    amount: 10000,
    currency: 'USD',
    provider: 'manual',
    status: 'succeeded',
    reference: 'order_1',
    brandId: null,
    brandCommission: 0,
    brandPaidOut: false,
    metadata: {},
    createdAt: new Date('2026-06-01T12:00:00.000Z'),
    updatedAt: new Date('2026-06-01T12:00:00.000Z'),
    user: { email: 'customer@example.com', profile: null },
    challenge: null,
  };

  const createService = () => {
    const prisma = {
      brand: {
        findUnique: jest.fn(),
      },
      payment: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    return {
      prisma,
      service: new AdminConsoleService(prisma as any),
    };
  };

  it('assigns a brand and recalculates commission', async () => {
    const { prisma, service } = createService();
    const brand = {
      id: 'brand_1',
      name: 'Acme Brand',
      slug: 'acme',
      commissionRate: 12.5,
      parentBrand: null,
    };

    prisma.payment.findUnique.mockResolvedValue(basePayment);
    prisma.brand.findUnique.mockResolvedValue(brand);
    prisma.payment.update.mockImplementation(({ data }) =>
      Promise.resolve({
        ...basePayment,
        ...data,
        brand,
        updatedAt: new Date('2026-06-01T12:01:00.000Z'),
      }),
    );

    const result = await service.updateOrder('payment_1', {
      brand_id: 'brand_1',
    });

    expect(prisma.payment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'payment_1' },
        data: expect.objectContaining({
          brandId: 'brand_1',
          brandSlug: 'acme',
          brandPaidOut: false,
          brandCommission: 1250,
        }),
      }),
    );
    expect(result.order).toEqual(
      expect.objectContaining({
        brand_id: 'brand_1',
        brand_name: 'Acme Brand',
        brand_slug: 'acme',
        commission_amount: 12.5,
        commission_rate: 12.5,
      }),
    );
  });

  it('clears a brand assignment and commission', async () => {
    const { prisma, service } = createService();
    const existingPayment = {
      ...basePayment,
      brandId: 'brand_1',
      brandSlug: 'acme',
      brandCommission: 1250,
      brandPaidOut: true,
    };

    prisma.payment.findUnique.mockResolvedValue(existingPayment);
    prisma.payment.update.mockImplementation(({ data }) =>
      Promise.resolve({
        ...existingPayment,
        ...data,
        brand: null,
        updatedAt: new Date('2026-06-01T12:02:00.000Z'),
      }),
    );

    const result = await service.updateOrder('payment_1', {
      brand_id: null,
    });

    expect(prisma.brand.findUnique).not.toHaveBeenCalled();
    expect(prisma.payment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          brandId: null,
          brandSlug: null,
          brandPaidOut: false,
          brandCommission: 0,
        }),
      }),
    );
    expect(result.order).toEqual(
      expect.objectContaining({
        brand_id: null,
        brand_name: null,
        brand_slug: null,
        commission_amount: 0,
        commission_rate: 0,
      }),
    );
  });
});
