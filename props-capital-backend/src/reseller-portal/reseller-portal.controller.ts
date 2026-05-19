import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ResellerJwtGuard } from './reseller-jwt.guard';
import { ResellerPortalService } from './reseller-portal.service';

@Controller()
export class ResellerPortalController {
  constructor(private readonly svc: ResellerPortalService) {}

  /* ---------- Auth ---------- */

  @Post('auth/reseller-login')
  login(@Body() body: { username: string; password: string }) {
    return this.svc.login(body.username, body.password);
  }

  @Get('auth/reseller-me')
  @UseGuards(ResellerJwtGuard)
  me(@Req() req: any) {
    return this.svc.me(req.user.resellerId);
  }

  @Patch('reseller/password')
  @UseGuards(ResellerJwtGuard)
  changePassword(
    @Req() req: any,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    return this.svc.changePassword(
      req.user.resellerId,
      body.currentPassword,
      body.newPassword,
    );
  }

  /* ---------- Profile ---------- */

  @Get('reseller/profile')
  @UseGuards(ResellerJwtGuard)
  getProfile(@Req() req: any) {
    return this.svc.me(req.user.resellerId);
  }

  @Put('reseller/profile')
  @UseGuards(ResellerJwtGuard)
  updateProfile(@Req() req: any, @Body() body: any) {
    return this.svc.updateProfile(req.user.resellerId, body);
  }

  /* ---------- Dashboard ---------- */

  @Get('reseller/dashboard/stats')
  @UseGuards(ResellerJwtGuard)
  dashboardStats(@Req() req: any) {
    return this.svc.dashboardStats(req.user.resellerId);
  }

  /* ---------- Visits ---------- */

  @Get('reseller/visits')
  @UseGuards(ResellerJwtGuard)
  visits(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.svc.listVisits(req.user.resellerId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('reseller/visits/stats')
  @UseGuards(ResellerJwtGuard)
  visitsStats(@Req() req: any, @Query('days') days?: string) {
    return this.svc.visitsStats(req.user.resellerId, days ? Number(days) : 30);
  }

  /* ---------- Links ---------- */

  @Get('reseller/links')
  @UseGuards(ResellerJwtGuard)
  links(@Req() req: any) {
    return this.svc.listLinks(req.user.resellerId);
  }

  @Get('reseller/brands/:brandId/links')
  @UseGuards(ResellerJwtGuard)
  linksByBrand(@Req() req: any, @Param('brandId') brandId: string) {
    return this.svc.listLinksByBrand(req.user.resellerId, brandId);
  }

  @Post('reseller/links')
  @UseGuards(ResellerJwtGuard)
  createLink(@Req() req: any, @Body() body: any) {
    return this.svc.createLink(req.user.resellerId, body);
  }

  @Put('reseller/links/:id')
  @UseGuards(ResellerJwtGuard)
  updateLink(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.updateLink(req.user.resellerId, id, body);
  }

  @Delete('reseller/links/:id')
  @UseGuards(ResellerJwtGuard)
  deleteLink(@Req() req: any, @Param('id') id: string) {
    return this.svc.deleteLink(req.user.resellerId, id);
  }

  /* ---------- Orders ---------- */

  @Get('reseller/orders')
  @UseGuards(ResellerJwtGuard)
  orders(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.svc.listOrders(req.user.resellerId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  /* ---------- Network ---------- */

  @Get('reseller/network/brands')
  @UseGuards(ResellerJwtGuard)
  networkBrands(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.svc.networkBrands(req.user.resellerId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('reseller/network/transactions')
  @UseGuards(ResellerJwtGuard)
  networkTransactions(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.svc.networkTransactions(req.user.resellerId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Post('reseller/brands')
  @UseGuards(ResellerJwtGuard)
  createBrand(@Req() req: any, @Body() body: any) {
    return this.svc.createBrandUnderReseller(req.user.resellerId, body);
  }

  /* ---------- MIDs / Analytics / Commission / Payouts ---------- */

  @Get('reseller/mids')
  @UseGuards(ResellerJwtGuard)
  mids(@Req() req: any) {
    return this.svc.listMids(req.user.resellerId);
  }

  @Get('reseller/analytics')
  @UseGuards(ResellerJwtGuard)
  analytics(@Req() req: any) {
    return this.svc.analytics(req.user.resellerId);
  }

  @Get('reseller/commission/stats')
  @UseGuards(ResellerJwtGuard)
  commission(@Req() req: any) {
    return this.svc.commissionStats(req.user.resellerId);
  }

  @Get('reseller/payouts')
  @UseGuards(ResellerJwtGuard)
  payouts(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.svc.listPayouts(req.user.resellerId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('reseller/all-transactions')
  @UseGuards(ResellerJwtGuard)
  allTransactions(@Req() req: any) {
    return this.svc.listAllTransactions(req.user.resellerId);
  }

  @Get('reseller/network-transactions')
  @UseGuards(ResellerJwtGuard)
  networkTransactionsLegacy(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.svc.networkTransactions(req.user.resellerId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }
}
