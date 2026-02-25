import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';

import { AdminCouponsService } from './admin-coupons.service';
import { JwtAuthGuard } from '../../auth/jwt.guard';
import { AdminRoleGuard } from '../../auth/admin-role.guard';

@Controller('admin/coupons')
@UseGuards(JwtAuthGuard, AdminRoleGuard)

export class AdminCouponsController {

  constructor(private readonly couponsService: AdminCouponsService) {}

  @Post()

  create(@Body() body: any) {

    return this.couponsService.create(body);

  }

  @Get()

  getAll() {

    return this.couponsService.getAll();

  }

  @Get(':id')

  getOne(@Param('id') id: string) {

    return this.couponsService.getOne(id);

  }

  @Patch(':id')

  update(@Param('id') id: string, @Body() body: any) {

    return this.couponsService.update(id, body);

  }

  @Delete(':id')

  delete(@Param('id') id: string) {

    return this.couponsService.delete(id);

  }

}

