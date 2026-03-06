import { Controller, Get, Param, Query, Patch, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt.guard';
import { AdminRoleGuard } from '../../auth/admin-role.guard';

import { AdminUsersService } from './admin-users.service';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, AdminRoleGuard)
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  // GET all users

  @Get()
  async getAllUsers() {
    return this.adminUsersService.getAllUsers();
  }

  // Search users by email - MUST be before :id route to avoid route conflicts

  @Get('search/query')
  async searchUsers(@Query('q') query: string) {
    return this.adminUsersService.searchUsers(query);
  }

  // GET one user with relationships

  @Get(':id')
  async getUser(@Param('id') id: string) {
    return this.adminUsersService.getUser(id);
  }

  // Update user role

  @Patch(':id/role')
  async updateRole(@Param('id') id: string, @Body() body: { role: string }) {
    return this.adminUsersService.updateRole(id, body.role);
  }
}
