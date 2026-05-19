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
import { BrandPortalService } from './brand-portal.service';
import { BrandJwtGuard } from './brand-jwt.guard';

/**
 * Brand-portal HTTP layer.
 *
 * Two route groups:
 *   /auth/brand-login  + /auth/brand-me + /brand/password (auth)
 *   /brand/*           (everything else, requires brand JWT)
 *
 * Mirrors visionscope-frontend's serverApi.brand.* and serverApi.auth.brandLogin.
 */
@Controller()
export class BrandPortalController {
  constructor(private readonly svc: BrandPortalService) {}

  /* ---------- Auth (no guard) ---------- */

  @Post('auth/brand-login')
  brandLogin(@Body() body: { username: string; password: string }) {
    return this.svc.login(body.username, body.password);
  }

  @Get('auth/brand-me')
  @UseGuards(BrandJwtGuard)
  brandMe(@Req() req: any) {
    return this.svc.me(req.user.brandId);
  }

  @Patch('brand/password')
  @UseGuards(BrandJwtGuard)
  changePassword(
    @Req() req: any,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    return this.svc.changePassword(
      req.user.brandId,
      body.currentPassword,
      body.newPassword,
    );
  }

  /* ---------- Profile ---------- */

  @Get('brand/profile')
  @UseGuards(BrandJwtGuard)
  getProfile(@Req() req: any) {
    return this.svc.me(req.user.brandId);
  }

  @Put('brand/profile')
  @UseGuards(BrandJwtGuard)
  updateProfile(@Req() req: any, @Body() body: any) {
    return this.svc.updateProfile(req.user.brandId, body);
  }

  /* ---------- Dashboard ---------- */

  @Get('brand/dashboard/stats')
  @UseGuards(BrandJwtGuard)
  dashboardStats(@Req() req: any) {
    return this.svc.dashboardStats(req.user.brandId);
  }

  @Get('brand/dashboard/recent')
  @UseGuards(BrandJwtGuard)
  dashboardRecent(@Req() req: any) {
    return this.svc.dashboardRecent(req.user.brandId);
  }

  @Get('brand/dashboard/daily')
  @UseGuards(BrandJwtGuard)
  dashboardDaily(@Req() req: any, @Query('days') days?: string) {
    return this.svc.dashboardDaily(req.user.brandId, days ? Number(days) : 30);
  }

  /* ---------- Visits ---------- */

  @Get('brand/visits')
  @UseGuards(BrandJwtGuard)
  visits(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.svc.listVisits(req.user.brandId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('brand/visits/stats')
  @UseGuards(BrandJwtGuard)
  visitsStats(@Req() req: any, @Query('days') days?: string) {
    return this.svc.visitsStats(req.user.brandId, days ? Number(days) : 30);
  }

  /* ---------- Direct purchase links / brand links ---------- */

  @Get('brand/links')
  @UseGuards(BrandJwtGuard)
  listLinks(@Req() req: any) {
    return this.svc.listLinks(req.user.brandId);
  }
  @Post('brand/links')
  @UseGuards(BrandJwtGuard)
  createLink(@Req() req: any, @Body() body: any) {
    return this.svc.createLink(req.user.brandId, body);
  }
  @Put('brand/links/:id')
  @UseGuards(BrandJwtGuard)
  updateLink(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.updateLink(req.user.brandId, id, body);
  }
  @Delete('brand/links/:id')
  @UseGuards(BrandJwtGuard)
  deleteLink(@Req() req: any, @Param('id') id: string) {
    return this.svc.deleteLink(req.user.brandId, id);
  }

  // Aliases used by visionscope under "direct-purchase-links"
  @Get('brand/direct-purchase-links')
  @UseGuards(BrandJwtGuard)
  listDirectPurchaseLinks(@Req() req: any) {
    return this.svc.listLinks(req.user.brandId);
  }
  @Post('brand/direct-purchase-links')
  @UseGuards(BrandJwtGuard)
  createDirectPurchaseLink(@Req() req: any, @Body() body: any) {
    return this.svc.createLink(req.user.brandId, body);
  }
  @Patch('brand/direct-purchase-links/:id')
  @UseGuards(BrandJwtGuard)
  updateDirectPurchaseLink(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.svc.updateLink(req.user.brandId, id, body);
  }
  @Delete('brand/direct-purchase-links/:id')
  @UseGuards(BrandJwtGuard)
  deleteDirectPurchaseLink(@Req() req: any, @Param('id') id: string) {
    return this.svc.deleteLink(req.user.brandId, id);
  }

  /* ---------- Orders / Transactions ---------- */

  @Get('brand/orders')
  @UseGuards(BrandJwtGuard)
  listOrders(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.svc.listOrders(req.user.brandId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('brand/all-transactions')
  @UseGuards(BrandJwtGuard)
  listAllTransactions(@Req() req: any) {
    return this.svc.listAllTransactions(req.user.brandId);
  }

  @Get('brand/child-transactions')
  @UseGuards(BrandJwtGuard)
  listChildTransactions(@Req() req: any) {
    return this.svc.listChildTransactions(req.user.brandId);
  }

  @Get('brand/network-transactions')
  @UseGuards(BrandJwtGuard)
  listNetworkTransactions(@Req() req: any) {
    return this.svc.listNetworkTransactions(req.user.brandId);
  }

  /* ---------- Network ---------- */

  @Get('brand/network')
  @UseGuards(BrandJwtGuard)
  listNetwork(@Req() req: any) {
    return this.svc.listNetwork(req.user.brandId);
  }

  /* ---------- Analytics ---------- */

  @Get('brand/analytics')
  @UseGuards(BrandJwtGuard)
  analytics(@Req() req: any) {
    return this.svc.analytics(req.user.brandId);
  }

  /* ---------- Commission ---------- */

  @Get('brand/commission/stats')
  @UseGuards(BrandJwtGuard)
  commissionStats(@Req() req: any) {
    return this.svc.commissionStats(req.user.brandId);
  }

  /* ---------- Payouts ---------- */

  @Get('brand/payouts')
  @UseGuards(BrandJwtGuard)
  listPayouts(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.svc.listPayouts(req.user.brandId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('brand/payouts/unpaid')
  @UseGuards(BrandJwtGuard)
  listUnpaidPayouts(@Req() req: any) {
    return this.svc.listUnpaidPayouts(req.user.brandId);
  }
}
