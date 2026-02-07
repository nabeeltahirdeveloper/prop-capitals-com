import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { Prisma } from '@prisma/client';

@Injectable()

export class UsersService {

  constructor(private prisma: PrismaService) { }

  async createUser(data: Prisma.UserCreateInput) {
    return this.prisma.user.create({ data });
  }

  async findByEmail(email: string) {

    return this.prisma.user.findUnique({

      where: { email },

      include: {
        profile: true,
        notificationPreference: true,
        verificationDocuments: {
          orderBy: { uploadedAt: 'desc' },
        },
      },

    });

  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        notificationPreference: true,
        verificationDocuments: {
          orderBy: { uploadedAt: 'desc' },
        },
      },
    });
  }


  //  async findById(id: string) {
  //   return this.prisma.user.findUnique({
  //     where: { id },
  //     include: {
  //       profile: true,
  //       notificationPreference: true,
  //       verificationDocuments: {
  //         orderBy: { uploadedAt: 'desc' },
  //       },
  //     },
  //   });
  // }

  // Get user profile with full details
  async getUserProfile(userId: string) {
    const user = await this.findById(userId)
    if (!user) throw new NotFoundException('User not found');
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      profile: user.profile,
      notificationPreference: user.notificationPreference,
      verificationDocuments: user.verificationDocuments,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

  }

  // Update user profile
  async updateProfile(userId: string, data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
    timezone?: string;
  }) {

    // Upsert profile (create if doesn't exist, update if exists)
    const profile = await this.prisma.userProfile.upsert({
      where: { userId },
      update: data,
      create: {
        userId,
        ...data,
      },
    });
    return profile;
  }

  // Get notification preferences
  async getNotificationPreferences(userId: string) {

    let prefs = await this.prisma.notificationPreference.findUnique({

      where: { userId },

    });

    if (!prefs) {

      prefs = await this.prisma.notificationPreference.create({

        data: { userId }, // Creates with defaults

      });

    }

    return prefs;

  }

  // Update notification preferences
  async updateNotificationPreferences(userId: string, data: {
    tradeNotifications?: boolean;
    accountAlerts?: boolean;
    payoutUpdates?: boolean;
    challengeUpdates?: boolean;
    marketingEmails?: boolean;
    emailNotifications?: boolean;
  }) {
    return this.prisma.notificationPreference.upsert({
      where: { userId },
      update: data,
      create: {
        userId,
        ...data,
      },
    });
  }

  // Get verification documents
  async getVerificationDocuments(userId: string) {

    return this.prisma.verificationDocument.findMany({

      where: { userId },

      orderBy: { uploadedAt: 'desc' },

    });

  }

  // Create/update verification document
  async uploadVerificationDocument(
    userId: string,
    documentType: 'GOVERNMENT_ID' | 'PROOF_OF_ADDRESS',
    fileUrl: string
  ) {

    // Check if document of this type already exists
    const existing = await this.prisma.verificationDocument.findFirst({

      where: {
        userId,
        documentType,
      },

    });

    if (existing) {

      // Update existing document
      return this.prisma.verificationDocument.update({

        where: { id: existing.id },

        data: {
          fileUrl,
          status: 'PENDING',
          uploadedAt: new Date(),
        },

      });

    }

    // Create new document
    return this.prisma.verificationDocument.create({

      data: {
        userId,
        documentType,
        fileUrl,
        status: 'PENDING',
      },

    });

  }

  async updatePassword(userId: string, hashedPassword: string) {

    return this.prisma.user.update({

      where: { id: userId },

      data: { password: hashedPassword },

    });

  }

}
