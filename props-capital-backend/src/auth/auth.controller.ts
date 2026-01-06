import { Controller, Post, Body, Get, UseGuards, Req } from '@nestjs/common';

import { AuthService } from './auth.service';

import { JwtAuthGuard } from './jwt.guard';

import type { Request } from 'express';

@Controller('auth')

export class AuthController {

  constructor(private authService: AuthService) {}

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

}
