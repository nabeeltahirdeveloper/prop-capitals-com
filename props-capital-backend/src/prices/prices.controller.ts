import { Controller, Get, Param, Post } from '@nestjs/common';
import { PricesService, ForexRates, CryptoPrices } from './prices.service';

@Controller('prices')
export class PricesController {
  constructor(private readonly pricesService: PricesService) {}

  /**
   * Get all market prices (forex + crypto)
   * GET /prices
   */
  @Get()
  async getAllPrices() {
    return this.pricesService.getAllPrices();
  }

  /**
   * Get forex rates only
   * GET /prices/forex
   */
  @Get('forex')
  async getForexRates(): Promise<ForexRates> {
    return this.pricesService.getForexRates();
  }

  /**
   * Get crypto prices only
   * GET /prices/crypto
   */
  @Get('crypto')
  async getCryptoPrices(): Promise<CryptoPrices> {
    return this.pricesService.getCryptoPrices();
  }

  /**
   * Get price for a specific symbol
   * GET /prices/symbol/:symbol
   */
  @Get('symbol/:symbol')
  async getSymbolPrice(@Param('symbol') symbol: string) {
    const price = await this.pricesService.getSymbolPrice(symbol);
    return { symbol, price };
  }

  /**
   * Clear cache (admin/testing endpoint)
   * POST /prices/clear-cache
   */
  @Post('clear-cache')
  async clearCache() {
    this.pricesService.clearCache();
    return { message: 'Cache cleared successfully' };
  }
}
