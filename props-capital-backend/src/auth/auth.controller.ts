import { Controller, Post, Body, Get, UseGuards, Req, Param, BadRequestException } from '@nestjs/common';

import { AuthService } from './auth.service';

import { JwtAuthGuard } from './jwt.guard';

import type { Request } from 'express';
import { AuthPayload } from './auth-payload.decorator';
import { JwtPayload } from './types';

@Controller('auth')

export class AuthController {

  constructor(private authService: AuthService) { }

  @Post('register')
  register(@Body() body: any) {
    return this.authService.register(body);
  }

  @Post('register/request-otp')
  requestRegisterOtp(@Body() body: any) {
    return this.authService.requestRegisterOtp(body);
  }

  @Post('register/verify-otp')
  verifyRegisterOtp(@Body() body: any) {
    return this.authService.verifyRegisterOtp(body);
  }

  @Post('login')
  login(@Body() body: any) {
    return this.authService.login(body);
  }

  @Post('account/:accountId/platform-login')
  @UseGuards(JwtAuthGuard)
  processPlatformLogin(
    @Param('accountId') accountId: string,
    @Body() body: { email: string; password: string },
    @AuthPayload() user: JwtPayload,
  ) {
    if (!body.email || !body.password) {
      throw new BadRequestException('email and password are required');
    }
    return this.authService.processPlatformLogin(
      user,
      accountId,
      body.email,
      body.password,
    );
  }

  @Post('account/:accountId/validate-platform-access')
  @UseGuards(JwtAuthGuard)
  validatePlatformAccess(
    @Param('accountId') accountId: string,
    @Body() body: { platformToken: string },
    @AuthPayload() user: JwtPayload,
  ) {
    if (!body.platformToken) {
      throw new BadRequestException('platformToken is required');
    }
    return this.authService.validatePlatformAccess(
      user,
      accountId,
      body.platformToken,
    );
  }


  @Post('account/:accountId/reset-password')
  @UseGuards(JwtAuthGuard)
  resetPlatformPassword(
    @Param('accountId') accountId: string,
    @AuthPayload() user: JwtPayload,
  ) {
    return this.authService.resetPlatformPassword(user, accountId);
  }


  @UseGuards(JwtAuthGuard)

  @Get('me')

  async me(@Req() req: any) {

    // Return full user data including profile
    const user = await this.authService.getCurrentUser(req.user.userId);

    return user;

  }

  @UseGuards(JwtAuthGuard)

  @Post('change-password')

  async changePassword(@Req() req: any, @Body() body: { currentPassword: string; newPassword: string }) {

    return this.authService.changePassword(req.user.userId, body.currentPassword, body.newPassword);

  }
  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string) {
    return this.authService.sendResetPasswordOtp(email);
  }

  @Post('reset-password')
  async resetPassword(@Body() body: { email: string; otp: string; newPassword: string }) {
    const { email, otp, newPassword } = body;
    return this.authService.verifyOtpAndResetPassword(email, otp, newPassword);
  }

}
