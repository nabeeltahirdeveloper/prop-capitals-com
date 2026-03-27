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

  // List all users (paginated)

  async getAllUsers({ page, limit, search, role }: { page: number; limit: number; search?: string; role?: string }) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { profile: { firstName: { contains: search, mode: 'insensitive' } } },
        { profile: { lastName: { contains: search, mode: 'insensitive' } } },
      ];
    }
    if (role && role !== 'all') {
      where.role = role.toUpperCase() as UserRole;
    }

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [data, total, traderCount, adminCount, newThisWeek] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        where,
        orderBy: { createdAt: 'desc' },
        include: { profile: true },
      }),
      this.prisma.user.count({ where }),
      this.prisma.user.count({ where: { role: UserRole.TRADER } }),
      this.prisma.user.count({ where: { role: UserRole.ADMIN } }),
      this.prisma.user.count({ where: { createdAt: { gte: oneWeekAgo } } }),
    ]);

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      summary: { traders: traderCount, admins: adminCount, newThisWeek },
    };
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
