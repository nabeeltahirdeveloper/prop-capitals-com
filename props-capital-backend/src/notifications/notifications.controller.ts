import { Controller, Post, Get, Param, Body, Patch } from '@nestjs/common';

import { NotificationsService } from './notifications.service';

@Controller('notifications')

export class NotificationsController {

  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()

  async createNotification(@Body() body: { 
    userId: string; 
    title: string; 
    body: string;
    type?: string;
    category?: string;
  }) {

    return this.notificationsService.create(
      body.userId, 
      body.title, 
      body.body,
      body.type as any,
      body.category as any
    );

  }

  @Get('user/:userId')

  async getUserNotifications(@Param('userId') userId: string) {

    return this.notificationsService.getUserNotifications(userId);

  }

  @Patch(':id/read')

  async markAsRead(@Param('id') id: string) {

    return this.notificationsService.markAsRead(id);

  }

}
