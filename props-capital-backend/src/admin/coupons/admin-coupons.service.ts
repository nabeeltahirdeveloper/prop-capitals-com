import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AdminCouponsService {
  constructor(private prisma: PrismaService) {}

  create(data: any) {
    const parsed = this.parseCouponInput(data);

    return this.prisma.coupon.create({
      data: {
        code: parsed.code,
        discountType: parsed.discountType,
        discountPct: parsed.discountPct,
        maxUses: parsed.maxUses,
        expiresAt: parsed.expiresAt,
        isActive: parsed.isActive,
      },
    });
  }

  getAll() {
    return this.prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  getOne(id: string) {
    return this.prisma.coupon.findUnique({ where: { id } });
  }

  update(id: string, data: any) {
    const parsed = this.parseCouponInput(data, true);

    return this.prisma.coupon.update({
      where: { id },
      data: {
        ...parsed,
      },
    });
  }

  delete(id: string) {
    return this.prisma.coupon.delete({ where: { id } });
  }

  private parseCouponInput(data: any, isUpdate = false) {
    const has = (k: string) => Object.prototype.hasOwnProperty.call(data, k);

    const parsed: any = {};

    if (!isUpdate || has('code')) {
      const code = `${data.code ?? ''}`.trim().toUpperCase();
      if (!code) throw new BadRequestException('Coupon code is required');
      parsed.code = code;
    }

    const discountType = data.discountType ?? 'percentage';
    if (!['percentage', 'fixed'].includes(discountType)) {
      throw new BadRequestException('discountType must be percentage or fixed');
    }
    if (!isUpdate || has('discountType')) {
      parsed.discountType = discountType;
    }

    if (!isUpdate || has('discountPct')) {
      const discountPct = Number(data.discountPct);
      if (!Number.isFinite(discountPct) || discountPct <= 0) {
        throw new BadRequestException('discountPct must be greater than 0');
      }
      if (discountType === 'percentage' && discountPct > 100) {
        throw new BadRequestException(
          'percentage discount cannot exceed 100',
        );
      }
      parsed.discountPct = Math.floor(discountPct);
    }

    if (!isUpdate || has('maxUses')) {
      if (data.maxUses === null || data.maxUses === undefined || data.maxUses === '') {
        parsed.maxUses = null;
      } else {
        const maxUses = Number(data.maxUses);
        if (!Number.isFinite(maxUses) || maxUses < 1) {
          throw new BadRequestException('maxUses must be at least 1');
        }
        parsed.maxUses = Math.floor(maxUses);
      }
    }

    if (!isUpdate || has('expiresAt')) {
      if (!data.expiresAt) {
        parsed.expiresAt = null;
      } else {
        const expiresAt = new Date(data.expiresAt);
        if (Number.isNaN(expiresAt.getTime())) {
          throw new BadRequestException('expiresAt is invalid');
        }
        parsed.expiresAt = expiresAt;
      }
    }

    if (!isUpdate || has('isActive')) {
      parsed.isActive = data.isActive ?? true;
    }

    return parsed;
  }
}
