import { Controller, Get, Param, Query } from '@nestjs/common';
import { WalletsService } from './wallets.service';

@Controller('wallets')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  /**
   * GET /wallets/account/:accountId
   * Returns the spot wallet for the given trading account.
   * Optional query param: userId for ownership verification.
   */
  @Get('account/:accountId')
  async getWallet(
    @Param('accountId') accountId: string,
    @Query('userId') userId?: string,
  ) {
    return this.walletsService.getWallet(accountId, userId);
  }
}
