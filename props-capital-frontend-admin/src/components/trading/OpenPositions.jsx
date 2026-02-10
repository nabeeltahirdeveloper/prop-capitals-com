// import React, { useState, useEffect } from 'react';
// import { Card } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Badge } from '@/components/ui/badge';
// import { calculatePositionsWithPnL, getPositionDuration } from '@/utils/positionCalculations';
// import {
//   X,
//   TrendingUp,
//   TrendingDown,
//   Clock,
//   DollarSign,
//   Edit,
//   MoreHorizontal
// } from 'lucide-react';
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import { useTranslation } from '../../contexts/LanguageContext';
// import { isForex, isCrypto } from '../../utils/instrumentType';

// export default function OpenPositions({
//   positions = [],
//   currentPrices = {},
//   onClosePosition,
//   onModifyPosition,
//   accountStatus = 'ACTIVE',
//   onTotalPnlChange,
// }) {

//   const { t } = useTranslation();
//   const [positionColors, setPositionColors] = useState({});

//   // Disable close buttons when account is locked or disqualified
//   const isAccountLocked = accountStatus === 'DAILY_LOCKED' || accountStatus === 'DISQUALIFIED';

//   const getDurationMemo = (openTime) => {
//     const ms = Date.now() - new Date(openTime).getTime();
//     const hours = Math.floor(ms / 3600000);
//     const minutes = Math.floor((ms % 3600000) / 60000);
//     const seconds = Math.floor((ms % 60000) / 1000);

//     if (hours > 0) return `${hours}h ${minutes}m`;
//     if (minutes > 0) return `${minutes}m ${seconds}s`;
//     return `${seconds}s`;
//   };

//   // Calculate P/L directly from props - no internal state that could conflict
//   // Use useMemo to recalculate when prices or positions change
//   // Create a price hash to detect changes in price objects
//   const priceHash = React.useMemo(() => {
//     return Object.keys(currentPrices).map(symbol => {
//       const price = currentPrices[symbol];
//       if (typeof price === 'object' && price !== null) {
//         return `${symbol}:${price.bid}:${price.ask}:${price.timestamp || 0}`;
//       }
//       return `${symbol}:${price || 0}`;
//     }).join('|');
//   }, [currentPrices]);




//   // rigth version
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
//       // if (process.env.NODE_ENV !== 'production' && Math.abs(currentPrice - pos.entryPrice) > 0.00001) {
//       //   const changeLabel = posIsCrypto ? '%' : (posIsForex ? ' (price change)' : '');
//       //   console.log(`[OpenPositions] ${pos.symbol} ${pos.type}: Entry=${pos.entryPrice.toFixed(5)}, Current=${currentPrice.toFixed(5)}, P/L=$${pnl.toFixed(2)}`);
//       // }

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

//   // Update durations every second and lock colors
//   //   const positionsWithPnL = React.useMemo(() => {
//   //   const list = calcPositionsWithPnL(positions, currentPrices);
//   //   return list.map(p => ({
//   //     ...p,
//   //     duration: getDurationMemo(p.openTime),
//   //   }));
//   // }, [positions, currentPrices]);





//   const [, setTick] = useState(0);
//   useEffect(() => {
//     const interval = setInterval(() => {
//       setTick(t => t + 1);

//       // Lock color for each position based on profit/loss
//       const newColors = {};
//       positionsWithPnL.forEach(pos => {
//         if (pos.pnl >= 0) {
//           newColors[pos.id] = 'text-emerald-400';
//         } else {
//           newColors[pos.id] = 'text-red-400';
//         }
//       });
//       setPositionColors(newColors);
//     }, 1000);
//     return () => clearInterval(interval);
//   }, [positions, currentPrices]);





//   useEffect(() => {
//     const interval = setInterval(() => {
//       setTick(t => t + 1);

//       const newColors = {};
//       positionsWithPnL.forEach(pos => {
//         newColors[pos.id] = pos.pnl >= 0 ? 'text-emerald-400' : 'text-red-400';
//       });
//       setPositionColors(newColors);
//     }, 1000);

//     return () => clearInterval(interval);
//   }, [positionsWithPnL]);

//   const totalPnL = positionsWithPnL.reduce((sum, p) => sum + p.pnl, 0);

//   // Notify parent about total open PnL so it can compute real-time equity = balance + totalPnL
//   useEffect(() => {
//     if (typeof onTotalPnlChange === 'function') {
//       onTotalPnlChange(totalPnL);
//     }
//   }, [totalPnL, onTotalPnlChange]);

//   const formatPrice = (price, symbol) => {
//     if (!price) return '—';
//     // Handle both number and object formats (for backward compatibility)
//     const priceValue = typeof price === 'object' && price !== null
//       ? (price.price || price.bid || price.ask || 0)
//       : price;
//     if (typeof priceValue !== 'number' || isNaN(priceValue)) return '—';

//     // Determine decimal places based on symbol type
//     if (!symbol) return priceValue.toFixed(5); // Default to 5 decimals

//     const symbolUpper = symbol.toUpperCase();

//     // JPY pairs - 3 decimals
//     if (symbolUpper.includes('JPY')) {
//       return priceValue.toFixed(3);
//     }

//     // Major crypto (BTC, ETH, SOL) - 2 decimals
//     if (symbolUpper.includes('BTC') || symbolUpper.includes('ETH') || symbolUpper.includes('SOL')) {
//       return priceValue.toFixed(2);
//     }

//     // Other crypto (XRP, ADA, DOGE) - 5 decimals
//     if (symbolUpper.includes('XRP') || symbolUpper.includes('ADA') || symbolUpper.includes('DOGE')) {
//       return priceValue.toFixed(5);
//     }

//     // Forex pairs and others - 5 decimals (user requirement)
//     return priceValue.toFixed(5);
//   };

//   if (positions.length === 0) {
//     return (
//       <Card className="bg-slate-900 border-slate-800 p-6">
//         <div className="text-center py-8">
//           <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
//             <TrendingUp className="w-8 h-8 text-slate-600" />
//           </div>
//           <h3 className="text-white font-medium mb-1">{t('terminal.positions.noPositions')}</h3>
//           <p className="text-slate-400 text-sm">{t('terminal.positions.noPositionsDesc')}</p>
//         </div>
//       </Card>
//     );
//   }

//   return (
//     <Card className="bg-slate-900 border-slate-800">
//       {/* Header */}
//       <div className="p-4 border-b border-slate-800 flex items-center justify-between">
//         <div className="flex items-center gap-3">
//           <h3 className="text-white font-semibold">{t('terminal.positions.title')}</h3>
//           <Badge variant="outline" className="border-slate-700 text-slate-400">
//             {positions.length}
//           </Badge>
//         </div>
//         <div className={`text-lg font-bold font-mono ${totalPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
//           {totalPnL >= 0 ? '+' : ''}{totalPnL.toFixed(2)} USD
//         </div>
//       </div>

//       {/* Positions List */}
//       <div className="overflow-y-auto h-[440px] custom-scrollbar">
//         <style>{`
//           .custom-scrollbar {
//             scrollbar-width: thin;
//             scrollbar-color: #475569 #1e293b;
//           }
//           .custom-scrollbar::-webkit-scrollbar {
//             width: 8px;
//           }
//           .custom-scrollbar::-webkit-scrollbar-track {
//             background: #1e293b;
//             border-radius: 4px;
//           }
//           .custom-scrollbar::-webkit-scrollbar-thumb {
//             background: #475569;
//             border-radius: 4px;
//           }
//           .custom-scrollbar::-webkit-scrollbar-thumb:hover {
//             background: #64748b;
//           }
//         `}</style>
//         <div className="divide-y divide-slate-800">
//           {positionsWithPnL.map((position) => (
//             <div
//               key={position.id}
//               className="p-4 hover:bg-slate-800/50 transition-colors"
//             >
//               <div className="flex items-start justify-between mb-3">
//                 <div className="flex items-center gap-3">
//                   <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${position.type?.toLowerCase() === 'buy'
//                     ? 'bg-emerald-500/20'
//                     : 'bg-red-500/20'
//                     }`}>
//                     {position.type?.toLowerCase() === 'buy'
//                       ? <TrendingUp className="w-5 h-5 text-emerald-400" />
//                       : <TrendingDown className="w-5 h-5 text-red-400" />
//                     }
//                   </div>
//                   <div>
//                     <div className="flex items-center gap-2">
//                       <span className="text-white font-medium">{position.symbol}</span>
//                       <Badge className={`text-xs ${position.type?.toLowerCase() === 'buy'
//                         ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
//                         : 'bg-red-500/20 text-red-400 border-red-500/30'
//                         }`}>
//                         {position.type?.toLowerCase() === 'buy' ? t('terminal.positions.buy') : t('terminal.positions.sell')}
//                       </Badge>
//                     </div>
//                     <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
//                       <span>{position.lotSize?.toFixed(2)} {t('terminal.lots')}</span>
//                       <span>•</span>
//                       <Clock className="w-3 h-3" />
//                       <span>{position.duration}</span>
//                     </div>
//                   </div>
//                 </div>






//                 <div className="flex items-center gap-2">
//                   <div className="text-right">
//                     <p className={`text-lg font-bold font-mono ${positionColors[position.id] || (position.pnl >= 0 ? 'text-emerald-400' : 'text-red-400')
//                       }`}>
//                       {position.pnl >= 0 ? '+' : ''}{position.pnl.toFixed(2)}
//                     </p>
//                     {position.priceChange !== null && !position.isForex && (
//                       <p className={`text-xs ${positionColors[position.id] || (position.priceChange >= 0 ? 'text-emerald-400' : 'text-red-400')
//                         }`}>
//                         {position.priceChange >= 0 ? '+' : ''}{position.priceChange.toFixed(2)}{position.isCrypto ? '%' : ''}
//                       </p>
//                     )}
//                   </div>

//                   <DropdownMenu>
//                     <DropdownMenuTrigger asChild>
//                       <Button size="sm" variant="ghost" className="text-slate-400">
//                         <MoreHorizontal className="w-4 h-4" />
//                       </Button>
//                     </DropdownMenuTrigger>
//                     <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
//                       <DropdownMenuItem
//                         onClick={() => onModifyPosition?.(position)}
//                         className="text-slate-300 focus:bg-slate-700 hover:text-white focus:text-white"
//                       >
//                         <Edit className="w-4 h-4 mr-2" />
//                         {t('terminal.positions.modifySLTP')}
//                       </DropdownMenuItem>
//                       <DropdownMenuItem
//                         onClick={() => !isAccountLocked && onClosePosition?.(position)}
//                         disabled={isAccountLocked}
//                         className="text-red-400 focus:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed focus:text-red-400"
//                       >
//                         <X className="w-4 h-4 mr-2" />
//                         {t('terminal.positions.closePosition')}
//                       </DropdownMenuItem>
//                     </DropdownMenuContent>
//                   </DropdownMenu>
//                 </div>
//               </div>

//               {/* Price Info */}
//               <div className="grid grid-cols-4 gap-4 text-sm">
//                 <div>
//                   <p className="text-slate-500 text-xs">{t('terminal.positions.entry')}</p>
//                   <p className="text-white font-mono">{formatPrice(position.entryPrice, position.symbol)}</p>
//                 </div>
//                 <div>
//                   <p className="text-slate-500 text-xs">{t('terminal.positions.current')}</p>
//                   <p className={`font-mono ${(position.type?.toLowerCase() === 'buy' && position.currentPrice > position.entryPrice) ||
//                     (position.type?.toLowerCase() === 'sell' && position.currentPrice < position.entryPrice)
//                     ? 'text-emerald-400' : 'text-red-400'
//                     }`}>
//                     {formatPrice(position.currentPrice, position.symbol)}
//                   </p>
//                 </div>
//                 <div>
//                   <p className="text-slate-500 text-xs">SL</p>
//                   <p className="text-red-400 font-mono">
//                     {position.stopLoss ? formatPrice(position.stopLoss, position.symbol) : '-'}
//                   </p>
//                 </div>
//                 <div>
//                   <p className="text-slate-500 text-xs">TP</p>
//                   <p className="text-emerald-400 font-mono">
//                     {position.takeProfit ? formatPrice(position.takeProfit, position.symbol) : '-'}
//                   </p>
//                 </div>
//               </div>

//               {/* Close Button */}
//               <Button
//                 onClick={() => !isAccountLocked && onClosePosition?.(position)}
//                 disabled={isAccountLocked}
//                 size="sm"
//                 variant="outline"
//                 className="w-full mt-3 border-red-500/30 text-red-600 hover:bg-red-500/10 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
//               >
//                 <X className="w-4 h-4 mr-2" />
//                 {isAccountLocked
//                   ? t('terminal.positions.autoClosed') || 'Auto-closed'
//                   : `${t('terminal.positions.closeAt')} ${formatPrice(position.currentPrice, position.symbol)}`}
//               </Button>
//             </div>
//           ))}
//         </div>
//       </div>
//     </Card>
//   );
// }





// import React, { useState, useEffect } from 'react';
// import { Card } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { PnlDisplay } from "../PnlDisplay"
// import { Badge } from '@/components/ui/badge';
// import {
//   X,
//   TrendingUp,
//   TrendingDown,
//   Clock,
//   Edit,
//   MoreHorizontal
// } from 'lucide-react';
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import { useTranslation } from '../../contexts/LanguageContext';
// import { calculatePositionsWithPnL, getPositionDuration } from '@/utils/positionCalculations';

// export default function OpenPositions({
//   positions = [],
//   currentPrices = {},
//   onClosePosition,
//   onModifyPosition,
//   accountStatus = 'ACTIVE',
//   onTotalPnlChange,
// }) {
//   const { t } = useTranslation();
//   const [positionColors, setPositionColors] = useState({});

//   const isAccountLocked = accountStatus === 'DAILY_LOCKED' || accountStatus === 'DISQUALIFIED';

//   // Positions + PnL + current price calculation (yeh wala logic bilkul same rahega)
//   const positionsWithPnL = React.useMemo(() => {
//     const enriched = calculatePositionsWithPnL(positions, currentPrices);

//     // Duration abhi yahan mat daalo – har second update ke liye alag handle karenge
//     return enriched;
//   }, [positions, currentPrices]);

//   // Har second update hone wali cheezein (duration + colors)
//   const [, forceUpdate] = useState(0);

//   useEffect(() => {
//     const interval = setInterval(() => {
//       forceUpdate(t => t + 1);

//       // Colors update
//       const newColors = {};
//       positionsWithPnL.forEach(pos => {
//         newColors[pos.id] = pos.pnl >= 0 ? 'text-emerald-400' : 'text-red-400';
//       });
//       setPositionColors(newColors);
//     }, 1000);

//     return () => clearInterval(interval);
//   }, [positionsWithPnL]); // sirf jab positions ya prices change hon tab dependency

//   const totalPnL = positionsWithPnL.reduce((sum, p) => sum + p.pnl, 0);

//   useEffect(() => {
//     if (typeof onTotalPnlChange === 'function') {
//       onTotalPnlChange(totalPnL);
//     }
//   }, [totalPnL, onTotalPnlChange]);

//   const formatPrice = (price, symbol) => {
//     if (!price) return '—';
//     const priceValue = typeof price === 'object' && price !== null
//       ? (price.price || price.bid || price.ask || 0)
//       : price;
//     if (typeof priceValue !== 'number' || isNaN(priceValue)) return '—';

//     const symbolUpper = symbol?.toUpperCase() || '';

//     if (symbolUpper.includes('JPY')) return priceValue.toFixed(3);
//     if (symbolUpper.includes('BTC') || symbolUpper.includes('ETH') || symbolUpper.includes('SOL')) {
//       return priceValue.toFixed(2);
//     }
//     if (symbolUpper.includes('XRP') || symbolUpper.includes('ADA') || symbolUpper.includes('DOGE')) {
//       return priceValue.toFixed(5);
//     }
//     return priceValue.toFixed(5);
//   };

//   if (positions.length === 0) {
//     return (
//       <Card className="bg-slate-900 border-slate-800 p-6">
//         <div className="text-center py-8">
//           <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
//             <TrendingUp className="w-8 h-8 text-slate-600" />
//           </div>
//           <h3 className="text-white font-medium mb-1">{t('terminal.positions.noPositions')}</h3>
//           <p className="text-slate-400 text-sm">{t('terminal.positions.noPositionsDesc')}</p>
//         </div>
//       </Card>
//     );
//   }

//   return (
//     <Card className="bg-slate-900 border-slate-800">
//       {/* Header */}
//       <div className="p-4 border-b border-slate-800 flex items-center justify-between">
//         <div className="flex items-center gap-3">
//           <h3 className="text-white font-semibold">{t('terminal.positions.title')}</h3>
//           <Badge variant="outline" className="border-slate-700 text-slate-400">
//             {positions.length}
//           </Badge>
//         </div>
//         <div className={`text-lg font-bold font-mono ${totalPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
//           {totalPnL >= 0 ? '+' : ''}{totalPnL.toFixed(2)} USD
//         </div>
//       </div>

//       {/* Positions List */}
//       <div className="overflow-y-auto h-[440px] custom-scrollbar">
//         <style>{`
//           .custom-scrollbar {
//             scrollbar-width: thin;
//             scrollbar-color: #475569 #1e293b;
//           }
//           .custom-scrollbar::-webkit-scrollbar {
//             width: 8px;
//           }
//           .custom-scrollbar::-webkit-scrollbar-track {
//             background: #1e293b;
//             border-radius: 4px;
//           }
//           .custom-scrollbar::-webkit-scrollbar-thumb {
//             background: #475569;
//             border-radius: 4px;
//           }
//           .custom-scrollbar::-webkit-scrollbar-thumb:hover {
//             background: #64748b;
//           }
//         `}</style>

//         <div className="divide-y divide-slate-800">
//           {positionsWithPnL.map((position) => {
//             // Duration har render pe fresh calculate kar rahe hain (second-wise update)
//             const duration = getPositionDuration(position.openTime);

//             return (
//               <div
//                 key={position.id}
//                 className="p-4 hover:bg-slate-800/50 transition-colors"
//               >
//                 <div className="flex items-start justify-between mb-3">
//                   <div className="flex items-center gap-3">
//                     <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${position.type?.toLowerCase() === 'buy'
//                       ? 'bg-emerald-500/20'
//                       : 'bg-red-500/20'
//                       }`}>
//                       {position.type?.toLowerCase() === 'buy'
//                         ? <TrendingUp className="w-5 h-5 text-emerald-400" />
//                         : <TrendingDown className="w-5 h-5 text-red-400" />
//                       }
//                     </div>
//                     <div>
//                       <div className="flex items-center gap-2">
//                         <span className="text-white font-medium">{position.symbol}</span>
//                         <Badge className={`text-xs ${position.type?.toLowerCase() === 'buy'
//                           ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
//                           : 'bg-red-500/20 text-red-400 border-red-500/30'
//                           }`}>
//                           {position.type?.toLowerCase() === 'buy' ? t('terminal.positions.buy') : t('terminal.positions.sell')}
//                         </Badge>
//                       </div>
//                       <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
//                         <span>{position.lotSize?.toFixed(2)} {t('terminal.lots')}</span>
//                         <span>•</span>
//                         <Clock className="w-3 h-3" />
//                         <span>{duration}</span>
//                       </div>
//                     </div>
//                   </div>




//                   {/* <div className="flex items-center gap-2">
//                     <div className="text-right">
//                       <p className={`text-lg font-bold font-mono ${positionColors[position.id] || (position.pnl >= 0 ? 'text-emerald-400' : 'text-red-400')}`}>
//                         {position.pnl >= 0 ? '+' : ''}{position.pnl.toFixed(2)}
//                       </p>
//                       {position.priceChange !== null && !position.isForex && (
//                         <p className={`text-xs ${positionColors[position.id] || (position.priceChange >= 0 ? 'text-emerald-400' : 'text-red-400')}`}>
//                           {position.priceChange >= 0 ? '+' : ''}{position.priceChange.toFixed(2)}{position.isCrypto ? '%' : ''}
//                         </p>
//                       )}
//                     </div> */}
//                   <PnlDisplay
//                     pnl={position.pnl}
//                     priceChange={position.priceChange}
//                     isForex={position.isForex}
//                     isCrypto={position.isCrypto}
//                     size="default"
//                   />

//                   <DropdownMenu>
//                     <DropdownMenuTrigger asChild>
//                       <Button size="sm" variant="ghost" className="text-slate-400">
//                         <MoreHorizontal className="w-4 h-4" />
//                       </Button>
//                     </DropdownMenuTrigger>
//                     <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
//                       <DropdownMenuItem
//                         onClick={() => onModifyPosition?.(position)}
//                         className="text-slate-300 focus:bg-slate-700 hover:text-white focus:text-white"
//                       >
//                         <Edit className="w-4 h-4 mr-2" />
//                         {t('terminal.positions.modifySLTP')}
//                       </DropdownMenuItem>
//                       <DropdownMenuItem
//                         onClick={() => !isAccountLocked && onClosePosition?.(position)}
//                         disabled={isAccountLocked}
//                         className="text-red-400 focus:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed focus:text-red-400"
//                       >
//                         <X className="w-4 h-4 mr-2" />
//                         {t('terminal.positions.closePosition')}
//                       </DropdownMenuItem>
//                     </DropdownMenuContent>
//                   </DropdownMenu>
//                 </div>
//               </div>

//                 {/* Price Info */ }
//             <div className="grid grid-cols-4 gap-4 text-sm">
//               <div>
//                 <p className="text-slate-500 text-xs">{t('terminal.positions.entry')}</p>
//                 <p className="text-white font-mono">{formatPrice(position.entryPrice, position.symbol)}</p>
//               </div>
//               <div>
//                 <p className="text-slate-500 text-xs">{t('terminal.positions.current')}</p>
//                 <p className={`font-mono ${(position.type?.toLowerCase() === 'buy' && position.currentPrice > position.entryPrice) ||
//                   (position.type?.toLowerCase() === 'sell' && position.currentPrice < position.entryPrice)
//                   ? 'text-emerald-400' : 'text-red-400'
//                   }`}>
//                   {formatPrice(position.currentPrice, position.symbol)}
//                 </p>
//               </div>
//               <div>
//                 <p className="text-slate-500 text-xs">SL</p>
//                 <p className="text-red-400 font-mono">
//                   {position.stopLoss ? formatPrice(position.stopLoss, position.symbol) : '-'}
//                 </p>
//               </div>
//               <div>
//                 <p className="text-slate-500 text-xs">TP</p>
//                 <p className="text-emerald-400 font-mono">
//                   {position.takeProfit ? formatPrice(position.takeProfit, position.symbol) : '-'}
//                 </p>
//               </div>
//             </div>

//             {/* Close Button */ }
//             <Button
//               onClick={() => !isAccountLocked && onClosePosition?.(position)}
//               disabled={isAccountLocked}
//               size="sm"
//               variant="outline"
//               className="w-full mt-3 border-red-500/30 text-red-600 hover:bg-red-500/10 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
//             >
//               <X className="w-4 h-4 mr-2" />
//               {isAccountLocked
//                 ? t('terminal.positions.autoClosed') || 'Auto-closed'
//                 : `${t('terminal.positions.closeAt')} ${formatPrice(position.currentPrice, position.symbol)}`}
//             </Button>
//               </div>
//         );
//           })}
//       </div>
//     </div>
//     </Card >
//   );
// }


import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  X,
  TrendingUp,
  TrendingDown,
  Clock,
  Edit,
  MoreHorizontal,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from '../../contexts/LanguageContext';
import { calculatePositionsWithPnL, getPositionDuration } from '@/utils/positionCalculations';
import { PnlDisplay } from "../PnlDisplay";   // assuming path correct hai

export default function OpenPositions({
  positions = [],
  currentPrices = {},
  onClosePosition,
  onModifyPosition,
  accountStatus = 'ACTIVE',
  onTotalPnlChange,
}) {
  const { t } = useTranslation();
  const [positionColors, setPositionColors] = useState({});

  const isAccountLocked = accountStatus === 'DAILY_LOCKED' || accountStatus === 'DISQUALIFIED';

  const positionsWithPnL = React.useMemo(() => {
    return calculatePositionsWithPnL(positions, currentPrices);
  }, [positions, currentPrices]);

  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      forceUpdate((t) => t + 1);

      const newColors = {};
      positionsWithPnL.forEach((pos) => {
        newColors[pos.id] = pos.pnl >= 0 ? 'text-emerald-400' : 'text-red-400';
      });
      setPositionColors(newColors);
    }, 1000);

    return () => clearInterval(interval);
  }, [positionsWithPnL]);

  const totalPnL = positionsWithPnL.reduce((sum, p) => sum + p.pnl, 0);

  useEffect(() => {
    if (typeof onTotalPnlChange === 'function') {
      onTotalPnlChange(totalPnL);
    }
  }, [totalPnL, onTotalPnlChange]);

  const formatPrice = (price, symbol) => {
    if (!price) return '—';
    const priceValue =
      typeof price === 'object' && price !== null
        ? price.price || price.bid || price.ask || 0
        : price;
    if (typeof priceValue !== 'number' || isNaN(priceValue)) return '—';

    const symbolUpper = symbol?.toUpperCase() || '';

    if (symbolUpper.includes('JPY')) return priceValue.toFixed(3);
    if (symbolUpper.includes('BTC') || symbolUpper.includes('ETH') || symbolUpper.includes('SOL')) {
      return priceValue.toFixed(2);
    }
    if (symbolUpper.includes('XRP') || symbolUpper.includes('ADA') || symbolUpper.includes('DOGE')) {
      return priceValue.toFixed(5);
    }
    return priceValue.toFixed(5);
  };

  if (positions.length === 0) {
    return (
      <Card className="bg-slate-900 border-slate-800 p-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-8 h-8 text-slate-600" />
          </div>
          <h3 className="text-white font-medium mb-1">{t('terminal.positions.noPositions')}</h3>
          <p className="text-slate-400 text-sm">{t('terminal.positions.noPositionsDesc')}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-white font-semibold">{t('terminal.positions.title')}</h3>
          <Badge variant="outline" className="border-slate-700 text-slate-400">
            {positions.length}
          </Badge>
        </div>
        <div
          className={`text-lg font-bold font-mono ${
            totalPnL >= 0 ? 'text-emerald-400' : 'text-red-400'
          }`}
        >
          {totalPnL >= 0 ? '+' : ''}{totalPnL.toFixed(2)} USD
        </div>
      </div>

      {/* Positions List */}
      <div className="overflow-y-auto h-[440px] custom-scrollbar">
        <style>{`
          .custom-scrollbar {
            scrollbar-width: thin;
            scrollbar-color: #475569 #1e293b;
          }
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #1e293b;
            border-radius: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #475569;
            border-radius: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #64748b;
          }
        `}</style>

        <div className="divide-y divide-slate-800">
          {positionsWithPnL.map((position) => {
            const duration = getPositionDuration(position.openTime);

            return (
              <div
                key={position.id}
                className="p-4 hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        position.type?.toLowerCase() === 'buy'
                          ? 'bg-emerald-500/20'
                          : 'bg-red-500/20'
                      }`}
                    >
                      {position.type?.toLowerCase() === 'buy' ? (
                        <TrendingUp className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-red-400" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{position.symbol}</span>
                        <Badge
                          className={`text-xs ${
                            position.type?.toLowerCase() === 'buy'
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              : 'bg-red-500/20 text-red-400 border-red-500/30'
                          }`}
                        >
                          {position.type?.toLowerCase() === 'buy'
                            ? t('terminal.positions.buy')
                            : t('terminal.positions.sell')}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                        <span>{position.lotSize?.toFixed(2)} {t('terminal.lots')}</span>
                        <span>•</span>
                        <Clock className="w-3 h-3" />
                        <span>{duration}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <PnlDisplay
                      pnl={position.pnl}
                      priceChange={position.priceChange}
                      isForex={position.isForex}
                      isCrypto={position.isCrypto}
                      size="default"
                    />

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost" className="text-slate-400">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                        <DropdownMenuItem
                          onClick={() => onModifyPosition?.(position)}
                          className="text-slate-300 focus:bg-slate-700 hover:text-white focus:text-white"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          {t('terminal.positions.modifySLTP')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => !isAccountLocked && onClosePosition?.(position)}
                          disabled={isAccountLocked}
                          className="text-red-400 focus:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed focus:text-red-400"
                        >
                          <X className="w-4 h-4 mr-2" />
                          {t('terminal.positions.closePosition')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Price Info */}
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500 text-xs">{t('terminal.positions.entry')}</p>
                    <p className="text-white font-mono">
                      {formatPrice(position.entryPrice, position.symbol)}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs">{t('terminal.positions.current')}</p>
                    <p
                      className={`font-mono ${
                        (position.type?.toLowerCase() === 'buy' &&
                          position.currentPrice > position.entryPrice) ||
                        (position.type?.toLowerCase() === 'sell' &&
                          position.currentPrice < position.entryPrice)
                          ? 'text-emerald-400'
                          : 'text-red-400'
                      }`}
                    >
                      {formatPrice(position.currentPrice, position.symbol)}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs">SL</p>
                    <p className="text-red-400 font-mono">
                      {position.stopLoss ? formatPrice(position.stopLoss, position.symbol) : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs">TP</p>
                    <p className="text-emerald-400 font-mono">
                      {position.takeProfit
                        ? formatPrice(position.takeProfit, position.symbol)
                        : '-'}
                    </p>
                  </div>
                </div>

                {/* Close Button */}
                <Button
                  onClick={() => !isAccountLocked && onClosePosition?.(position)}
                  disabled={isAccountLocked}
                  size="sm"
                  variant="outline"
                  className="w-full mt-3 border-red-500/30 text-red-600 hover:bg-red-500/10 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X className="w-4 h-4 mr-2" />
                  {isAccountLocked
                    ? t('terminal.positions.autoClosed') || 'Auto-closed'
                    : `${t('terminal.positions.closeAt')} ${formatPrice(
                        position.currentPrice,
                        position.symbol
                      )}`}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}