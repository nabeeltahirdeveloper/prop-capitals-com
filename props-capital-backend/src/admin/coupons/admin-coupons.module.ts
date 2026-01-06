import { Module } from '@nestjs/common';

import { AdminCouponsController } from './admin-coupons.controller';

import { AdminCouponsService } from './admin-coupons.service';

import { PrismaModule } from '../../prisma/prisma.module';

@Module({

  imports: [PrismaModule],

  controllers: [AdminCouponsController],

  providers: [AdminCouponsService],

})

export class AdminCouponsModule {}

