import { Controller, Get, Param, Query, Patch, Body } from '@nestjs/common';

import { AdminUsersService } from './admin-users.service';

@Controller('admin/users')

export class AdminUsersController {

  constructor(private readonly adminUsersService: AdminUsersService) {}

  // GET all users

  @Get()

  async getAllUsers() {

    return this.adminUsersService.getAllUsers();

  }

  // GET one user with relationships

  @Get(':id')

  async getUser(@Param('id') id: string) {

    return this.adminUsersService.getUser(id);

  }

  // Search users by email

  @Get('/search/query')

  async searchUsers(@Query('q') query: string) {

    return this.adminUsersService.searchUsers(query);

  }

  // Update user role

  @Patch(':id/role')

  async updateRole(@Param('id') id: string, @Body() body: { role: string }) {

    return this.adminUsersService.updateRole(id, body.role);

  }

}

