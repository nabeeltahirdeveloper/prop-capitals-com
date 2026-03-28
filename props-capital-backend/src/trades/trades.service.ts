// // import {
// //   Injectable,
// //   NotFoundException,
// //   BadRequestException,
// //   forwardRef,
// //   Inject,
// // } from '@nestjs/common';

// // import { PrismaService } from '../prisma/prisma.service';
// // import { EvaluationService } from '../evaluation/evaluation.service';
// // import { TradingEventsGateway } from '../websocket/trading-events.gateway';

// // interface CreateTradeData {
// //   accountId: string;
// //   profit?: number;
// //   openPrice: number;
// //   closePrice?: number | null;
// //   volume: number;
// //   symbol: string;
// //   stopLoss?: number | null;
// //   takeProfit?: number | null;
// //   positionType?: string;
// //   type?: string;
// //   commission?: number;
// //   leverage?: number;
// // }

// // interface UpdateTradeData {
// //   closePrice?: number;
// //   closedAt?: Date;
// //   profit?: number;
// //   stopLoss?: number | null;
// //   takeProfit?: number | null;
// //   closeReason?: string;
// // }

// // @Injectable()
// // export class TradesService {
// //   constructor(
// //     private prisma: PrismaService,
// //     @Inject(forwardRef(() => EvaluationService))
// //     private evaluationService: EvaluationService,
// //     private tradingEventsGateway: TradingEventsGateway,
// //   ) {}
// //   private static readonly COMMISSION_PER_LOT = 6;
// //   private static readonly COMMISSION_PER_SIDE =
// //     TradesService.COMMISSION_PER_LOT / 2; // 3

// //   private static readonly SPOT_SYMBOLS = [
// //     'BTCUSDT',
// //     'ETHUSDT',
// //     'SOLUSDT',
// //     'XRPUSDT',
// //     'DOGEUSDT',
// //     'BNBUSDT',
// //     'ADAUSDT',
// //     'AVAXUSDT',
// //     'DOTUSDT',
// //     'LINKUSDT',
// //   ];

// //   // Create trade and trigger evaluation engine
// //   async createTrade(data: CreateTradeData) {
// //     const {
// //       accountId,
// //       profit,
// //       openPrice,
// //       closePrice,
// //       volume,
// //       symbol,
// //       stopLoss,
// //       takeProfit,
// //     } = data;
// //     const positionType: string = data.positionType === 'SPOT' ? 'SPOT' : 'CFD';
// //     const account = await this.prisma.tradingAccount.findUnique({
// //       where: { id: accountId },
// //       include: {
// //         challenge: true,
// //         trades: {
// //           select: {
// //             openedAt: true,
// //             closePrice: true,
// //             symbol: true,
// //             volume: true,
// //             openPrice: true,
// //             leverage: true,
// //           },
// //         },
// //       },
// //     });

// //     if (!account) {
// //       throw new NotFoundException('Trading account not found');
// //     }

// //     // Check account status - block trading if locked or disqualified
// //     if (account.status === ('DAILY_LOCKED' as any)) {
// //       throw new BadRequestException(
// //         'Daily loss limit reached. Trading locked until tomorrow.',
// //       );
// //     }
// //     if (account.status === ('DISQUALIFIED' as any)) {
// //       throw new BadRequestException(
// //         'Challenge disqualified. Trading is no longer allowed.',
// //       );
// //     }
// //     if (
// //       account.status === ('CLOSED' as any) ||
// //       account.status === ('PAUSED' as any)
// //     ) {
// //       throw new BadRequestException('Account is not active for trading.');
// //     }

// //     // Spot-specific validation
// //     if (positionType === 'SPOT') {
// //       const sym = String(symbol || '')
// //         .toUpperCase()
// //         .replace('/', '');
// //       if (!TradesService.SPOT_SYMBOLS.includes(sym)) {
// //         throw new BadRequestException(
// //           `Symbol ${symbol} is not available for spot trading.`,
// //         );
// //       }
// //       data.leverage = 1;
// //     }

// //     // Compute effective leverage for this trade (used for margin validation AND stored on the trade)
// //     const requestedLeverage =
// //       positionType === 'SPOT' ? 1 : Number(data.leverage);
// //     const effectiveLeverage =
// //       Number.isFinite(requestedLeverage) && requestedLeverage > 0
// //         ? requestedLeverage
// //         : 100;

// //     // Enforce margin availability to prevent opening unlimited max-size positions.
// //     if (closePrice === undefined || closePrice === null) {
// //       const isNewCrypto =
// //         /BTC|ETH|SOL|XRP|ADA|DOGE|BNB|AVAX|DOT|LINK|USDT/i.test(
// //           String(symbol || ''),
// //         );
// //       const isNewXAU = /XAU/i.test(String(symbol || ''));
// //       const isNewXAG = /XAG/i.test(String(symbol || ''));
// //       const newContractSize = isNewXAU
// //         ? 100
// //         : isNewXAG
// //           ? 5000
// //           : isNewCrypto
// //             ? 1
// //             : 100000;
// //       const requiredMargin =
// //         (Number(volume) * newContractSize * Number(openPrice)) /
// //         effectiveLeverage;

// //       const usedMargin = (account.trades || [])
// //         .filter((t) => t.closePrice === null)
// //         .reduce((sum: number, t) => {
// //           const isCrypto =
// //             /BTC|ETH|SOL|XRP|ADA|DOGE|BNB|AVAX|DOT|LINK|USDT/i.test(
// //               String(t.symbol || ''),
// //             );
// //           const isXAU = /XAU/i.test(String(t.symbol || ''));
// //           const isXAG = /XAG/i.test(String(t.symbol || ''));
// //           const contractSize = isXAU
// //             ? 100
// //             : isXAG
// //               ? 5000
// //               : isCrypto
// //                 ? 1
// //                 : 100000;
// //           const tradeLeverage =
// //             Number((t as any).leverage) > 0 ? Number((t as any).leverage) : 100;
// //           return (
// //             sum +
// //             (Number(t.volume) * contractSize * Number(t.openPrice)) /
// //               tradeLeverage
// //           );
// //         }, 0);

// //       const currentBalance = Number(
// //         account.balance ?? account.initialBalance ?? 0,
// //       );
// //       const availableMargin = Math.max(0, currentBalance - usedMargin);
// //       if (!Number.isFinite(requiredMargin) || requiredMargin <= 0) {
// //         throw new BadRequestException(
// //           'Invalid margin requirements for requested trade.',
// //         );
// //       }
// //       if (requiredMargin > availableMargin) {
// //         throw new BadRequestException(
// //           `Insufficient margin. Required ${requiredMargin.toFixed(2)}, available ${availableMargin.toFixed(2)}.`,
// //         );
// //       }
// //     }

// //     const openCommission =
// //       positionType === 'SPOT'
// //         ? 0
// //         : Number(volume || 0) * TradesService.COMMISSION_PER_SIDE;
// //     // const closeCommission = positionType === 'SPOT' ? 0 : (closePrice ? TradesService.COMMISSION_PER_SIDE : 0);
// //     // const totalCommission = openCommission + closeCommission;

// //     // 1️⃣ Store trade
// //     const trade = await this.prisma.trade.create({
// //       data: {
// //         tradingAccountId: accountId,
// //         symbol,
// //         type: (data.type || 'BUY') as 'BUY' | 'SELL',
// //         volume,
// //         openPrice,
// //         closePrice: closePrice ?? null,
// //         stopLoss: stopLoss ?? null,
// //         takeProfit: takeProfit ?? null,
// //         profit: profit || 0,
// //         commission: openCommission,
// //         openedAt: new Date(),
// //         closedAt: closePrice ? new Date() : null,
// //         positionType,
// //         leverage: effectiveLeverage,
// //       },
// //     });

// //     // 2️⃣ Update balance/equity (simple: balance += profit)
// //     // When opening a trade, profit is undefined/0 — balance stays the same
// //     const effectiveProfit = profit || 0;
// //     const newBalance =
// //       (account.balance ?? account.initialBalance) +
// //       effectiveProfit -
// //       openCommission;
// //     const newEquity = newBalance;

// //     // Update maxEquityToDate if equity increased
// //     const currentMaxEquity = account.maxEquityToDate ?? account.initialBalance;
// //     const updateData: Partial<{
// //       balance: number;
// //       equity: number;
// //       maxEquityToDate: number;
// //     }> = {
// //       balance: newBalance,
// //       equity: newEquity,
// //     };

// //     if (newEquity > currentMaxEquity) {
// //       updateData.maxEquityToDate = newEquity;
// //     }

// //     await this.prisma.tradingAccount.update({
// //       where: { id: accountId },
// //       data: updateData,
// //     });

// //     // 3️⃣ Run evaluation engine
// //     const evaluation =
// //       await this.evaluationService.evaluateAccountAfterTrade(accountId);

// //     // 🔥 4️⃣ Calculate trading days metrics for real-time update
// //     const allTrades = [...account.trades, { openedAt: trade.openedAt }]; // Include the new trade
// //     const tradingDaysCompleted = new Set(
// //       allTrades
// //         .filter((t) => t.openedAt)
// //         .map((t) => t.openedAt.toISOString().substring(0, 10)),
// //     ).size;

// //     // Check if traded today
// //     const today = new Date().toISOString().substring(0, 10);
// //     const tradedToday = allTrades.some(
// //       (t) => t.openedAt && t.openedAt.toISOString().substring(0, 10) === today,
// //     );

// //     // Calculate days remaining
// //     const daysRemaining = Math.max(
// //       0,
// //       account.challenge.minTradingDays - tradingDaysCompleted,
// //     );

// //     // Calculate profit percent for real-time display
// //     const initialBalance =
// //       account.initialBalance || account.challenge.accountSize || 0;
// //     const profitPercent =
// //       initialBalance > 0
// //         ? ((newEquity - initialBalance) / initialBalance) * 100
// //         : 0;

// //     // 🔥 5️⃣ Emit real-time account update via WebSocket
// //     this.tradingEventsGateway.emitAccountUpdate(accountId, {
// //       tradingDaysCount: tradingDaysCompleted,
// //       tradedToday,
// //       daysRemaining,
// //       balance: newBalance,
// //       equity: newEquity,
// //       profitPercent,
// //       lastTradeId: trade.id,
// //       timestamp: new Date().toISOString(),
// //     });

// //     // 🔥 6️⃣ Also emit trade executed event
// //     this.tradingEventsGateway.emitTradeExecuted(accountId, {
// //       tradeId: trade.id,
// //       symbol: trade.symbol,
// //       type: trade.type,
// //       volume: trade.volume,
// //       openPrice: trade.openPrice,
// //       timestamp: new Date().toISOString(),
// //     });

// //     return {
// //       trade,
// //       evaluation,
// //     };
// //   }

// //   async getTradesForAccount(accountId: string) {
// //     return this.prisma.trade.findMany({
// //       where: { tradingAccountId: accountId },
// //       orderBy: { openedAt: 'desc' },
// //     });
// //   }

// //   // Update trade when position is closed or SL/TP is modified
// //   async updateTrade(tradeId: string, data: UpdateTradeData) {
// //     const { closePrice, profit, stopLoss, takeProfit, closeReason } = data;

// //     // Get the trade first
// //     // const trade = await this.prisma.trade.findUnique({
// //     //   where: { id: tradeId },
// //     //   include: { tradingAccount: true },
// //     // });
// //     const trade = await this.prisma.trade.findUnique({
// //       where: { id: tradeId },
// //       select: {
// //         id: true,
// //         symbol: true,
// //         type: true,
// //         volume: true,
// //         openPrice: true,
// //         closePrice: true,
// //         positionType: true,
// //         commission: true, // ✅ THIS FIXES trade.commission red line
// //         closeReason: true,
// //         tradingAccount: true,
// //       },
// //     });

// //     if (!trade) {
// //       throw new NotFoundException('Trade not found');
// //     }

// //     const account = trade.tradingAccount;

// //     // Build update data object
// //     const updateData: Partial<{
// //       closePrice: number;
// //       closedAt: Date;
// //       profit: number;
// //       stopLoss: number | null;
// //       takeProfit: number | null;
// //       commission: number;
// //       closeReason: string;
// //     }> = {};

// //     // If closing the trade
// //     // if (closePrice !== undefined) {
// //     //   // If trade is already closed, return it idempotently (treat as success)
// //     //   // This handles the case where auto-close already closed the trade
// //     //   if (trade.closePrice !== null) {
// //     //     // Trade is already closed - return the existing trade data in the expected format
// //     //     return {
// //     //       trade: trade,
// //     //       evaluation: null, // No need to re-evaluate if already closed
// //     //     };
// //     //   }
// //     //   updateData.closePrice = closePrice;
// //     //   updateData.closedAt = new Date();
// //     //   if (profit !== undefined) {
// //     //     updateData.profit = profit;
// //     //   } else {
// //     //     const symbolUpper = String(trade.symbol || '').toUpperCase();
// //     //     const isCrypto =
// //     //       symbolUpper.includes('BTC') ||
// //     //       symbolUpper.includes('ETH') ||
// //     //       symbolUpper.includes('SOL') ||
// //     //       symbolUpper.includes('XRP') ||
// //     //       symbolUpper.includes('ADA') ||
// //     //       symbolUpper.includes('DOGE') ||
// //     //       symbolUpper.includes('BNB') ||
// //     //       symbolUpper.includes('AVAX') ||
// //     //       symbolUpper.includes('DOT') ||
// //     //       symbolUpper.includes('LINK');
// //     //     const isXAU = symbolUpper.includes('XAU');
// //     //     const isXAG = symbolUpper.includes('XAG');
// //     //     const contractSize = isXAU ? 100 : isXAG ? 5000 : isCrypto ? 1 : 100000;
// //     //     const priceDiff =
// //     //       trade.type === 'BUY'
// //     //         ? closePrice - trade.openPrice
// //     //         : trade.openPrice - closePrice;
// //     //     updateData.profit = priceDiff * (trade.volume || 0) * contractSize;
// //     //   }
// //     // }
// //     if (closePrice !== undefined) {
// //       if (trade.closePrice !== null) {
// //         return { trade, evaluation: null };
// //       }

// //       updateData.closePrice = closePrice;
// //       updateData.closedAt = new Date();

// //       // Profit calc (existing)
// //       if (profit !== undefined) {
// //         updateData.profit = profit;
// //       } else {
// //         const symbolUpper = String(trade.symbol || '').toUpperCase();
// //         const isCrypto =
// //           symbolUpper.includes('BTC') ||
// //           symbolUpper.includes('ETH') ||
// //           symbolUpper.includes('SOL') ||
// //           symbolUpper.includes('XRP') ||
// //           symbolUpper.includes('ADA') ||
// //           symbolUpper.includes('DOGE') ||
// //           symbolUpper.includes('BNB') ||
// //           symbolUpper.includes('AVAX') ||
// //           symbolUpper.includes('DOT') ||
// //           symbolUpper.includes('LINK');
// //         const isXAU = symbolUpper.includes('XAU');
// //         const isXAG = symbolUpper.includes('XAG');
// //         const contractSize = isXAU ? 100 : isXAG ? 5000 : isCrypto ? 1 : 100000;

// //         const priceDiff =
// //           trade.type === 'BUY'
// //             ? closePrice - trade.openPrice
// //             : trade.openPrice - closePrice;

// //         updateData.profit = priceDiff * (trade.volume || 0) * contractSize;
// //       }

// //       // ✅ CLOSE commission (3/lot) + cumulative store
// //       const closeCommission =
// //         trade.positionType === 'SPOT'
// //           ? 0
// //           : Number(trade.volume || 0) * TradesService.COMMISSION_PER_SIDE;

// //       updateData.commission = (trade.commission ?? 0) + closeCommission;
// //     }
// //     // Allow updating stopLoss and takeProfit for open trades
// //     if (stopLoss !== undefined) {
// //       // Only allow SL/TP updates for open trades
// //       if (trade.closePrice !== null) {
// //         throw new Error('Cannot modify stopLoss/takeProfit for closed trades');
// //       }
// //       updateData.stopLoss = stopLoss ?? null;
// //     }

// //     if (takeProfit !== undefined) {
// //       // Only allow SL/TP updates for open trades
// //       if (trade.closePrice !== null) {
// //         throw new Error('Cannot modify stopLoss/takeProfit for closed trades');
// //       }
// //       updateData.takeProfit = takeProfit ?? null;
// //     }

// //     // If profit is provided without closing, update it
// //     if (profit !== undefined && closePrice === undefined) {
// //       updateData.profit = profit;
// //     }

// //     // Handle closeReason (e.g., 'USER_CLOSE', 'RISK_AUTO_CLOSE', 'SL_HIT', 'TP_HIT')
// //     // CRITICAL: Do NOT overwrite breach snapshot fields if they already exist
// //     if (closeReason !== undefined) {
// //       // Only set closeReason if it's not already set, or if it's being set to RISK_AUTO_CLOSE
// //       // This preserves any existing closeReason that might have been set by breach snapshot
// //       if (!trade.closeReason || closeReason === 'RISK_AUTO_CLOSE') {
// //         updateData.closeReason = closeReason;
// //       }
// //     }

// //     // CRITICAL: Preserve breach snapshot fields - do NOT overwrite them
// //     // If breachTriggered is set, breach fields were already captured and we skip adding them

// //     // 1️⃣ Update trade
// //     // NOTE: Breach snapshot fields are preserved - they were set before closing
// //     const updatedTrade = await this.prisma.trade.update({
// //       where: { id: tradeId },
// //       data: updateData,
// //     });

// //     // 2️⃣ Update balance/equity only when closing the trade
// //     if (closePrice !== undefined) {
// //       const grossProfit = updatedTrade.profit ?? 0;

// //       // same closeCommission calc (or reuse by recalculating)
// //       const closeCommission =
// //         trade.positionType === 'SPOT'
// //           ? 0
// //           : Number(trade.volume || 0) * TradesService.COMMISSION_PER_SIDE;

// //       const newBalance =
// //         (account.balance ?? account.initialBalance) +
// //         grossProfit -
// //         closeCommission;

// //       const nextEquity = newBalance;

// //       const accountUpdateData: Partial<{
// //         balance: number;
// //         equity: number;
// //         maxEquityToDate: number;
// //         todayStartEquity: number;
// //         minEquityToday: number;
// //         lastDailyReset: Date;
// //         minEquityOverall: number;
// //       }> = {
// //         balance: newBalance,
// //         equity: nextEquity,
// //       };

// //       const initialBalance = account.initialBalance ?? newBalance;
// //       const currentMaxEquity = account.maxEquityToDate ?? initialBalance;
// //       if (nextEquity > currentMaxEquity) {
// //         accountUpdateData.maxEquityToDate = nextEquity;
// //       }

// //       const today = new Date().toISOString().substring(0, 10);
// //       const lastReset = account.lastDailyReset;
// //       const lastResetDate = lastReset
// //         ? new Date(lastReset).toISOString().substring(0, 10)
// //         : null;

// //       if (lastResetDate !== today) {
// //         // New day baseline initialization for drawdown tracking.
// //         accountUpdateData.todayStartEquity = nextEquity;
// //         accountUpdateData.minEquityToday = nextEquity;
// //         accountUpdateData.lastDailyReset = new Date();
// //       } else {
// //         const currentMinToday = account.minEquityToday ?? nextEquity;
// //         if (nextEquity < currentMinToday) {
// //           accountUpdateData.minEquityToday = nextEquity;
// //         }
// //       }

// //       const currentMinOverall = account.minEquityOverall ?? initialBalance;
// //       if (nextEquity < currentMinOverall) {
// //         accountUpdateData.minEquityOverall = nextEquity;
// //       }

// //       await this.prisma.tradingAccount.update({
// //         where: { id: account.id },
// //         data: accountUpdateData,
// //       });

// //       // 3️⃣ Run evaluation engine when trade is closed
// //       const evaluation = await this.evaluationService.evaluateAccountAfterTrade(
// //         account.id,
// //       );

// //       return {
// //         trade: updatedTrade,
// //         evaluation,
// //       };
// //     }

// //     // If only updating SL/TP, return without balance/evaluation updates
// //     return {
// //       trade: updatedTrade,
// //       evaluation: null,
// //     };
// //   }

// //   /**
// //    * Modify position - update stop loss and/or take profit on open positions
// //    */
// //   async modifyPosition(
// //     tradeId: string,
// //     data: { stopLoss?: number; takeProfit?: number },
// //   ) {
// //     const { stopLoss, takeProfit } = data;

// //     // Get the trade first
// //     const trade = await this.prisma.trade.findUnique({
// //       where: { id: tradeId },
// //     });

// //     if (!trade) {
// //       throw new NotFoundException('Trade not found');
// //     }

// //     // Only allow modification of open trades
// //     if (trade.closePrice !== null) {
// //       throw new BadRequestException('Cannot modify closed positions');
// //     }

// //     // Build update data object
// //     const updateData: Partial<{
// //       stopLoss: number | null;
// //       takeProfit: number | null;
// //     }> = {};

// //     if (stopLoss !== undefined) {
// //       updateData.stopLoss = stopLoss ?? null;
// //     }

// //     if (takeProfit !== undefined) {
// //       updateData.takeProfit = takeProfit ?? null;
// //     }

// //     // If no updates provided, return error
// //     if (Object.keys(updateData).length === 0) {
// //       throw new BadRequestException('No modification data provided');
// //     }

// //     // Update the trade
// //     const updatedTrade = await this.prisma.trade.update({
// //       where: { id: tradeId },
// //       data: updateData,
// //     });

// //     return {
// //       trade: updatedTrade,
// //     };
// //   }
// // }



// import {
//   Injectable,
//   NotFoundException,
//   BadRequestException,
//   forwardRef,
//   Inject,
// } from '@nestjs/common';

// import { PrismaService } from '../prisma/prisma.service';
// import { EvaluationService } from '../evaluation/evaluation.service';
// import { TradingEventsGateway } from '../websocket/trading-events.gateway';
// import { MarketDataService } from '../market-data/market-data.service';

// interface CreateTradeData {
//   accountId: string;
//   profit?: number;
//   openPrice: number;
//   closePrice?: number | null;
//   volume: number;
//   symbol: string;
//   stopLoss?: number | null;
//   takeProfit?: number | null;
//   positionType?: string;
//   type?: string;
//   leverage?: number;
// }

// interface UpdateTradeData {
//   closePrice?: number;
//   closedAt?: Date;
//   profit?: number;
//   stopLoss?: number | null;
//   takeProfit?: number | null;
//   closeReason?: string;
// }

// @Injectable()
// export class TradesService {
//   constructor(
//     private prisma: PrismaService,
//     @Inject(forwardRef(() => EvaluationService))
//     private evaluationService: EvaluationService,
//     private tradingEventsGateway: TradingEventsGateway,
//     private marketDataService: MarketDataService,
//   ) {}

//   private static readonly SPOT_SYMBOLS = [
//     'BTCUSDT',
//     'ETHUSDT',
//     'SOLUSDT',
//     'XRPUSDT',
//     'DOGEUSDT',
//     'BNBUSDT',
//     'ADAUSDT',
//     'AVAXUSDT',
//     'DOTUSDT',
//     'LINKUSDT',
//   ];

//   // Create trade and trigger evaluation engine
//   async createTrade(data: CreateTradeData) {
//     const {
//       accountId,
//       profit,
//       openPrice,
//       closePrice,
//       volume,
//       symbol,
//       stopLoss,
//       takeProfit,
//     } = data;
//     const positionType: string = data.positionType === 'SPOT' ? 'SPOT' : 'CFD';
//     const account = await this.prisma.tradingAccount.findUnique({
//       where: { id: accountId },
//       include: {
//         challenge: true,
//         trades: {
//           select: {
//             openedAt: true,
//             closePrice: true,
//             symbol: true,
//             volume: true,
//             openPrice: true,
//             leverage: true,
//           },
//         },
//       },
//     });

//     if (!account) {
//       throw new NotFoundException('Trading account not found');
//     }

//     // Check account status - block trading if locked or disqualified
//     if (account.status === ('DAILY_LOCKED' as any)) {
//       throw new BadRequestException(
//         'Daily loss limit reached. Trading locked until tomorrow.',
//       );
//     }
//     if (account.status === ('DISQUALIFIED' as any)) {
//       throw new BadRequestException(
//         'Challenge disqualified. Trading is no longer allowed.',
//       );
//     }
//     if (
//       account.status === ('CLOSED' as any) ||
//       account.status === ('PAUSED' as any)
//     ) {
//       throw new BadRequestException('Account is not active for trading.');
//     }

//     // Spot-specific validation
//     if (positionType === 'SPOT') {
//       const sym = String(symbol || '')
//         .toUpperCase()
//         .replace('/', '');
//       if (!TradesService.SPOT_SYMBOLS.includes(sym)) {
//         throw new BadRequestException(
//           `Symbol ${symbol} is not available for spot trading.`,
//         );
//       }
//       data.leverage = 1;
//     }

//     // Compute effective leverage for this trade (used for margin validation AND stored on the trade)
//     const requestedLeverage =
//       positionType === 'SPOT' ? 1 : Number(data.leverage);
//     const effectiveLeverage =
//       Number.isFinite(requestedLeverage) && requestedLeverage > 0
//         ? requestedLeverage
//         : 100;

//     // Enforce margin availability to prevent opening unlimited max-size positions.
//     if (closePrice === undefined || closePrice === null) {
//       const isNewCrypto =
//         /BTC|ETH|SOL|XRP|ADA|DOGE|BNB|AVAX|DOT|LINK|USDT/i.test(
//           String(symbol || ''),
//         );
//       const isNewXAU = /XAU/i.test(String(symbol || ''));
//       const isNewXAG = /XAG/i.test(String(symbol || ''));
//       const newContractSize = isNewXAU
//         ? 100
//         : isNewXAG
//           ? 5000
//           : isNewCrypto
//             ? 1
//             : 100000;
//       const requiredMargin =
//         (Number(volume) * newContractSize * Number(openPrice)) /
//         effectiveLeverage;

//       const usedMargin = (account.trades || [])
//         .filter((t) => t.closePrice === null)
//         .reduce((sum: number, t) => {
//           const isCrypto =
//             /BTC|ETH|SOL|XRP|ADA|DOGE|BNB|AVAX|DOT|LINK|USDT/i.test(
//               String(t.symbol || ''),
//             );
//           const isXAU = /XAU/i.test(String(t.symbol || ''));
//           const isXAG = /XAG/i.test(String(t.symbol || ''));
//           const contractSize = isXAU
//             ? 100
//             : isXAG
//               ? 5000
//               : isCrypto
//                 ? 1
//                 : 100000;
//           const tradeLeverage = Number((t as any).leverage) > 0 ? Number((t as any).leverage) : 100;
//           return (
//             sum + (Number(t.volume) * contractSize * Number(t.openPrice)) / tradeLeverage
//           );
//         }, 0);

//       const currentBalance = Number(
//         account.balance ?? account.initialBalance ?? 0,
//       );
//       const availableMargin = Math.max(0, currentBalance - usedMargin);
//       if (!Number.isFinite(requiredMargin) || requiredMargin <= 0) {
//         throw new BadRequestException(
//           'Invalid margin requirements for requested trade.',
//         );
//       }
//       if (requiredMargin > availableMargin) {
//         throw new BadRequestException(
//           `Insufficient margin. Required ${requiredMargin.toFixed(2)}, available ${availableMargin.toFixed(2)}.`,
//         );
//       }
//     }

//     // 1️⃣ Store trade
//     const trade = await this.prisma.trade.create({
//       data: {
//         tradingAccountId: accountId,
//         symbol,
//         type: (data.type || 'BUY') as 'BUY' | 'SELL',
//         volume,
//         openPrice,
//         closePrice: closePrice ?? null,
//         stopLoss: stopLoss ?? null,
//         takeProfit: takeProfit ?? null,
//         profit: profit || 0,
//         openedAt: new Date(),
//         closedAt: closePrice ? new Date() : null,
//         positionType,
//         leverage: effectiveLeverage,
//       },
//     });

//     // 2️⃣ Update balance/equity (simple: balance += profit)
//     // When opening a trade, profit is undefined/0 — balance stays the same
//     const effectiveProfit = profit || 0;
//     const newBalance =
//       (account.balance ?? account.initialBalance) + effectiveProfit;
//     const newEquity = newBalance;

//     // Update maxEquityToDate if equity increased
//     const currentMaxEquity = account.maxEquityToDate ?? account.initialBalance;
//     const updateData: Partial<{
//       balance: number;
//       equity: number;
//       maxEquityToDate: number;
//     }> = {
//       balance: newBalance,
//       equity: newEquity,
//     };

//     if (newEquity > currentMaxEquity) {
//       updateData.maxEquityToDate = newEquity;
//     }

//     await this.prisma.tradingAccount.update({
//       where: { id: accountId },
//       data: updateData,
//     });

//     // 3️⃣ Run evaluation engine
//     const evaluation =
//       await this.evaluationService.evaluateAccountAfterTrade(accountId);

//     // 🔥 4️⃣ Calculate trading days metrics for real-time update
//     const allTrades = [...account.trades, { openedAt: trade.openedAt }]; // Include the new trade
//     const tradingDaysCompleted = new Set(
//       allTrades
//         .filter((t) => t.openedAt)
//         .map((t) => t.openedAt.toISOString().substring(0, 10)),
//     ).size;

//     // Check if traded today
//     const today = new Date().toISOString().substring(0, 10);
//     const tradedToday = allTrades.some(
//       (t) => t.openedAt && t.openedAt.toISOString().substring(0, 10) === today,
//     );

//     // Calculate days remaining
//     const daysRemaining = Math.max(
//       0,
//       account.challenge.minTradingDays - tradingDaysCompleted,
//     );

//     // Calculate profit percent for real-time display
//     const initialBalance =
//       account.initialBalance || account.challenge.accountSize || 0;
//     const profitPercent =
//       initialBalance > 0
//         ? ((newEquity - initialBalance) / initialBalance) * 100
//         : 0;

//     // 🔥 5️⃣ Emit real-time account update via WebSocket
//     this.tradingEventsGateway.emitAccountUpdate(accountId, {
//       tradingDaysCount: tradingDaysCompleted,
//       tradedToday,
//       daysRemaining,
//       balance: newBalance,
//       equity: newEquity,
//       profitPercent,
//       lastTradeId: trade.id,
//       timestamp: new Date().toISOString(),
//     });

//     // 🔥 6️⃣ Also emit trade executed event
//     this.tradingEventsGateway.emitTradeExecuted(accountId, {
//       tradeId: trade.id,
//       symbol: trade.symbol,
//       type: trade.type,
//       volume: trade.volume,
//       openPrice: trade.openPrice,
//       timestamp: new Date().toISOString(),
//     });

//     return {
//       trade,
//       evaluation,
//     };
//   }

//   async getTradesForAccount(accountId: string) {
//     return this.prisma.trade.findMany({
//       where: { tradingAccountId: accountId },
//       orderBy: { openedAt: 'desc' },
//     });
//   }

//   // Update trade when position is closed or SL/TP is modified
//   async updateTrade(tradeId: string, data: UpdateTradeData) {
//     const { closePrice, profit, stopLoss, takeProfit, closeReason } = data;

//     // Get the trade first
//     const trade = await this.prisma.trade.findUnique({
//       where: { id: tradeId },
//       include: { tradingAccount: true },
//     });

//     if (!trade) {
//       throw new NotFoundException('Trade not found');
//     }

//     const account = trade.tradingAccount;

//     // Build update data object
//     const updateData: Partial<{
//       closePrice: number;
//       closedAt: Date;
//       profit: number;
//       stopLoss: number | null;
//       takeProfit: number | null;
//       closeReason: string;
//     }> = {};

//     // If closing the trade
//     if (closePrice !== undefined) {
//       // If trade is already closed, return it idempotently (treat as success)
//       // This handles the case where auto-close already closed the trade
//       if (trade.closePrice !== null) {
//         // Trade is already closed - return the existing trade data in the expected format
//         return {
//           trade: trade,
//           evaluation: null, // No need to re-evaluate if already closed
//         };
//       }
//       updateData.closePrice = closePrice;
//       updateData.closedAt = new Date();
//       if (profit !== undefined) {
//         updateData.profit = profit;
//       } else {
//         const symbolUpper = String(trade.symbol || '').toUpperCase();
//         const isCrypto =
//           symbolUpper.includes('BTC') ||
//           symbolUpper.includes('ETH') ||
//           symbolUpper.includes('SOL') ||
//           symbolUpper.includes('XRP') ||
//           symbolUpper.includes('ADA') ||
//           symbolUpper.includes('DOGE') ||
//           symbolUpper.includes('BNB') ||
//           symbolUpper.includes('AVAX') ||
//           symbolUpper.includes('DOT') ||
//           symbolUpper.includes('LINK');
//         const isXAU = symbolUpper.includes('XAU');
//         const isXAG = symbolUpper.includes('XAG');
//         const contractSize = isXAU ? 100 : isXAG ? 5000 : isCrypto ? 1 : 100000;
//         const priceDiff =
//           trade.type === 'BUY'
//             ? closePrice - trade.openPrice
//             : trade.openPrice - closePrice;
//         updateData.profit = priceDiff * (trade.volume || 0) * contractSize;
//       }
//     }

//     // Allow updating stopLoss and takeProfit for open trades
//     if (stopLoss !== undefined) {
//       // Only allow SL/TP updates for open trades
//       if (trade.closePrice !== null) {
//         throw new Error('Cannot modify stopLoss/takeProfit for closed trades');
//       }
//       updateData.stopLoss = stopLoss ?? null;
//     }

//     if (takeProfit !== undefined) {
//       // Only allow SL/TP updates for open trades
//       if (trade.closePrice !== null) {
//         throw new Error('Cannot modify stopLoss/takeProfit for closed trades');
//       }
//       updateData.takeProfit = takeProfit ?? null;
//     }

//     // If profit is provided without closing, update it
//     if (profit !== undefined && closePrice === undefined) {
//       updateData.profit = profit;
//     }

//     // Handle closeReason (e.g., 'USER_CLOSE', 'RISK_AUTO_CLOSE', 'SL_HIT', 'TP_HIT')
//     // CRITICAL: Do NOT overwrite breach snapshot fields if they already exist
//     if (closeReason !== undefined) {
//       // Only set closeReason if it's not already set, or if it's being set to RISK_AUTO_CLOSE
//       // This preserves any existing closeReason that might have been set by breach snapshot
//       if (!trade.closeReason || closeReason === 'RISK_AUTO_CLOSE') {
//         updateData.closeReason = closeReason;
//       }
//     }

//     // CRITICAL: Preserve breach snapshot fields - do NOT overwrite them
//     // If breachTriggered is set, breach fields were already captured and we skip adding them

//     // 1️⃣ Update trade
//     // NOTE: Breach snapshot fields are preserved - they were set before closing
//     const updatedTrade = await this.prisma.trade.update({
//       where: { id: tradeId },
//       data: updateData,
//     });

//     // 2️⃣ Update balance/equity only when closing the trade
//     if (closePrice !== undefined) {
//       const profitToAdd = updatedTrade.profit ?? 0;
//       const previousBalance = account.balance ?? account.initialBalance;
//       const newBalance = previousBalance + profitToAdd;

//       const nextEquity = newBalance;

//       const accountUpdateData: Partial<{
//         balance: number;
//         equity: number;
//         maxEquityToDate: number;
//         todayStartEquity: number;
//         minEquityToday: number;
//         lastDailyReset: Date;
//         minEquityOverall: number;
//       }> = {
//         balance: newBalance,
//         equity: nextEquity,
//       };

//       const initialBalance = account.initialBalance ?? newBalance;
//       const currentMaxEquity = account.maxEquityToDate ?? initialBalance;
//       if (nextEquity > currentMaxEquity) {
//         accountUpdateData.maxEquityToDate = nextEquity;
//       }

//       const today = new Date().toISOString().substring(0, 10);
//       const lastReset = account.lastDailyReset;
//       const lastResetDate = lastReset
//         ? new Date(lastReset).toISOString().substring(0, 10)
//         : null;

//       if (lastResetDate !== today) {
//         // New day baseline initialization for drawdown tracking.
//         accountUpdateData.todayStartEquity = nextEquity;
//         accountUpdateData.minEquityToday = nextEquity;
//         accountUpdateData.lastDailyReset = new Date();
//       } else {
//         const currentMinToday = account.minEquityToday ?? nextEquity;
//         if (nextEquity < currentMinToday) {
//           accountUpdateData.minEquityToday = nextEquity;
//         }
//       }

//       const currentMinOverall = account.minEquityOverall ?? initialBalance;
//       if (nextEquity < currentMinOverall) {
//         accountUpdateData.minEquityOverall = nextEquity;
//       }

//       await this.prisma.tradingAccount.update({
//         where: { id: account.id },
//         data: accountUpdateData,
//       });

//       // 3️⃣ Run evaluation engine when trade is closed
//       const evaluation = await this.evaluationService.evaluateAccountAfterTrade(
//         account.id,
//       );

//       return {
//         trade: updatedTrade,
//         evaluation,
//       };
//     }

//     // If only updating SL/TP, return without balance/evaluation updates
//     return {
//       trade: updatedTrade,
//       evaluation: null,
//     };
//   }

//   /**
//    * Modify position - update stop loss and/or take profit on open positions
//    */
//   async modifyPosition(
//     tradeId: string,
//     data: { stopLoss?: number; takeProfit?: number },
//   ) {
//     const { stopLoss, takeProfit } = data;

//     // Get the trade first
//     const trade = await this.prisma.trade.findUnique({
//       where: { id: tradeId },
//     });

//     if (!trade) {
//       throw new NotFoundException('Trade not found');
//     }

//     // Only allow modification of open trades
//     if (trade.closePrice !== null) {
//       throw new BadRequestException('Cannot modify closed positions');
//     }

//     // ── Server-side price validation ─────────────────────────────────────────
//     // Fetch current market prices to ensure submitted TP/SL won't trigger
//     // immediately. This guards against the race window between UI submission
//     // and the per-second TP/SL monitor.
//     if (stopLoss != null || takeProfit != null) {
//       try {
//         const pricesData = await this.marketDataService.getUnifiedPrices([trade.symbol]);
//         const prices = pricesData?.find?.(
//           (p: any) => p?.symbol?.toUpperCase() === trade.symbol?.toUpperCase(),
//         );

//         if (prices && prices.bid > 0 && prices.ask > 0) {
//           // BUY closes at BID; SELL closes at ASK — use the same side as the monitor
//           const exitPrice: number =
//             trade.type === 'BUY' ? Number(prices.bid) : Number(prices.ask);

//           // Minimum safe distance: 5 pips for JPY pairs, 2 pips for others.
//           // Prevents TP/SL sitting right on current price and triggering in the next tick.
//           const isJpy = trade.symbol.toUpperCase().includes('JPY');
//           const isXau = trade.symbol.toUpperCase().includes('XAU');
//           const minPips = isXau ? 0.5 : isJpy ? 0.05 : 0.0002; // 2 pips min distance

//           if (stopLoss != null) {
//             const sl = Number(stopLoss);
//             if (trade.type === 'BUY' && sl >= exitPrice - minPips) {
//               throw new BadRequestException(
//                 `Stop Loss (${sl}) must be at least ${minPips} below current bid (${exitPrice}) for BUY`,
//               );
//             }
//             if (trade.type === 'SELL' && sl <= exitPrice + minPips) {
//               throw new BadRequestException(
//                 `Stop Loss (${sl}) must be at least ${minPips} above current ask (${exitPrice}) for SELL`,
//               );
//             }
//           }

//           if (takeProfit != null) {
//             const tp = Number(takeProfit);
//             if (trade.type === 'BUY' && tp <= exitPrice + minPips) {
//               throw new BadRequestException(
//                 `Take Profit (${tp}) must be at least ${minPips} above current bid (${exitPrice}) for BUY`,
//               );
//             }
//             if (trade.type === 'SELL' && tp >= exitPrice - minPips) {
//               throw new BadRequestException(
//                 `Take Profit (${tp}) must be at least ${minPips} below current ask (${exitPrice}) for SELL`,
//               );
//             }
//           }
//         }
//       } catch (e) {
//         // Re-throw validation errors; swallow price-fetch errors so modify still proceeds
//         if (e instanceof BadRequestException) throw e;
//       }
//     }

//     // Build update data object
//     const updateData: Partial<{
//       stopLoss: number | null;
//       takeProfit: number | null;
//     }> = {};

//     if (stopLoss !== undefined) {
//       updateData.stopLoss = stopLoss ?? null;
//     }

//     if (takeProfit !== undefined) {
//       updateData.takeProfit = takeProfit ?? null;
//     }

//     // If no updates provided, return error
//     if (Object.keys(updateData).length === 0) {
//       throw new BadRequestException('No modification data provided');
//     }

//     // Update the trade
//     const updatedTrade = await this.prisma.trade.update({
//       where: { id: tradeId },
//       data: updateData,
//     });

//     return {
//       trade: updatedTrade,
//     };
//   }
// }




import {
  Injectable,
  NotFoundException,
  BadRequestException,
  forwardRef,
  Inject,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { EvaluationService } from '../evaluation/evaluation.service';
import { TradingEventsGateway } from '../websocket/trading-events.gateway';
import { MarketDataService } from '../market-data/market-data.service';

interface CreateTradeData {
  accountId: string;
  profit?: number;
  openPrice: number;
  closePrice?: number | null;
  volume: number;
  symbol: string;
  stopLoss?: number | null;
  takeProfit?: number | null;
  positionType?: string;
  type?: string;
  leverage?: number;
}

interface UpdateTradeData {
  closePrice?: number;
  closedAt?: Date;
  profit?: number;
  stopLoss?: number | null;
  takeProfit?: number | null;
  closeReason?: string;
}

@Injectable()
export class TradesService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => EvaluationService))
    private evaluationService: EvaluationService,
    private tradingEventsGateway: TradingEventsGateway,
    @Inject(forwardRef(() => MarketDataService))
    private marketDataService: MarketDataService,
  ) {}

  private static readonly SPOT_SYMBOLS = [
    'BTCUSDT',
    'ETHUSDT',
    'SOLUSDT',
    'XRPUSDT',
    'DOGEUSDT',
    'BNBUSDT',
    'ADAUSDT',
    'AVAXUSDT',
    'DOTUSDT',
    'LINKUSDT',
  ];

  // Create trade and trigger evaluation engine
  async createTrade(data: CreateTradeData) {
    const {
      accountId,
      profit,
      openPrice,
      closePrice,
      volume,
      symbol,
      stopLoss,
      takeProfit,
    } = data;
    const positionType: string = data.positionType === 'SPOT' ? 'SPOT' : 'CFD';
    const account = await this.prisma.tradingAccount.findUnique({
      where: { id: accountId },
      include: {
        challenge: true,
        trades: {
          select: {
            openedAt: true,
            closePrice: true,
            symbol: true,
            volume: true,
            openPrice: true,
            leverage: true,
          },
        },
      },
    });

    if (!account) {
      throw new NotFoundException('Trading account not found');
    }

    // Check account status - block trading if locked or disqualified
    if (account.status === ('DAILY_LOCKED' as any)) {
      throw new BadRequestException(
        'Daily loss limit reached. Trading locked until tomorrow.',
      );
    }
    if (account.status === ('DISQUALIFIED' as any)) {
      throw new BadRequestException(
        'Challenge disqualified. Trading is no longer allowed.',
      );
    }
    if (
      account.status === ('CLOSED' as any) ||
      account.status === ('PAUSED' as any)
    ) {
      throw new BadRequestException('Account is not active for trading.');
    }

    // Spot-specific validation
    if (positionType === 'SPOT') {
      const sym = String(symbol || '')
        .toUpperCase()
        .replace('/', '');
      if (!TradesService.SPOT_SYMBOLS.includes(sym)) {
        throw new BadRequestException(
          `Symbol ${symbol} is not available for spot trading.`,
        );
      }
      data.leverage = 1;
    }

    // Compute effective leverage for this trade (used for margin validation AND stored on the trade)
    const requestedLeverage =
      positionType === 'SPOT' ? 1 : Number(data.leverage);
    const effectiveLeverage =
      Number.isFinite(requestedLeverage) && requestedLeverage > 0
        ? requestedLeverage
        : 100;

    // Enforce margin availability to prevent opening unlimited max-size positions.
    if (closePrice === undefined || closePrice === null) {
      const isNewCrypto =
        /BTC|ETH|SOL|XRP|ADA|DOGE|BNB|AVAX|DOT|LINK|USDT/i.test(
          String(symbol || ''),
        );
      const isNewXAU = /XAU/i.test(String(symbol || ''));
      const isNewXAG = /XAG/i.test(String(symbol || ''));
      const newContractSize = isNewXAU
        ? 100
        : isNewXAG
          ? 5000
          : isNewCrypto
            ? 1
            : 100000;
      const requiredMargin =
        (Number(volume) * newContractSize * Number(openPrice)) /
        effectiveLeverage;

      const usedMargin = (account.trades || [])
        .filter((t) => t.closePrice === null)
        .reduce((sum: number, t) => {
          const isCrypto =
            /BTC|ETH|SOL|XRP|ADA|DOGE|BNB|AVAX|DOT|LINK|USDT/i.test(
              String(t.symbol || ''),
            );
          const isXAU = /XAU/i.test(String(t.symbol || ''));
          const isXAG = /XAG/i.test(String(t.symbol || ''));
          const contractSize = isXAU
            ? 100
            : isXAG
              ? 5000
              : isCrypto
                ? 1
                : 100000;
          const tradeLeverage = Number((t as any).leverage) > 0 ? Number((t as any).leverage) : 100;
          return (
            sum + (Number(t.volume) * contractSize * Number(t.openPrice)) / tradeLeverage
          );
        }, 0);

      const currentBalance = Number(
        account.balance ?? account.initialBalance ?? 0,
      );
      const availableMargin = Math.max(0, currentBalance - usedMargin);
      if (!Number.isFinite(requiredMargin) || requiredMargin <= 0) {
        throw new BadRequestException(
          'Invalid margin requirements for requested trade.',
        );
      }
      if (requiredMargin > availableMargin) {
        throw new BadRequestException(
          `Insufficient margin. Required ${requiredMargin.toFixed(2)}, available ${availableMargin.toFixed(2)}.`,
        );
      }
    }

    // 1️⃣ Store trade
    const trade = await this.prisma.trade.create({
      data: {
        tradingAccountId: accountId,
        symbol,
        type: (data.type || 'BUY') as 'BUY' | 'SELL',
        volume,
        openPrice,
        closePrice: closePrice ?? null,
        stopLoss: stopLoss ?? null,
        takeProfit: takeProfit ?? null,
        profit: profit || 0,
        openedAt: new Date(),
        closedAt: closePrice ? new Date() : null,
        positionType,
        leverage: effectiveLeverage,
      },
    });

    // 2️⃣ Update balance/equity (simple: balance += profit)
    // When opening a trade, profit is undefined/0 — balance stays the same
    const effectiveProfit = profit || 0;
    const newBalance =
      (account.balance ?? account.initialBalance) + effectiveProfit;
    const newEquity = newBalance;

    // Update maxEquityToDate if equity increased
    const currentMaxEquity = account.maxEquityToDate ?? account.initialBalance;
    const updateData: Partial<{
      balance: number;
      equity: number;
      maxEquityToDate: number;
    }> = {
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
    const evaluation =
      await this.evaluationService.evaluateAccountAfterTrade(accountId);

    // 🔥 4️⃣ Calculate trading days metrics for real-time update
    const allTrades = [...account.trades, { openedAt: trade.openedAt }]; // Include the new trade
    const tradingDaysCompleted = new Set(
      allTrades
        .filter((t) => t.openedAt)
        .map((t) => t.openedAt.toISOString().substring(0, 10)),
    ).size;

    // Check if traded today
    const today = new Date().toISOString().substring(0, 10);
    const tradedToday = allTrades.some(
      (t) => t.openedAt && t.openedAt.toISOString().substring(0, 10) === today,
    );

    // Calculate days remaining
    const daysRemaining = Math.max(
      0,
      account.challenge.minTradingDays - tradingDaysCompleted,
    );

    // Calculate profit percent for real-time display
    const initialBalance =
      account.initialBalance || account.challenge.accountSize || 0;
    const profitPercent =
      initialBalance > 0
        ? ((newEquity - initialBalance) / initialBalance) * 100
        : 0;

    // 🔥 5️⃣ Emit real-time account update via WebSocket
    this.tradingEventsGateway.emitAccountUpdate(accountId, {
      tradingDaysCount: tradingDaysCompleted,
      tradedToday,
      daysRemaining,
      balance: newBalance,
      equity: newEquity,
      profitPercent,
      lastTradeId: trade.id,
      timestamp: new Date().toISOString(),
    });

    // 🔥 6️⃣ Also emit trade executed event
    this.tradingEventsGateway.emitTradeExecuted(accountId, {
      tradeId: trade.id,
      symbol: trade.symbol,
      type: trade.type,
      volume: trade.volume,
      openPrice: trade.openPrice,
      timestamp: new Date().toISOString(),
    });

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
  async updateTrade(tradeId: string, data: UpdateTradeData) {
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
    const updateData: Partial<{
      closePrice: number;
      closedAt: Date;
      profit: number;
      stopLoss: number | null;
      takeProfit: number | null;
      closeReason: string;
    }> = {};

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
      if (profit !== undefined) {
        updateData.profit = profit;
      } else {
        const symbolUpper = String(trade.symbol || '').toUpperCase();
        const isCrypto =
          symbolUpper.includes('BTC') ||
          symbolUpper.includes('ETH') ||
          symbolUpper.includes('SOL') ||
          symbolUpper.includes('XRP') ||
          symbolUpper.includes('ADA') ||
          symbolUpper.includes('DOGE') ||
          symbolUpper.includes('BNB') ||
          symbolUpper.includes('AVAX') ||
          symbolUpper.includes('DOT') ||
          symbolUpper.includes('LINK');
        const isXAU = symbolUpper.includes('XAU');
        const isXAG = symbolUpper.includes('XAG');
        const contractSize = isXAU ? 100 : isXAG ? 5000 : isCrypto ? 1 : 100000;
        const priceDiff =
          trade.type === 'BUY'
            ? closePrice - trade.openPrice
            : trade.openPrice - closePrice;
        updateData.profit = priceDiff * (trade.volume || 0) * contractSize;
      }
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
    // If breachTriggered is set, breach fields were already captured and we skip adding them

    // 1️⃣ Update trade
    // NOTE: Breach snapshot fields are preserved - they were set before closing
    const updatedTrade = await this.prisma.trade.update({
      where: { id: tradeId },
      data: updateData,
    });

    // 2️⃣ Update balance/equity only when closing the trade
    if (closePrice !== undefined) {
      const profitToAdd = updatedTrade.profit ?? 0;
      const previousBalance = account.balance ?? account.initialBalance;
      const newBalance = previousBalance + profitToAdd;

      const nextEquity = newBalance;

      const accountUpdateData: Partial<{
        balance: number;
        equity: number;
        maxEquityToDate: number;
        todayStartEquity: number;
        minEquityToday: number;
        lastDailyReset: Date;
        minEquityOverall: number;
      }> = {
        balance: newBalance,
        equity: nextEquity,
      };

      const initialBalance = account.initialBalance ?? newBalance;
      const currentMaxEquity = account.maxEquityToDate ?? initialBalance;
      if (nextEquity > currentMaxEquity) {
        accountUpdateData.maxEquityToDate = nextEquity;
      }

      const today = new Date().toISOString().substring(0, 10);
      const lastReset = account.lastDailyReset;
      const lastResetDate = lastReset
        ? new Date(lastReset).toISOString().substring(0, 10)
        : null;

      if (lastResetDate !== today) {
        // New day baseline initialization for drawdown tracking.
        accountUpdateData.todayStartEquity = nextEquity;
        accountUpdateData.minEquityToday = nextEquity;
        accountUpdateData.lastDailyReset = new Date();
      } else {
        const currentMinToday = account.minEquityToday ?? nextEquity;
        if (nextEquity < currentMinToday) {
          accountUpdateData.minEquityToday = nextEquity;
        }
      }

      const currentMinOverall = account.minEquityOverall ?? initialBalance;
      if (nextEquity < currentMinOverall) {
        accountUpdateData.minEquityOverall = nextEquity;
      }

      await this.prisma.tradingAccount.update({
        where: { id: account.id },
        data: accountUpdateData,
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
  async modifyPosition(
    tradeId: string,
    data: { stopLoss?: number; takeProfit?: number },
  ) {
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

    // ── Server-side price validation ─────────────────────────────────────────
    // Fetch current market prices to ensure submitted TP/SL won't trigger
    // immediately. This guards against the race window between UI submission
    // and the per-second TP/SL monitor.
    if (stopLoss != null || takeProfit != null) {
      try {
        const pricesData = await this.marketDataService.getUnifiedPrices([trade.symbol]);
        const prices = pricesData?.find?.(
          (p: any) => p?.symbol?.toUpperCase() === trade.symbol?.toUpperCase(),
        );

        if (prices && prices.bid > 0 && prices.ask > 0) {
          // BUY closes at BID; SELL closes at ASK — use the same side as the monitor
          const exitPrice: number =
            trade.type === 'BUY' ? Number(prices.bid) : Number(prices.ask);

          // Minimum safe distance: 5 pips for JPY pairs, 2 pips for others.
          // Prevents TP/SL sitting right on current price and triggering in the next tick.
          const isJpy = trade.symbol.toUpperCase().includes('JPY');
          const isXau = trade.symbol.toUpperCase().includes('XAU');
          const minPips = isXau ? 0.5 : isJpy ? 0.05 : 0.0002; // 2 pips min distance

          if (stopLoss != null) {
            const sl = Number(stopLoss);
            if (trade.type === 'BUY' && sl >= exitPrice - minPips) {
              throw new BadRequestException(
                `Stop Loss (${sl}) must be at least ${minPips} below current bid (${exitPrice}) for BUY`,
              );
            }
            if (trade.type === 'SELL' && sl <= exitPrice + minPips) {
              throw new BadRequestException(
                `Stop Loss (${sl}) must be at least ${minPips} above current ask (${exitPrice}) for SELL`,
              );
            }
          }

          if (takeProfit != null) {
            const tp = Number(takeProfit);
            if (trade.type === 'BUY' && tp <= exitPrice + minPips) {
              throw new BadRequestException(
                `Take Profit (${tp}) must be at least ${minPips} above current bid (${exitPrice}) for BUY`,
              );
            }
            if (trade.type === 'SELL' && tp >= exitPrice - minPips) {
              throw new BadRequestException(
                `Take Profit (${tp}) must be at least ${minPips} below current ask (${exitPrice}) for SELL`,
              );
            }
          }
        }
      } catch (e) {
        // Re-throw validation errors; swallow price-fetch errors so modify still proceeds
        if (e instanceof BadRequestException) throw e;
      }
    }

    // Build update data object
    const updateData: Partial<{
      stopLoss: number | null;
      takeProfit: number | null;
    }> = {};

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