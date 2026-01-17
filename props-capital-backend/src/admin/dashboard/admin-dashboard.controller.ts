import { Controller, Get, UseGuards, Query, HttpStatus, HttpException, Logger } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt.guard';
import { AdminRoleGuard } from '../../auth/admin-role.guard';
import { AdminDashboardService } from './admin-dashboard.service';

/**
 * FIXED Admin Dashboard Controller
 * 
 * KEY FIX: Properly converts query params to numbers (Prisma requires integers, not strings)
 * 
 * Improvements:
 * 1. ✅ Added JwtAuthGuard + AdminRoleGuard on all endpoints
 * 2. ✅ Added comprehensive error handling with try-catch
 * 3. ✅ Added proper query param type conversion (String → Number)
 * 4. ✅ Added pagination support
 * 5. ✅ Added proper logging
 * 6. ✅ Return consistent error responses
 */
@Controller('admin/dashboard')
@UseGuards(JwtAuthGuard, AdminRoleGuard) // 🔒 Secure all admin endpoints
export class AdminDashboardController {
  private readonly logger = new Logger(AdminDashboardController.name);

  constructor(private readonly dashboardService: AdminDashboardService) {}

  /**
   * Get dashboard overview statistics
   * GET /admin/dashboard/overview
   */
  @Get('overview')
  async getOverview() {
    try {
      this.logger.debug('Fetching dashboard overview');
      return await this.dashboardService.getOverview();
    } catch (error) {
      this.logger.error(`Failed to fetch dashboard overview: ${error.message}`, error.stack);
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to fetch dashboard overview',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get recent trading accounts with pagination
   * GET /admin/dashboard/recent-accounts?page=1&limit=10
   */
  @Get('recent-accounts')
  async getRecentAccounts(@Query('page') page?: string, @Query('limit') limit?: string) {
    try {
      // Convert string query params to numbers with defaults
      const pageNum = page ? parseInt(page, 10) : 1;
      const limitNum = limit ? parseInt(limit, 10) : 5;
      
      // Validate converted numbers
      if (isNaN(pageNum) || pageNum < 1) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'Invalid page parameter. Must be a positive integer.',
          },
          HttpStatus.BAD_REQUEST,
        );
      }
      
      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'Invalid limit parameter. Must be between 1 and 100.',
          },
          HttpStatus.BAD_REQUEST,
        );
      }
      
      this.logger.debug(`Fetching recent accounts: page=${pageNum}, limit=${limitNum}`);
      
      return await this.dashboardService.getRecentAccounts(pageNum, limitNum);
    } catch (error) {
      this.logger.error(`Failed to fetch recent accounts: ${error.message}`, error.stack);
      
      // Re-throw if already an HttpException
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to fetch recent accounts',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get recent violations with pagination
   * GET /admin/dashboard/recent-violations?page=1&limit=10
   */
  @Get('recent-violations')
  async getRecentViolations(@Query('page') page?: string, @Query('limit') limit?: string) {
    try {
      // Convert string query params to numbers with defaults
      const pageNum = page ? parseInt(page, 10) : 1;
      const limitNum = limit ? parseInt(limit, 10) : 10;
      
      // Validate converted numbers
      if (isNaN(pageNum) || pageNum < 1) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'Invalid page parameter. Must be a positive integer.',
          },
          HttpStatus.BAD_REQUEST,
        );
      }
      
      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'Invalid limit parameter. Must be between 1 and 100.',
          },
          HttpStatus.BAD_REQUEST,
        );
      }
      
      this.logger.debug(`Fetching recent violations: page=${pageNum}, limit=${limitNum}`);
      
      return await this.dashboardService.getRecentViolations(pageNum, limitNum);
    } catch (error) {
      this.logger.error(`Failed to fetch recent violations: ${error.message}`, error.stack);
      
      // Re-throw if already an HttpException
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to fetch recent violations',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get revenue chart data (last 30 days)
   * GET /admin/dashboard/revenue-chart
   */
  @Get('revenue-chart')
  async getRevenueChart() {
    try {
      this.logger.debug('Fetching revenue chart data');
      return await this.dashboardService.getRevenueChart();
    } catch (error) {
      this.logger.error(`Failed to fetch revenue chart: ${error.message}`, error.stack);
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to fetch revenue chart data',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get registrations chart data
   * GET /admin/dashboard/registrations-chart
   */
  @Get('registrations-chart')
  async getRegistrationsChart() {
    try {
      this.logger.debug('Fetching registrations chart data');
      return await this.dashboardService.getRegistrationsChart();
    } catch (error) {
      this.logger.error(`Failed to fetch registrations chart: ${error.message}`, error.stack);
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to fetch registrations chart data',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}