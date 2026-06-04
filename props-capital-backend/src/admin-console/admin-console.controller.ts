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
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { AdminRoleGuard } from '../auth/admin-role.guard';
import { AdminConsoleService } from './admin-console.service';
import { AdminConsoleLogInterceptor } from './admin-console-log.interceptor';

/**
 * AdminConsoleController
 *
 * Mounts everything under /admin-console/* to avoid colliding with the
 * existing prop-capitals /admin/* controllers. The visionscope-style admin
 * frontend (in props-capital-frontend-admin/src/components/admin-console)
 * calls these endpoints via @/api/adminConsole.
 *
 * Phase 1: Dashboard (analytics) + Users are wired to real prop-capitals
 * data. Everything else returns empty shapes so the 24 sections render
 * without errors. Each stub will be replaced section-by-section as Prisma
 * models for brands, currencies, visits, etc. are added.
 */
@Controller('admin-console')
@UseGuards(JwtAuthGuard, AdminRoleGuard)
@UseInterceptors(AdminConsoleLogInterceptor)
export class AdminConsoleController {
  constructor(private readonly svc: AdminConsoleService) {}

  /* ============================================================
   *  LIVE — Dashboard / Analytics
   * ============================================================ */

  @Get('analytics/overview')
  analyticsOverview() {
    return this.svc.analyticsOverview();
  }

  @Get('analytics/revenue-chart')
  revenueChart(@Query('days') days?: string) {
    return this.svc.revenueChart(days ? Number(days) : 30);
  }

  @Get('analytics/package-distribution')
  packageDistribution(
    @Query('days') days?: string,
    @Query('limit') limit?: string,
  ) {
    return this.svc.packageDistribution(
      days ? Number(days) : 30,
      limit ? Number(limit) : 10,
    );
  }

  /* ============================================================
   *  LIVE — Users
   * ============================================================ */

  @Get('users')
  listUsers() {
    return this.svc.listUsers();
  }

  @Post('users')
  createUser(@Body() body: any) {
    return this.svc.createUser(body);
  }

  @Patch('users/:id')
  updateUser(@Param('id') id: string, @Body() body: any) {
    return this.svc.updateUser(id, body);
  }

  /* ============================================================
   *  STUBS — to be implemented as Prisma models land
   *  Each returns the *shape* the frontend expects so sections
   *  render with empty state instead of errors.
   * ============================================================ */

  /* ---- Packages (mapped to Challenge) ---- */
  @Get('packages')
  listPackages() {
    return this.svc.listPackages();
  }
  @Get('packages/:id')
  getPackage(@Param('id') id: string) {
    return this.svc.getPackage(id);
  }
  @Post('packages')
  createPackage(@Body() body: any) {
    return this.svc.createPackage(body);
  }
  @Put('packages/:id')
  updatePackage(@Param('id') id: string, @Body() body: any) {
    return this.svc.updatePackage(id, body);
  }
  @Delete('packages/:id')
  deletePackage(@Param('id') id: string) {
    return this.svc.deletePackage(id);
  }

  @Get('package-prices/:id')
  getPackagePrices(@Param('id') _id: string) {
    return { prices: [] };
  }
  @Put('package-prices/:id')
  updatePackagePrices(@Param('id') _id: string) {
    return { prices: [] };
  }

  /* ---- Currencies (live: AdminCurrency) ---- */
  @Get('currencies')
  listCurrencies() {
    return this.svc.listCurrencies();
  }
  @Put('currencies/:code')
  updateCurrency(@Param('code') code: string, @Body() body: any) {
    return this.svc.updateCurrency(code, body);
  }
  @Post('currencies/sync-rates')
  syncRates() {
    return { success: true, updated: 0 };
  }
  @Put('currencies/conversion-fee')
  updateConversionFee() {
    return { success: true };
  }
  @Delete('currencies/:code')
  deleteCurrency(@Param('code') code: string) {
    return this.svc.deleteCurrency(code);
  }

  /* ---- Currency Geo Mappings (live) ---- */
  @Get('currency-geo-mappings')
  listCurrencyGeoMappings() {
    return this.svc.listCurrencyGeoMappings();
  }
  @Post('currency-geo-mappings')
  createCurrencyGeoMapping(@Body() body: any) {
    return this.svc.createCurrencyGeoMapping(body);
  }
  @Put('currency-geo-mappings/:countryCode')
  updateCurrencyGeoMapping(@Param('countryCode') c: string, @Body() body: any) {
    return this.svc.updateCurrencyGeoMapping(c, body);
  }
  @Delete('currency-geo-mappings/:countryCode')
  deleteCurrencyGeoMapping(@Param('countryCode') c: string) {
    return this.svc.deleteCurrencyGeoMapping(c);
  }

  /* ---- Payment Gateway Mappings (live) ---- */
  @Get('payment-gateway-mappings')
  listPaymentGatewayMappings() {
    return this.svc.listPaymentGatewayMappings();
  }
  @Post('payment-gateway-mappings')
  createPaymentGatewayMapping(@Body() body: any) {
    return this.svc.createPaymentGatewayMapping(body);
  }
  @Put('payment-gateway-mappings/:countryCode')
  updatePaymentGatewayMapping(@Param('countryCode') c: string, @Body() body: any) {
    return this.svc.updatePaymentGatewayMapping(c, body);
  }
  @Delete('payment-gateway-mappings/:countryCode')
  deletePaymentGatewayMapping(@Param('countryCode') c: string) {
    return this.svc.deletePaymentGatewayMapping(c);
  }
  @Post('payment-gateway-mappings/bulk')
  bulkPaymentGatewayMappings(@Body() body: { mappings: any[] }) {
    return this.svc.bulkPaymentGatewayMappings(body?.mappings ?? []);
  }

  /* ---- Brands (live: Brand) ---- */
  @Get('brands/pending')
  listPendingBrands(@Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return this.svc.listPendingBrands({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
  }
  @Get('brands/unpaid-transactions')
  brandsUnpaidTransactions(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('brandId') brandId?: string,
  ) {
    return this.svc.listBrandsUnpaidTransactions({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      brandId,
    });
  }
  @Get('brands')
  listBrands(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('q') q?: string,
    @Query('status') status?: string,
  ) {
    return this.svc.listBrands({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      q,
      status,
    });
  }
  @Get('brands/:id')
  getBrand(@Param('id') id: string) {
    return this.svc.getBrand(id);
  }
  @Post('brands')
  createBrand(@Body() body: any) {
    return this.svc.createBrand(body);
  }
  @Patch('brands/:id')
  updateBrand(@Param('id') id: string, @Body() body: any) {
    return this.svc.updateBrand(id, body);
  }
  @Post('brands/bulk-delete')
  bulkDeleteBrands(@Body() body: { ids: string[] }) {
    return this.svc.bulkDeleteBrands(body?.ids ?? []);
  }
  @Delete('brands/:id')
  deleteBrand(@Param('id') id: string) {
    return this.svc.deleteBrand(id);
  }
  @Get('brands/:id/dashboard')
  brandDashboard(@Param('id') id: string) {
    return this.svc.getBrandDashboard(id);
  }
  @Post('brands/:id/approve')
  approveBrand(@Param('id') id: string) {
    return this.svc.approveBrand(id);
  }
  @Post('brands/:id/reject')
  rejectBrand(@Param('id') id: string, @Body() body: { reason?: string }) {
    return this.svc.rejectBrand(id, body?.reason);
  }
  @Post('brands/:id/reset-password')
  resetBrandPassword(@Param('id') id: string) {
    return this.svc.resetBrandPassword(id);
  }

  @Get('brand-wallets')
  listBrandWallets(@Query('q') q?: string) {
    return this.svc.listBrandWallets({ q });
  }

  /* ---- Direct purchase links (live: DirectPurchaseLink) ---- */
  @Get('direct-purchase-links')
  listDirectPurchaseLinks(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('brand_id') brandId?: string,
  ) {
    return this.svc.listDirectPurchaseLinks({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      brandId,
    });
  }
  @Get('direct-purchase-links/brand/:brandId')
  listDirectPurchaseLinksByBrand(@Param('brandId') id: string) {
    return this.svc.listDirectPurchaseLinksByBrand(id);
  }

  /**
   * Provision direct purchase links for every brand in the system. Idempotent.
   * Used after seeding brands or adding new challenges.
   */
  @Post('direct-purchase-links/backfill')
  backfillBrandLinks() {
    return this.svc.backfillBrandLinks();
  }

  @Post('direct-purchase-links')
  createDirectPurchaseLink(@Body() body: any) {
    return this.svc.createDirectPurchaseLink(body);
  }

  @Patch('direct-purchase-links/:id')
  updateDirectPurchaseLink(@Param('id') id: string, @Body() body: any) {
    return this.svc.updateDirectPurchaseLink(id, body);
  }

  @Delete('direct-purchase-links/:id')
  deleteDirectPurchaseLink(@Param('id') id: string) {
    return this.svc.deleteDirectPurchaseLink(id);
  }

  @Get('direct-purchase-links/challenges')
  listChallengesForLinks() {
    return this.svc.listChallengesForLinks();
  }

  /* ---- Quick Links (admin-assisted one-shot payment URLs) ---- */
  @Get('quick-links')
  listQuickLinks(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.svc.listQuickLinks({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Post('quick-links')
  createQuickLink(@Body() body: any) {
    return this.svc.createQuickLink(body);
  }

  @Delete('quick-links/:id')
  deleteQuickLink(@Param('id') id: string) {
    return this.svc.deleteQuickLink(id);
  }

  /**
   * Provision (or top up) direct purchase links for a single brand.
   */
  @Post('brands/:id/regenerate-links')
  regenerateBrandLinks(@Param('id') id: string) {
    return this.svc.regenerateBrandLinks(id);
  }

  /* ---- Orders (mapped to Payment) ---- */
  @Get('orders')
  listOrders(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.svc.listOrders({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      search,
      status,
    });
  }
  @Get('orders/:id')
  getOrder(@Param('id') id: string) {
    return this.svc.getOrder(id);
  }
  @Post('orders')
  createOrder() {
    return { order: null };
  }
  @Post('orders/manual')
  createManualOrder() {
    return { order: null };
  }
  @Patch('orders/:id')
  updateOrder(@Param('id') _id: string) {
    return { order: null };
  }
  @Delete('orders/:id')
  deleteOrder(@Param('id') id: string) {
    return this.svc.deleteOrder(id);
  }

  /* ---- Visits (live: Visit) ---- */
  @Get('visits')
  listVisits(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.svc.listVisits({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }
  @Get('visits/stats')
  visitsStats() {
    return this.svc.visitsStats();
  }

  /* ---- All transactions (live: Payment table) ---- */
  @Get('all-transactions')
  allTransactions(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.svc.listAllTransactions({ from, to, status, search });
  }

  /* ---- Payouts (live: Payout table) ---- */
  @Get('payouts')
  listPayouts(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.svc.listPayouts({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status,
    });
  }
  @Post('payouts/mark-paid')
  markPayoutsPaid(@Body() body: { orderIds?: string[]; brandIds?: string[] }) {
    return this.svc.markPayoutsPaid(body);
  }

  /* ---- IP whitelist (live: IpWhitelist + IpWhitelistSettings) ---- */
  @Get('ip-whitelist')
  listIpWhitelist() {
    return this.svc.listIpWhitelist();
  }
  @Post('ip-whitelist')
  addIpWhitelist(@Body() body: { ip: string; label?: string }) {
    return this.svc.addIpWhitelist(body);
  }
  @Delete('ip-whitelist/:id')
  deleteIpWhitelist(@Param('id') id: string) {
    return this.svc.deleteIpWhitelist(id);
  }
  @Get('ip-whitelist/settings')
  getIpWhitelistSettings() {
    return this.svc.getIpWhitelistSettings();
  }
  @Patch('ip-whitelist/settings')
  updateIpWhitelistSettings(@Body() body: any) {
    return this.svc.updateIpWhitelistSettings(body);
  }

  /* ---- Blocked IPs (live: BlockedIp) ---- */
  @Get('blocked-ips')
  listBlockedIps(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.svc.listBlockedIps({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status,
    });
  }
  @Get('blocked-ips/:ip')
  getBlockedIp(@Param('ip') ip: string) {
    return this.svc.getBlockedIp(ip);
  }
  @Get('blocked-ips/:ip/attempts')
  getBlockedIpAttempts(@Param('ip') ip: string) {
    return this.svc.getBlockedIpAttempts(ip);
  }
  @Patch('blocked-ips/:ip')
  updateBlockedIp(@Param('ip') ip: string, @Body() body: { action?: string }) {
    return this.svc.updateBlockedIp(ip, body?.action);
  }

  /* ---- System tools ---- */
  @Post('fix-usd-amounts')
  fixUsdAmounts() {
    return this.svc.fixUsdAmounts();
  }

  /* ---- Logs (live: AdminLog) ---- */
  @Get('logs')
  listLogs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('level') level?: string,
    @Query('category') category?: string,
    @Query('action') action?: string,
    @Query('userEmail') userEmail?: string,
    @Query('search') search?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.svc.listAdminLogs({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      level,
      category,
      action,
      userEmail,
      search,
      startDate,
      endDate,
    });
  }
  @Get('logs/meta')
  logsMeta() {
    return this.svc.adminLogsMeta();
  }
  @Get('logs/critical')
  logsCritical() {
    return this.svc.criticalAdminLogs();
  }
  @Delete('logs/cleanup')
  logsCleanup(@Body() body: { daysToKeep?: number }) {
    return this.svc.cleanupAdminLogs(body?.daysToKeep ?? 90);
  }

  /* ---- Bot logs (live: BotLog) ---- */
  @Get('bot-logs')
  listBotLogs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('level') level?: string,
    @Query('category') category?: string,
  ) {
    return this.svc.listBotLogs({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      level,
      category,
    });
  }
  @Get('bot-logs/filters')
  botLogsFilters() {
    return this.svc.botLogsFilters();
  }
  @Delete('bot-logs/bulk')
  botLogsBulkDelete(@Body() body: { before_date?: string }) {
    return this.svc.bulkDeleteBotLogs(body?.before_date);
  }
  @Delete('bot-logs/:id')
  botLogsDelete(@Param('id') id: string) {
    return this.svc.deleteBotLog(id);
  }
}
