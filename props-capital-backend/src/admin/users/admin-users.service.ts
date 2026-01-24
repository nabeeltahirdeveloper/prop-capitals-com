import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

import { UserRole } from '@prisma/client';

@Injectable()
export class AdminUsersService {
  constructor(private prisma: PrismaService) {}

  // List all users

  async getAllUsers() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },

      include: {
        profile: true,

        tradingAccounts: true,
      },
    });
  }

  // Get user with full details

  async getUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },

      include: {
        profile: true,

        tradingAccounts: true,

        payments: true,

        payouts: true,

        notifications: true,

        supportTickets: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');

    return user;
  }

  // Search by email or partial match

  async searchUsers(query: string) {
    if (!query) return [];

    return this.prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: query, mode: 'insensitive' } },

          { profile: { firstName: { contains: query, mode: 'insensitive' } } },

          { profile: { lastName: { contains: query, mode: 'insensitive' } } },
        ],
      },

      orderBy: { createdAt: 'desc' },

      include: {
        profile: true,

        tradingAccounts: true,
      },

      take: 20,
    });
  }

  // Update user role

  async updateRole(id: string, role: string) {
    if (!Object.values(UserRole).includes(role as UserRole)) {
      throw new Error('Invalid role');
    }

    return this.prisma.user.update({
      where: { id },

      data: { role: role as UserRole },
    });
  }
}
