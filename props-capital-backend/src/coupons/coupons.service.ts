import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CouponsService {
  constructor(private prisma: PrismaService) {}

  async validateCoupon(code: string) {
    if (!code) {
      return { valid: false, message: 'Coupon code is required' };
    }

    const normalizedCode = code.trim().toUpperCase();

    // Try uppercase first (new standard), then exact match for legacy coupons
    let coupon = await this.prisma.coupon.findUnique({
      where: { code: normalizedCode },
    });

    // Fallback: try exact match for legacy coupons with mixed case
    if (!coupon) {
      coupon = await this.prisma.coupon.findUnique({
        where: { code: code.trim() },
      });
    }

    if (!coupon) {
      return { valid: false, message: 'Invalid coupon code' };
    }

    if (!coupon.isActive) {
      return { valid: false, message: 'This coupon is no longer active' };
    }

    if (coupon.expiresAt && new Date() > coupon.expiresAt) {
      return { valid: false, message: 'This coupon has expired' };
    }

    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      return {
        valid: false,
        message: 'This coupon has reached its usage limit',
      };
    }

    return {
      valid: true,
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountPct: coupon.discountPct,
      },
    };
  }

  async getCouponByCode(code: string) {
    return this.prisma.coupon.findUnique({
      where: { code: code.trim().toUpperCase() },
    });
  }
}
