import { Controller, Get, Param, Query, Patch, Body, UseGuards, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt.guard';
import { AdminRoleGuard } from '../../auth/admin-role.guard';

import { AdminUsersService } from './admin-users.service';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, AdminRoleGuard)
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  // GET all users (paginated)

  @Get()
  async getAllUsers(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('role') role?: string,
  ) {
    return this.adminUsersService.getAllUsers({ page, limit, search, role });
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
