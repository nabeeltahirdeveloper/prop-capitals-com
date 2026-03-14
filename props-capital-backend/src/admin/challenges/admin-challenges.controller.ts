import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt.guard';
import { AdminRoleGuard } from '../../auth/admin-role.guard';

import { AdminChallengesService } from './admin-challenges.service';

@Controller('admin/challenges')
@UseGuards(JwtAuthGuard, AdminRoleGuard)
export class AdminChallengesController {

  constructor(private readonly adminChallengesService: AdminChallengesService) {}

  // Get all challenges

  @Get()

  getAll() {

    return this.adminChallengesService.getAll();

  }

  // Get one challenge

  @Get(':id')

  getOne(@Param('id') id: string) {

    return this.adminChallengesService.getOne(id);

  }

  // Create a challenge

  @Post()

  create(@Body() data: any) {

    return this.adminChallengesService.create(data);

  }

  // Update a challenge

  @Patch(':id')

  update(@Param('id') id: string, @Body() data: any) {

    return this.adminChallengesService.update(id, data);

  }

  // Delete a challenge

  @Delete(':id')

  async delete(@Param('id') id: string) {

    return this.adminChallengesService.delete(id);

  }

}

