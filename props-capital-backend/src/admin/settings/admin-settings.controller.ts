import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, BadRequestException } from '@nestjs/common';

import { AdminSettingsService } from './admin-settings.service';
import { CreateSettingDto, ALLOWED_GROUPS, SettingsGroup } from './dto/bulk-update-settings.dto';

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
    if (!ALLOWED_GROUPS.includes(group as SettingsGroup)) {
      throw new BadRequestException(`Invalid settings group: ${group}. Allowed: ${ALLOWED_GROUPS.join(', ')}`);
    }
    return this.settingsService.getByGroup(group);
  }

  @Get(':key')
  getByKey(@Param('key') key: string) {
    return this.settingsService.getByKey(key);
  }

  @Post()
  create(@Body() body: CreateSettingDto) {
    return this.settingsService.create(body);
  }

  @Patch('group/:group')
  bulkUpdate(@Param('group') group: string, @Body() body: Record<string, any>) {
    if (!ALLOWED_GROUPS.includes(group as SettingsGroup)) {
      throw new BadRequestException(`Invalid settings group: ${group}. Allowed: ${ALLOWED_GROUPS.join(', ')}`);
    }
    return this.settingsService.bulkUpdate(group, body);
  }

  @Patch(':key')
  update(@Param('key') key: string, @Body() body: { value: string; description?: string }) {
    return this.settingsService.update(key, body);
  }

  @Delete(':key')
  delete(@Param('key') key: string) {
    return this.settingsService.delete(key);
  }
}

