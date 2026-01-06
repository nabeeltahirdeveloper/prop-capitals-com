import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Clock,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '../../contexts/LanguageContext';
import { isForex } from '../../utils/instrumentType';

export default function OpenPositionsWidget({ trades = [], onRefresh }) {
  const { t } = useTranslation();
  const openTrades = trades.filter(t => t.status === 'open');
  const totalFloatingPL = openTrades.reduce((sum, t) => sum + (t.profit || 0), 0);

  if (openTrades.length === 0) {
    return (
      <Card className="bg-slate-900 border-slate-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            {t('accountDetails.openPositions.title')}
          </h3>
          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white" onClick={onRefresh}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
            <TrendingUp className="w-6 h-6 text-slate-600" />
          </div>
          <p className="text-slate-400">{t('accountDetails.openPositions.noPositions')}</p>
          <p className="text-xs text-slate-500 mt-1">{t('accountDetails.openPositions.noPositionsDesc')}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900 border-slate-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          {t('accountDetails.openPositions.title')}
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 ml-2">
            {openTrades.length}
          </Badge>
        </h3>
        <div className="flex items-center gap-3">
          <span className={`font-bold ${totalFloatingPL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {totalFloatingPL >= 0 ? '+' : ''}${totalFloatingPL.toFixed(2)}
          </span>
          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white" onClick={onRefresh}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {openTrades.map((trade) => (
          <div
            key={trade.id}
            className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 hover:border-slate-600 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  trade.type === 'buy' ? 'bg-emerald-500/20' : 'bg-red-500/20'
                }`}>
                  {trade.type === 'buy' ? (
                    <ArrowUpRight className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <ArrowDownRight className="w-5 h-5 text-red-400" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{trade.symbol}</span>
                    <Badge className={`text-xs ${
                      trade.type === 'buy' 
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                        : 'bg-red-500/20 text-red-400 border-red-500/30'
                    }`}>
                      {trade.type === 'buy' ? t('terminal.positions.buy') : t('terminal.positions.sell')}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <span>{trade.lot_size?.toFixed(2)} {t('accountDetails.openPositions.lots')}</span>
                    <span>@</span>
                    <span className="font-mono">{trade.open_price}</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <p className={`text-xl font-bold ${trade.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {trade.profit >= 0 ? '+' : ''}${trade.profit?.toFixed(2)}
                </p>
                {/* Pips removed - not shown for FOREX or CRYPTO per requirements */}
              </div>
            </div>

            {/* Trade Details */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700 text-xs text-slate-400">
              <div className="flex items-center gap-4">
                {trade.stop_loss && (
                  <span>{t('accountDetails.openPositions.stopLoss')}: <span className="text-red-400 font-mono">{trade.stop_loss}</span></span>
                )}
                {trade.take_profit && (
                  <span>{t('accountDetails.openPositions.takeProfit')}: <span className="text-emerald-400 font-mono">{trade.take_profit}</span></span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{trade.open_time}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}