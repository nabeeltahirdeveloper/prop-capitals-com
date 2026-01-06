import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { EvaluationService } from '../evaluation/evaluation.service';

@Injectable()

export class TradesService {

  constructor(

    private prisma: PrismaService,

    private evaluationService: EvaluationService,

  ) {}

    // Create trade and trigger evaluation engine

  async createTrade(data: any) {

    const { accountId, profit, openPrice, closePrice, volume, symbol, stopLoss, takeProfit } = data;

    const account = await this.prisma.tradingAccount.findUnique({

      where: { id: accountId },

    });

    if (!account) {

      throw new NotFoundException('Trading account not found');

    }

    // Check account status - block trading if locked or disqualified
    if (account.status === ('DAILY_LOCKED' as any)) {
      throw new BadRequestException('Daily loss limit reached. Trading locked until tomorrow.');
    }
    if (account.status === ('DISQUALIFIED' as any)) {
      throw new BadRequestException('Challenge disqualified. Trading is no longer allowed.');
    }
    if (account.status === ('CLOSED' as any) || account.status === ('PAUSED' as any)) {
      throw new BadRequestException('Account is not active for trading.');
    }

    // 1️⃣ Store trade

    const trade = await this.prisma.trade.create({

      data: {

        tradingAccountId: accountId,

        symbol,

        type: data.type || 'BUY',

        volume,

        openPrice,

        closePrice,

        stopLoss: stopLoss ?? null,

        takeProfit: takeProfit ?? null,

        profit: profit || 0,

        openedAt: new Date(),

        closedAt: closePrice ? new Date() : null,

      },

    });

    // 2️⃣ Update balance/equity (simple: balance += profit)

    const newBalance = (account.balance ?? account.initialBalance) + profit;
    const newEquity = newBalance;

    // Update maxEquityToDate if equity increased
    const currentMaxEquity = (account as any).maxEquityToDate ?? account.initialBalance;
    const updateData: any = {
      balance: newBalance,
      equity: newEquity,
    };
    
    if (newEquity > currentMaxEquity) {
      updateData.maxEquityToDate = newEquity;
    }

    await this.prisma.tradingAccount.update({

      where: { id: accountId },

      data: updateData,

    });

    // 3️⃣ Run evaluation engine

    const evaluation = await this.evaluationService.evaluateAccountAfterTrade(

      accountId,

    );

    return {

      trade,

      evaluation,

    };

  }

  async getTradesForAccount(accountId: string) {

    return this.prisma.trade.findMany({

      where: { tradingAccountId: accountId },

      orderBy: { openedAt: 'desc' },

    });

  }

  // Update trade when position is closed or SL/TP is modified
  async updateTrade(tradeId: string, data: any) {
    const { closePrice, profit, stopLoss, takeProfit, closeReason } = data;

    // Get the trade first
    const trade = await this.prisma.trade.findUnique({
      where: { id: tradeId },
      include: { tradingAccount: true },
    });

    if (!trade) {
      throw new NotFoundException('Trade not found');
    }

    const account = trade.tradingAccount;

    // Build update data object
    const updateData: any = {};

    // If closing the trade
    if (closePrice !== undefined) {
      // If trade is already closed, return it idempotently (treat as success)
      // This handles the case where auto-close already closed the trade
      if (trade.closePrice !== null) {
        // Trade is already closed - return the existing trade data in the expected format
        return {
          trade: trade,
          evaluation: null, // No need to re-evaluate if already closed
        };
      }
      updateData.closePrice = closePrice;
      updateData.closedAt = new Date();
      updateData.profit = profit !== undefined ? profit : trade.profit;
    }

    // Allow updating stopLoss and takeProfit for open trades
    if (stopLoss !== undefined) {
      // Only allow SL/TP updates for open trades
      if (trade.closePrice !== null) {
        throw new Error('Cannot modify stopLoss/takeProfit for closed trades');
      }
      updateData.stopLoss = stopLoss ?? null;
    }

    if (takeProfit !== undefined) {
      // Only allow SL/TP updates for open trades
      if (trade.closePrice !== null) {
        throw new Error('Cannot modify stopLoss/takeProfit for closed trades');
      }
      updateData.takeProfit = takeProfit ?? null;
    }

    // If profit is provided without closing, update it
    if (profit !== undefined && closePrice === undefined) {
      updateData.profit = profit;
    }

    // Handle closeReason (e.g., 'USER_CLOSE', 'RISK_AUTO_CLOSE', 'SL_HIT', 'TP_HIT')
    // CRITICAL: Do NOT overwrite breach snapshot fields if they already exist
    if (closeReason !== undefined) {
      // Only set closeReason if it's not already set, or if it's being set to RISK_AUTO_CLOSE
      // This preserves any existing closeReason that might have been set by breach snapshot
      if (!trade.closeReason || closeReason === 'RISK_AUTO_CLOSE') {
        updateData.closeReason = closeReason;
      }
    }

    // CRITICAL: Preserve breach snapshot fields - do NOT overwrite them
    // If breach snapshot was already captured, keep all those fields
    if (trade.breachTriggered) {
      // Don't include breach fields in updateData - they're already set
      // This ensures they're not accidentally overwritten
    }

    // 1️⃣ Update trade
    // NOTE: Breach snapshot fields are preserved - they were set before closing
    const updatedTrade = await this.prisma.trade.update({
      where: { id: tradeId },
      data: updateData,
    });

    // 2️⃣ Update balance/equity only when closing the trade
    if (closePrice !== undefined) {
      const profitToAdd = profit !== undefined ? profit : updatedTrade.profit;
      const newBalance = (account.balance ?? account.initialBalance) + profitToAdd;

    await this.prisma.tradingAccount.update({
      where: { id: account.id },
      data: {
        balance: newBalance,
        equity: newBalance,
      },
    });

      // 3️⃣ Run evaluation engine when trade is closed
    const evaluation = await this.evaluationService.evaluateAccountAfterTrade(
      account.id,
    );

    return {
      trade: updatedTrade,
      evaluation,
      };
    }

    // If only updating SL/TP, return without balance/evaluation updates
    return {
      trade: updatedTrade,
      evaluation: null,
    };
  }

  /**
   * Modify position - update stop loss and/or take profit on open positions
   */
  async modifyPosition(tradeId: string, data: { stopLoss?: number; takeProfit?: number }) {
    const { stopLoss, takeProfit } = data;

    // Get the trade first
    const trade = await this.prisma.trade.findUnique({
      where: { id: tradeId },
    });

    if (!trade) {
      throw new NotFoundException('Trade not found');
    }

    // Only allow modification of open trades
    if (trade.closePrice !== null) {
      throw new BadRequestException('Cannot modify closed positions');
    }

    // Build update data object
    const updateData: any = {};

    if (stopLoss !== undefined) {
      updateData.stopLoss = stopLoss ?? null;
    }

    if (takeProfit !== undefined) {
      updateData.takeProfit = takeProfit ?? null;
    }

    // If no updates provided, return error
    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException('No modification data provided');
    }

    // Update the trade
    const updatedTrade = await this.prisma.trade.update({
      where: { id: tradeId },
      data: updateData,
    });

    return {
      trade: updatedTrade,
    };
  }

}
