import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';

import { AdminSettingsService } from './admin-settings.service';

import { JwtAuthGuard } from '../../auth/jwt.guard';
import { AdminRoleGuard } from '../../auth/admin-role.guard';

@Controller('admin/settings')
@UseGuards(JwtAuthGuard, AdminRoleGuard)

export class AdminSettingsController {

  constructor(private readonly settingsService: AdminSettingsService) {}

  @Get()

  getAll() {

    return this.settingsService.getAll();

  }

  @Get('all/groups')

  getAllGroups() {

    return this.settingsService.getAllGroups();

  }

  @Get('group/:group')

  getByGroup(@Param('group') group: string) {

    return this.settingsService.getByGroup(group);

  }

  @Get(':key')

  getByKey(@Param('key') key: string) {

    return this.settingsService.getByKey(key);

  }

  @Post()

  create(@Body() body: any) {

    return this.settingsService.create(body);

  }

  @Patch('group/:group')

  bulkUpdate(@Param('group') group: string, @Body() body: Record<string, any>) {

    return this.settingsService.bulkUpdate(group, body);

  }

  @Patch(':key')

  update(@Param('key') key: string, @Body() body: any) {

    return this.settingsService.update(key, body);

  }

  @Delete(':key')

  delete(@Param('key') key: string) {

    return this.settingsService.delete(key);

  }



}

