// import React from 'react';
// import { Card } from '@/components/ui/card';
// import { Badge } from '@/components/ui/badge';
// import { Progress } from '@/components/ui/progress';
// import StatusBadge from '../shared/StatusBadge';
// import {
//   DollarSign,
//   TrendingUp,
//   TrendingDown,
//   Shield,
//   Calendar,
//   AlertTriangle,
//   Target
// } from 'lucide-react';

// export default function AccountSummaryCard({ account, positions = [],
//   currentPrices = {},
//   onClosePosition,
//   onModifyPosition,
//   accountStatus = 'ACTIVE',
//   onTotalPnlChange, }) {
//   const profitTarget = account.current_phase === 'phase2' ? 5 : 8;
//   const profitProgress = Math.min((account.current_profit_percent / profitTarget) * 100, 100);
//   const dailyDDProgress = (account.daily_drawdown_percent / 5) * 100;
//   const overallDDProgress = (account.overall_drawdown_percent / 10) * 100;

//   // Professional equity view: equity = balance + sum(open positions PnL)
//   // We expect caller to provide any live open PnL on the account object (e.g. account.open_positions_pnl).
//   // Fallback to backend-provided current_equity when live PnL is not available.
//   const openPositionsPnl = typeof account.open_positions_pnl === 'number'
//     ? account.open_positions_pnl
//     : 0;
//   const equityDisplay =
//     typeof account.current_balance === 'number'
//       ? account.current_balance + openPositionsPnl
//       : account.current_equity;




//   const [positionColors, setPositionColors] = useState({});


//   const priceHash = React.useMemo(() => {
//     return Object.keys(currentPrices).map(symbol => {
//       const price = currentPrices[symbol];
//       if (typeof price === 'object' && price !== null) {
//         return `${symbol}:${price.bid}:${price.ask}:${price.timestamp || 0}`;
//       }
//       return `${symbol}:${price || 0}`;
//     }).join('|');
//   }, [currentPrices]);

//   const positionsWithPnL = React.useMemo(() => {
//     return positions.map(pos => {
//       // Get price data - can be object {bid, ask} or simple number (for backward compatibility)
//       const priceData = currentPrices[pos.symbol];
//       let currentPrice;

//       if (priceData && typeof priceData === 'object') {
//         // BUY position closes by SELLING → use BID price
//         // SELL position closes by BUYING → use ASK price
//         currentPrice = pos.type?.toLowerCase() === 'buy' ? priceData.bid : priceData.ask;
//       } else if (typeof priceData === 'number') {
//         // Backward compatibility: if it's a simple number, use it
//         currentPrice = priceData;
//       } else {
//         // No price data available - use entry price as fallback
//         // This should trigger a price fetch in the parent component
//         currentPrice = pos.entryPrice;
//       }

//       // Ensure currentPrice is a valid number
//       if (typeof currentPrice !== 'number' || isNaN(currentPrice) || currentPrice <= 0) {
//         // Fallback to entry price if invalid
//         currentPrice = pos.entryPrice;
//       }

//       const priceDiff = pos.type?.toLowerCase() === 'buy'
//         ? currentPrice - pos.entryPrice
//         : pos.entryPrice - currentPrice;

//       let pnl;
//       let priceChange = null; // Price change (for non-FOREX) or % change (for crypto)

//       const posIsCrypto = isCrypto(pos.symbol);
//       const posIsForex = isForex(pos.symbol);

//       // For crypto - simple calculation
//       if (posIsCrypto) {
//         pnl = priceDiff * pos.lotSize;
//         // For crypto, show % change
//         priceChange = pos.entryPrice > 0 ? ((priceDiff / pos.entryPrice) * 100) : 0;
//       } else {
//         // For forex - standard lot calculation
//         // IMPORTANT: lotSize represents LOTS (e.g., 10 = 10 lots), NOT units
//         const contractSize = 100000;
//         pnl = priceDiff * pos.lotSize * contractSize;
//         // FOREX: Do not show pips, show raw price change instead
//         priceChange = priceDiff;
//       }

//       // Debug logging for price updates (only in development)
//       if (process.env.NODE_ENV !== 'production' && Math.abs(currentPrice - pos.entryPrice) > 0.00001) {
//         const changeLabel = posIsCrypto ? '%' : (posIsForex ? ' (price change)' : '');
//         console.log(`[OpenPositions] ${pos.symbol} ${pos.type}: Entry=${pos.entryPrice.toFixed(5)}, Current=${currentPrice.toFixed(5)}, P/L=$${pnl.toFixed(2)}`);
//       }

//       return {
//         ...pos,
//         currentPrice,
//         priceChange: priceChange !== null ? parseFloat(priceChange.toFixed(2)) : null,
//         pnl: parseFloat(pnl.toFixed(2)),
//         duration: getDurationMemo(pos.openTime),
//         isCrypto: posIsCrypto,
//         isForex: posIsForex,
//       };
//     });
//   }, [positions, priceHash, currentPrices]);











//   return (
//     <Card className="bg-slate-900 border-slate-800 p-6">
//       {/* Header */}
//       <div className="flex items-start justify-between mb-6">
//         <div>
//           <div className="flex items-center gap-2 mb-1">
//             <h2 className="text-xl font-bold text-white">${account.initial_balance?.toLocaleString()}</h2>
//             <Badge variant="outline" className="text-xs">{account.platform}</Badge>
//           </div>
//           <p className="text-sm text-slate-400">#{account.account_number}</p>
//         </div>
//         <div className="flex flex-col items-end gap-1">
//           <StatusBadge status={account.current_phase} />
//           <StatusBadge status={account.status} />
//         </div>
//       </div>


//       {/* Key Metrics */}
//       <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
//         <div className="bg-slate-800/50 rounded-xl p-4">
//           <div className="flex items-center gap-2 mb-2">
//             <DollarSign className="w-4 h-4 text-slate-400" />
//             <span className="text-xs text-slate-400">Balance</span>
//           </div>
//           <p className="text-lg font-bold text-white">${account.current_balance?.toLocaleString()}</p>
//         </div>
//         <div className="bg-slate-800/50 rounded-xl p-4">
//           <div className="flex items-center gap-2 mb-2">
//             <DollarSign className="w-4 h-4 text-slate-400" />
//             <span className="text-xs text-slate-400">Equity</span>
//           </div>
//           <p className="text-lg font-bold text-white">
//             ${equityDisplay != null ? equityDisplay.toLocaleString() : ''}
//           </p>
//         </div>
//         <div className="bg-slate-800/50 rounded-xl p-4">
//           <div className="flex items-center gap-2 mb-2">
//             {account.current_profit_percent >= 0 ? (
//               <TrendingUp className="w-4 h-4 text-emerald-400" />
//             ) : (
//               <TrendingDown className="w-4 h-4 text-red-400" />
//             )}
//             <span className="text-xs text-slate-400">Profit</span>
//           </div>
//           <p className={`text-lg font-bold ${account.current_profit_percent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
//             {account.current_profit_percent >= 0 ? '+' : ''}{account.current_profit_percent?.toFixed(2)}%
//           </p>
//         </div>
//         <div className="bg-slate-800/50 rounded-xl p-4">
//           <div className="flex items-center gap-2 mb-2">
//             <Calendar className="w-4 h-4 text-slate-400" />
//             <span className="text-xs text-slate-400">Trading Days</span>
//           </div>
//           <p className="text-lg font-bold text-white">{account.trading_days_count}/4</p>
//         </div>
//       </div>

//       {/* Progress Bars */}
//       <div className="space-y-4">
//         {/* Profit Target */}
//         <div>
//           <div className="flex items-center justify-between text-sm mb-2">
//             <div className="flex items-center gap-2">
//               <Target className="w-4 h-4 text-emerald-400" />
//               <span className="text-slate-300">Profit Target</span>
//             </div>
//             <span className="text-emerald-400 font-medium">
//               {account.current_profit_percent?.toFixed(2)}% / {profitTarget}%
//             </span>
//           </div>
//           <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
//             <div
//               className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full transition-all"
//               style={{ width: `${profitProgress}%` }}
//             />
//           </div>
//         </div>

//         {/* Daily Drawdown */}
//         <div>
//           <div className="flex items-center justify-between text-sm mb-2">
//             <div className="flex items-center gap-2">
//               <Shield className={`w-4 h-4 ${dailyDDProgress > 80 ? 'text-amber-400' : 'text-slate-400'}`} />
//               <span className="text-slate-300">Daily Drawdown</span>
//             </div>
//             <span className={dailyDDProgress > 80 ? 'text-amber-400' : 'text-white'}>
//               {account.daily_drawdown_percent?.toFixed(2)}% / 5%
//             </span>
//           </div>
//           <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
//             <div
//               className={`h-full rounded-full transition-all ${dailyDDProgress > 80 ? 'bg-amber-500' : 'bg-slate-600'
//                 }`}
//               style={{ width: `${dailyDDProgress}%` }}
//             />
//           </div>
//         </div>

//         {/* Overall Drawdown */}
//         <div>
//           <div className="flex items-center justify-between text-sm mb-2">
//             <div className="flex items-center gap-2">
//               <AlertTriangle className={`w-4 h-4 ${overallDDProgress > 80 ? 'text-red-400' : 'text-slate-400'}`} />
//               <span className="text-slate-300">Overall Drawdown</span>
//             </div>
//             <span className={overallDDProgress > 80 ? 'text-red-400' : 'text-white'}>
//               {account.overall_drawdown_percent?.toFixed(2)}% / 10%
//             </span>
//           </div>
//           <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
//             <div
//               className={`h-full rounded-full transition-all ${overallDDProgress > 80 ? 'bg-red-500' : 'bg-slate-600'
//                 }`}
//               style={{ width: `${overallDDProgress}%` }}
//             />
//           </div>
//         </div>
//       </div>
//     </Card>
//   );
// }


import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import StatusBadge from '../shared/StatusBadge';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Shield,
  Calendar,
  AlertTriangle,
  Target,
} from 'lucide-react';
import { calculatePositionsWithPnL, calculateTotalOpenPnL } from '@/utils/positionCalculations';

export default function AccountSummaryCard({
  account,
  positions = [],
  currentPrices = {},
  // baaki props agar zarurat na ho to remove kar sakte ho
}) {
  const profitTarget = account.current_phase === 'phase2' ? 5 : 8;
  const profitProgress = Math.min((account.current_profit_percent / profitTarget) * 100, 100);
  const dailyDDProgress = (account.daily_drawdown_percent / 5) * 100;
  const overallDDProgress = (account.overall_drawdown_percent / 10) * 100;

  // ── Real-time calculation ──
  const positionsWithPnL = React.useMemo(() => {
    return calculatePositionsWithPnL(positions, currentPrices);
  }, [positions, currentPrices]);

  const openPositionsPnl = React.useMemo(() => {
    return calculateTotalOpenPnL(positionsWithPnL);
  }, [positionsWithPnL]);

  const equityDisplay = (account.current_balance || 0) + openPositionsPnl;

  console.log("AccountSummaryCard → open PnL:", openPositionsPnl);
  console.log("AccountSummaryCard → open PnL:");
  console.log("AccountSummaryCard → Equity:", equityDisplay);
  console.log("AccountSummaryCard → positions count:", positionsWithPnL.length);

  return (
    <Card className="bg-slate-900 border-slate-800 p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold text-white">
              ${account.initial_balance?.toLocaleString()}
            </h2>
            <Badge variant="outline" className="text-xs">{account.platform}</Badge>
          </div>
          <p className="text-sm text-slate-400">#{account.account_number}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <StatusBadge status={account.current_phase} />
          <StatusBadge status={account.status} />
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-800/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-400">Balanceeee</span>
          </div>
          <p className="text-lg font-bold text-white">
            ${account.current_balance?.toLocaleString() || '—'}
          </p>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-400">Equity</span>
          </div>
          <p className="text-lg font-bold text-white">
            ${equityDisplay.toLocaleString() || '—'}
          </p>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            {account.current_profit_percent >= 0 ? (
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-400" />
            )}
            <span className="text-xs text-slate-400">Profit</span>
          </div>
          <p
            className={`text-lg font-bold ${
              account.current_profit_percent >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {account.current_profit_percent >= 0 ? '+' : ''}
            {account.current_profit_percent?.toFixed(2) || '0.00'}%
          </p>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-400">Trading Days</span>
          </div>
          <p className="text-lg font-bold text-white">
            {account.trading_days_count || 0}/4
          </p>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="space-y-4">
        {/* Profit Target */}
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-300">Profit Target</span>
            </div>
            <span className="text-emerald-400 font-medium">
              {account.current_profit_percent?.toFixed(2) || '0.00'}% / {profitTarget}%
            </span>
          </div>
          <Progress value={profitProgress} className="h-3" />
        </div>

        {/* Daily Drawdown */}
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <div className="flex items-center gap-2">
              <Shield
                className={`w-4 h-4 ${
                  dailyDDProgress > 80 ? 'text-amber-400' : 'text-slate-400'
                }`}
              />
              <span className="text-slate-300">Daily Drawdown</span>
            </div>
            <span className={dailyDDProgress > 80 ? 'text-amber-400' : 'text-white'}>
              {account.daily_drawdown_percent?.toFixed(2) || '0.00'}% / 5%
            </span>
          </div>
          <Progress
            value={dailyDDProgress}
            className={`h-3 ${
              dailyDDProgress > 80 ? '[&>div]:bg-amber-500' : '[&>div]:bg-slate-600'
            }`}
          />
        </div>

        {/* Overall Drawdown */}
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle
                className={`w-4 h-4 ${
                  overallDDProgress > 80 ? 'text-red-400' : 'text-slate-400'
                }`}
              />
              <span className="text-slate-300">Overall Drawdown</span>
            </div>
            <span className={overallDDProgress > 80 ? 'text-red-400' : 'text-white'}>
              {account.overall_drawdown_percent?.toFixed(2) || '0.00'}% / 10%
            </span>
          </div>
          <Progress
            value={overallDDProgress}
            className={`h-3 ${
              overallDDProgress > 80 ? '[&>div]:bg-red-500' : '[&>div]:bg-slate-600'
            }`}
          />
        </div>
      </div>
    </Card>
  );
}