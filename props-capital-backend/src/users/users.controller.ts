import { Controller, Get, Patch, Body, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @UseGuards(JwtAuthGuard)
  @Get('me/profile')
  async getProfile(@Req() req: any) {
    return this.usersService.getUserProfile(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/profile')
  async updateProfile(@Req() req: any, @Body() body: any) {
    return this.usersService.updateProfile(req.user.userId, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/notification-preferences')
  async getNotificationPreferences(@Req() req: any) {
    return this.usersService.getNotificationPreferences(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/notification-preferences')
  async updateNotificationPreferences(@Req() req: any, @Body() body: any) {
    return this.usersService.updateNotificationPreferences(req.user.userId, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/verification-documents')
  async getVerificationDocuments(@Req() req: any) {
    return this.usersService.getVerificationDocuments(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/verification-documents')
  async uploadVerificationDocument(@Req() req: any, @Body() body: { documentType: string; fileUrl: string }) {
    return this.usersService.uploadVerificationDocument(
      req.user.userId,
      body.documentType as 'GOVERNMENT_ID' | 'PROOF_OF_ADDRESS',
      body.fileUrl
    );
  }
}
