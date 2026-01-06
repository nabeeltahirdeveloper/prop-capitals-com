import { Controller, Post, Body } from '@nestjs/common';

import { PaymentsService } from './payments.service';

@Controller('payments')

export class PaymentsController {

  constructor(private readonly service: PaymentsService) {}

  @Post('purchase')

  async purchase(@Body() body: any) {

    console.log('PURCHASE BODY:', body); // debug

    return this.service.purchaseChallenge(body);

  }

}
