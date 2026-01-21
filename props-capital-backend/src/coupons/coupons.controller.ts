import { Controller, Post, Body } from '@nestjs/common';
import { CouponsService } from './coupons.service';

@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Post('validate')
  async validate(@Body() body: { code: string }) {
    return this.couponsService.validateCoupon(body.code);
  }
}
