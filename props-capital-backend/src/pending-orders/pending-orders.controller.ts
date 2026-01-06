import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { PendingOrdersService } from './pending-orders.service';

@Controller('pending-orders')
export class PendingOrdersController {
  constructor(private readonly service: PendingOrdersService) {}

  @Post()
  createPendingOrder(@Body() body: any) {
    return this.service.createPendingOrder(body);
  }

  @Get('account/:accountId')
  async getPendingOrders(@Param('accountId') accountId: string) {
    return this.service.getPendingOrders(accountId);
  }

  @Patch(':id/cancel')
  async cancelPendingOrder(@Param('id') id: string) {
    return this.service.cancelPendingOrder(id);
  }

  @Patch(':id/execute')
  async executePendingOrder(
    @Param('id') id: string,
    @Body() body: { executionPrice?: number },
  ) {
    return this.service.executePendingOrder(id, body?.executionPrice);
  }
}
