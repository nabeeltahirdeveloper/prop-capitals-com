import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { NotificationType, NotificationCategory } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async create(
    userId: string,
    title: string,
    body: string,
    type: NotificationType = NotificationType.INFO,
    category: NotificationCategory = NotificationCategory.SYSTEM,
  ) {
    return this.prisma.notification.create({
      data: { userId, title, body, type, category },
    });
  }

  async getUserNotifications(userId: string) {
    const notifications = await this.prisma.notification.findMany({
      where: { userId },

      orderBy: { createdAt: 'desc' },
    });

    // For backward compatibility: if type/category are missing, infer them from title/body
    return notifications.map((notification) => {
      if (notification.type && notification.category) {
        return notification;
      }

      // Infer type and category from title/body
      const title = notification.title?.toLowerCase() || '';
      const body = notification.body?.toLowerCase() || '';

      let type = notification.type || NotificationType.INFO;
      let category = notification.category || NotificationCategory.SYSTEM;

      // Infer type
      if (!notification.type) {
        if (
          title.includes('completed') ||
          title.includes('success') ||
          title.includes('approved') ||
          title.includes('scaling approved')
        ) {
          type = NotificationType.SUCCESS;
        } else if (title.includes('warning') || title.includes('drawdown')) {
          type = NotificationType.WARNING;
        } else if (
          title.includes('violation') ||
          title.includes('failed') ||
          title.includes('error') ||
          title.includes('rejected') ||
          title.includes('disqualified')
        ) {
          type = NotificationType.ERROR;
        }
      }

      // Infer category
      if (!notification.category) {
        if (title.includes('challenge') || title.includes('phase')) {
          category = NotificationCategory.CHALLENGE;
        } else if (
          title.includes('payout') ||
          title.includes('withdrawal') ||
          title.includes('processed')
        ) {
          category = NotificationCategory.PAYOUT;
        } else if (
          title.includes('account') ||
          title.includes('drawdown') ||
          title.includes('violation') ||
          title.includes('paused') ||
          title.includes('closed') ||
          title.includes('resumed') ||
          title.includes('scaling')
        ) {
          category = NotificationCategory.ACCOUNT;
        }
      }

      return {
        ...notification,
        type,
        category,
      };
    });
  }

  async markAsRead(id: string) {
    return this.prisma.notification.update({
      where: { id },

      data: { read: true },
    });
  }

  async delete(id: string) {
    return this.prisma.notification.delete({
      where: { id },
    });
  }
}
