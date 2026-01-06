import { Injectable } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()

export class AdminCouponsService {

  constructor(private prisma: PrismaService) {}

  create(data: any) {

    return this.prisma.coupon.create({

      data: {

        code: data.code,

        discountPct: data.discountPct,

        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,

        isActive: data.isActive ?? true,

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

    return this.prisma.coupon.update({

      where: { id },

      data: {

        code: data.code,

        discountPct: data.discountPct,

        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,

        isActive: data.isActive,

      },

    });

  }

  delete(id: string) {

    return this.prisma.coupon.delete({ where: { id } });

  }

}

