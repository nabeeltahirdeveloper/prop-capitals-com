import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';

import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';

import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()

export class AuthService {

  constructor(

    private usersService: UsersService,
    private prisma: PrismaService,
    private emailService: EmailService,

    private jwtService: JwtService,
    private configService: ConfigService,

  ) { }

  private getOtpSecret() {
    return (
      this.configService.get<string>('OTP_SECRET') ||
      this.configService.get<string>('JWT_SECRET') ||
      ''
    );
  }

  private hashOtp(email: string, otp: string) {
    const secret = this.getOtpSecret();
    if (!secret) {
      throw new Error('OTP_SECRET/JWT_SECRET environment variable is not set');
    }
    return crypto.createHmac('sha256', secret).update(`${email}:${otp}`).digest('hex');
  }

  private generateOtp() {
    // 6-digit numeric
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async requestRegisterOtp(data: { email: string; password: string; firstName?: string; lastName?: string }) {
    const email = (data.email || '').trim().toLowerCase();
    if (!email) throw new BadRequestException('Email is required');
    if (!data.password) throw new BadRequestException('Password is required');

    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) throw new BadRequestException('Email already registered');

    const now = new Date();
    const existingOtp = await this.prisma.signupOtp.findUnique({ where: { email } });

    // If we're still within resend cooldown, don't send again—just return cooldown time.
    if (existingOtp && existingOtp.resendAvailableAt > now) {
      return {
        message: 'OTP already sent',
        resendAvailableAt: existingOtp.resendAvailableAt,
      };
    }

    const otp = this.generateOtp();
    // Only log OTP in development mode (not recommended for production)
    if (this.configService.get<string>('NODE_ENV') === 'development') {
      console.log(`🔐 GENERATED OTP FOR ${email}: ${otp}`);
    }
    const otpHash = this.hashOtp(email, otp);
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes
    const resendAvailableAt = new Date(now.getTime() + 60 * 1000); // 60 seconds

    await this.prisma.signupOtp.upsert({
      where: { email },
      update: {
        otpHash,
        expiresAt,
        attempts: 0,
        resendAvailableAt,
      },
      create: {
        email,
        otpHash,
        expiresAt,
        attempts: 0,
        resendAvailableAt,
      },
    });

    console.log('OTP sent successfully', email, otp);

    const emailResult = await this.emailService.sendSignupOtpEmail(email, otp);

    if (!emailResult.success) {
      // Delete the OTP record since email failed
      await this.prisma.signupOtp.delete({ where: { email } }).catch(() => undefined);
      throw new BadRequestException(
        `Failed to send verification email: ${emailResult.error || 'Unknown error'}. Please try again later.`
      );
    }

    return {
      message: 'OTP sent',
      resendAvailableAt,
    };
  }

  async verifyRegisterOtp(data: { email: string; otp: string; password: string; firstName?: string; lastName?: string }) {
    const email = (data.email || '').trim().toLowerCase();
    const otp = (data.otp || '').trim();
    if (!email) throw new BadRequestException('Email is required');
    if (!otp) throw new BadRequestException('OTP is required');
    if (!data.password) throw new BadRequestException('Password is required');

    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) throw new BadRequestException('Email already registered');

    const record = await this.prisma.signupOtp.findUnique({ where: { email } });
    if (!record) throw new BadRequestException('OTP not found. Please request a new code.');

    const now = new Date();
    if (record.expiresAt <= now) {
      await this.prisma.signupOtp.delete({ where: { email } }).catch(() => undefined);
      throw new BadRequestException('OTP expired. Please request a new code.');
    }

    if (record.attempts >= 5) {
      await this.prisma.signupOtp.delete({ where: { email } }).catch(() => undefined);
      throw new BadRequestException('Too many attempts. Please request a new code.');
    }

    const expectedHash = this.hashOtp(email, otp);
    if (expectedHash !== record.otpHash) {
      await this.prisma.signupOtp.update({
        where: { email },
        data: { attempts: { increment: 1 } },
      });
      throw new BadRequestException('Invalid OTP');
    }

    // OTP verified → create user → issue JWT → delete OTP (best-effort)
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await this.usersService.createUser({
      email,
      password: hashedPassword,
      profile: {
        create: {
          firstName: data.firstName,
          lastName: data.lastName,
        },
      },
    });

    await this.prisma.signupOtp.delete({ where: { email } }).catch(() => undefined);

    const token = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  async register(data: { email: string; password: string; firstName?: string; lastName?: string }) {

    const existing = await this.usersService.findByEmail(data.email);

    if (existing) throw new BadRequestException('Email already registered');

    const hashed = await bcrypt.hash(data.password, 10);

    const user = await this.usersService.createUser({

      email: data.email,

      password: hashed,

      profile: {

        create: {

          firstName: data.firstName,

          lastName: data.lastName,

        },

      },

    });

    return {

      message: 'User registered successfully',

      user: {

        id: user.id,

        email: user.email,

      },

    };

  }

  async validateUser(email: string, password: string) {

    const user = await this.usersService.findByEmail(email);

    if (!user) throw new UnauthorizedException('Invalid credentials');

    const match = await bcrypt.compare(password, user.password);

    if (!match) throw new UnauthorizedException('Invalid credentials');

    return user;

  }

  async login(data: { email: string; password: string }) {

    const user = await this.validateUser(data.email, data.password);

    const token = await this.jwtService.signAsync({

      sub: user.id,

      email: user.email,

      role: user.role,

    });

    return {

      accessToken: token,

      user: {

        id: user.id,

        email: user.email,

        role: user.role,

      },

    };

  }

  async getUserStats(userId: string) {
    // 1. Get total completed challenges (phase="FUNDED")
    const totalCompletedChallenges = await this.prisma.tradingAccount.count({
      where: {
        userId,
        phase: 'FUNDED',
      },
    });

    // 2. Total Payouts
    const payouts = await this.prisma.payout.aggregate({
      where: {
        userId,
        status: 'PAID',
      },
      _sum: {
        amount: true,
      },
    });
    const totalPayouts = payouts._sum.amount || 0;

    // 3. WinRate
    // Get all trading accounts for the user
    const tradingAccounts = await this.prisma.tradingAccount.findMany({
      where: { userId },
      select: { id: true },
    });

    const accountIds = tradingAccounts.map((account) => account.id);

    let winRate = 0;

    if (accountIds.length > 0) {
      // Get total trades and winning trades
      const [totalTrades, winningTrades] = await Promise.all([
        this.prisma.trade.count({
          where: {
            tradingAccountId: { in: accountIds },
          },
        }),
        this.prisma.trade.count({
          where: {
            tradingAccountId: { in: accountIds },
            profit: { gt: 0 },
          },
        }),
      ]);

      if (totalTrades > 0) {
        winRate = (winningTrades / totalTrades) * 100;
      }
    }

    return {
      totalCompletedChallenges,
      totalPayouts,
      winRate: parseFloat(winRate.toFixed(2)),
    };
  }

  // Get current user with full profile data
  async getCurrentUser(userId: string) {

    const user = await this.usersService.findById(userId);
    if (!user) throw new BadRequestException('User not found');

    const stats = await this.getUserStats(user.id);

    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      profile: user.profile || null,
      notificationPreference: user.notificationPreference || null,
      verificationDocuments: user.verificationDocuments || [],
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      ...stats,
    };

  }

  // Change password
  async changePassword(userId: string, currentPassword: string, newPassword: string) {

    const user = await this.usersService.findById(userId);

    if (!user) throw new BadRequestException('User not found');

    // Verify current password
    const match = await bcrypt.compare(currentPassword, user.password);

    if (!match) throw new UnauthorizedException('Current password is incorrect');

    // Hash new password
    const hashed = await bcrypt.hash(newPassword, 10);

    // Update password
    await this.usersService.updatePassword(userId, hashed);

    return { message: 'Password changed successfully' };

  }


  async sendResetPasswordOtp(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      return { message: 'If this email exists, an OTP has been sent.' };
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Only log OTP in development mode
    if (this.configService.get<string>('NODE_ENV') === 'development') {
      console.log(`🔐 GENERATED PASSWORD RESET OTP FOR ${email}: ${otp}`);
    }

    await this.prisma.user.update({
      where: { email },
      data: {
        resetPasswordOtp: otp,
        resetPasswordExpiry: expiry,
      },
    });

    // Send OTP email using EmailService (SendGrid)
    const emailResult = await this.emailService.sendPasswordResetOtp(email, otp);

    if (!emailResult.success) {
      // Log error but generally return success to user for security, 
      // UNLESS needed for debugging. Given the user's issue, 
      // if it fails we might want to throw to let them know config is wrong.
      console.error(`Failed to send reset OTP: ${emailResult.error}`);
      throw new BadRequestException('Failed to send email. Please contact support.');
    }

    return { message: 'If this email exists, an OTP has been sent.' };
  }

  async verifyOtpAndResetPassword(email: string, otp: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new BadRequestException('Invalid request');
    }

    if (!user.resetPasswordOtp || user.resetPasswordOtp !== otp) {
      throw new BadRequestException('Invalid OTP');
    }

    if (!user.resetPasswordExpiry || user.resetPasswordExpiry < new Date()) {
      throw new BadRequestException('OTP has expired');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear OTP
    await this.prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        resetPasswordOtp: null,
        resetPasswordExpiry: null,
      },
    });

    return { message: 'Password reset successfully' };
  }





}
