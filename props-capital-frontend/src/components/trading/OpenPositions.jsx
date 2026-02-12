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
import { PnlDisplay } from "../PnlDisplay";

export default function OpenPositions({
  positions = [],
  currentPrices = {},
  onClosePosition,
  onModifyPosition,
  accountStatus = 'ACTIVE',
  onTotalPnlChange,
}) {
  const { t } = useTranslation();

  const isAccountLocked = accountStatus === 'DAILY_LOCKED' || accountStatus === 'DISQUALIFIED';

  const positionsWithPnL = React.useMemo(() => {
    return calculatePositionsWithPnL(positions, currentPrices);
  }, [positions, currentPrices]);

  // Force re-render every second to update position durations
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    if (positions.length === 0) return;
    const interval = setInterval(() => forceUpdate((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [positions.length]);

  const totalPnL = positionsWithPnL.reduce((sum, p) => sum + p.pnl, 0);

  useEffect(() => {
    if (typeof onTotalPnlChange === 'function') {
      onTotalPnlChange(totalPnL);
    }
  }, [totalPnL, onTotalPnlChange]);

  const formatPrice = (price, symbol) => {
    if (!price) return '\u2014';
    const priceValue =
      typeof price === 'object' && price !== null
        ? price.price || price.bid || price.ask || 0
        : price;
    if (typeof priceValue !== 'number' || isNaN(priceValue)) return '\u2014';

    const symbolUpper = symbol?.toUpperCase() || '';

    if (symbolUpper.includes('JPY')) return priceValue.toFixed(3);
    if (/BTC|ETH|SOL/.test(symbolUpper)) return priceValue.toFixed(2);
    if (/XRP|ADA|DOGE/.test(symbolUpper)) return priceValue.toFixed(5);
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
                        <span>&bull;</span>
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
