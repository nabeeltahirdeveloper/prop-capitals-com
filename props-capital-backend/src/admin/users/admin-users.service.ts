import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

import { UserRole } from '@prisma/client';

// Safe fields to expose for trading accounts (excludes credentials)
const SAFE_TRADING_ACCOUNT_SELECT = {
  id: true,
  userId: true,
  challengeId: true,
  phase: true,
  status: true,
  balance: true,
  equity: true,
  initialBalance: true,
  createdAt: true,
  updatedAt: true,
  dailyLockedUntil: true,
  maxEquityToDate: true,
  todayStartEquity: true,
  dailyLossViolated: true,
  drawdownViolated: true,
  platform: true,
  minEquityToday: true,
  minEquityOverall: true,
  lastDailyReset: true,
  peakDailyDrawdownPercent: true,
  peakOverallDrawdownPercent: true,
  peakProfitPercent: true,
  brokerServerId: true,
} as const;

@Injectable()
export class AdminUsersService {
  constructor(private prisma: PrismaService) {}

  // List all users

  async getAllUsers() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },

      include: {
        profile: true,
      },
    });
  }

  // Get user with full details

  async getUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },

      include: {
        profile: true,

        tradingAccounts: {
          select: SAFE_TRADING_ACCOUNT_SELECT,
        },

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
      },

      take: 20,
    });
  }

  // Update user role

  async updateRole(id: string, role: string) {
    if (!Object.values(UserRole).includes(role as UserRole)) {
      throw new BadRequestException('Invalid role');
    }

    // Prevent demoting the last admin
    if ((role as UserRole) === UserRole.TRADER) {
      const adminCount = await this.prisma.user.count({
        where: { role: UserRole.ADMIN },
      });
      if (adminCount <= 1) {
        throw new BadRequestException('Cannot demote the last admin');
      }
    }

    return this.prisma.user.update({
      where: { id },

      data: { role: role as UserRole },
    });
  }
}
