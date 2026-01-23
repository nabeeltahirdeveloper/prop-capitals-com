import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import {
  Minus,
  Plus,
  X,
  ChevronDown
} from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext';

export default function TradingPanel({ 
  selectedSymbol, 
  accountBalance = 100000,
  onExecuteTrade,
  maxLotSize = 100,
  chartPrice,
  disabled = false
}) {
  const { t } = useTranslation();
  const [orderType, setOrderType] = useState('limit');
  const [tradeDirection, setTradeDirection] = useState('buy');
  const [lotSize, setLotSize] = useState(0.01);
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [limitPrice, setLimitPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leveragePercent, setLeveragePercent] = useState(25);

  // Default symbol if none selected
  const defaultSymbol = { 
    symbol: 'EUR/USD', 
    bid: 1.08542, 
    ask: 1.08557, 
    spread: 1.5,
    change: 0.05
  };
  
  const symbol = selectedSymbol && selectedSymbol.symbol ? selectedSymbol : defaultSymbol;

  const leverage = 100;
  
  // Check if symbol is crypto - derived directly from symbol
  const isCrypto = symbol.symbol.includes('BTC') || symbol.symbol.includes('ETH') || 
                   symbol.symbol.includes('SOL') || symbol.symbol.includes('XRP') ||
                   symbol.symbol.includes('ADA') || symbol.symbol.includes('DOGE');
  
  // Contract size: 1 for crypto, 100000 for forex
  const contractSize = isCrypto ? 1 : 100000;
  
  // Reset lot size when symbol changes
  useEffect(() => {
    // Set a reasonable default based on asset type and account balance
    if (isCrypto) {
      setLotSize(0.1); // 0.1 BTC
    } else {
      setLotSize(1.0); // 1.0 lot = standard lot
    }
    setLeveragePercent(25);
  }, [symbol.symbol]);
  
  const calculateMargin = () => {
    const margin = lotSize * contractSize * symbol.bid / leverage;
    return margin.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const calculateOrderValue = () => {
    const value = lotSize * contractSize * symbol.bid;
    return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  
  // Calculate lot size from percentage of account balance (as margin)
  const calculateLotSizeFromPercent = (percent) => {
    // With 100x leverage:
    // margin = lotSize * contractSize * price / leverage
    // So: lotSize = (margin * leverage) / (contractSize * price)
    const marginToUse = accountBalance * (percent / 100);
    const price = symbol.bid;
    
    if (!price || price === 0) return isCrypto ? 0.01 : 0.1;
    
    // lotSize = (marginToUse * leverage) / (contractSize * price)
    const newLotSize = (marginToUse * leverage) / (contractSize * price);
    
    // For crypto, round to 4 decimals; for forex, round to 2 decimals
    const decimals = isCrypto ? 4 : 2;
    const minLot = isCrypto ? 0.0001 : 0.01;
    
    const result = Math.max(minLot, Math.min(newLotSize, maxLotSize));
    return parseFloat(result.toFixed(decimals));
  };

  const handleTrade = () => {
    console.log('=== TradingPanel handleTrade START ===');
    console.log('Symbol:', symbol);
    console.log('onExecuteTrade:', typeof onExecuteTrade);
    
    if (isSubmitting) {
      console.log('Already submitting, returning');
      return;
    }
    
    // Get market price - prefer chart price (real-time), then symbol data, then fallback
    const basePrice = chartPrice || symbol.bid || 1.08542;
    // Add small spread for ask price
    const spread = isCrypto ? basePrice * 0.001 : 0.00015;
    const marketPrice = tradeDirection === 'buy' 
      ? basePrice + spread
      : basePrice;
    
    console.log('Chart price:', chartPrice, 'Market price:', marketPrice);
    
    if (!marketPrice || marketPrice <= 0) {
      console.error('Invalid market price');
      return;
    }
    
    setIsSubmitting(true);
    
    // Parse limit price from input - if user typed a custom price
    const inputLimitPrice = limitPrice && limitPrice.trim() !== '' ? parseFloat(limitPrice) : null;
    
    // Check if this is a pending limit order (user entered a specific price)
    const isPendingOrder = inputLimitPrice !== null && 
      !isNaN(inputLimitPrice) && 
      inputLimitPrice > 0;
    
    // For pending orders, use the limit price; for market orders, use current market price
    const executionPrice = isPendingOrder ? inputLimitPrice : marketPrice;
    
    const trade = {
      symbol: symbol.symbol || 'EUR/USD',
      type: tradeDirection,
      lotSize: lotSize,
      entryPrice: executionPrice,
      stopLoss: stopLoss ? parseFloat(stopLoss) : null,
      takeProfit: takeProfit ? parseFloat(takeProfit) : null,
      orderType: isPendingOrder ? 'limit' : 'market',
      limitPrice: isPendingOrder ? inputLimitPrice : null,
      timestamp: new Date().toISOString()
    };

    console.log('Trade object created:', trade);

    if (onExecuteTrade) {
      console.log('Calling onExecuteTrade...');
      onExecuteTrade(trade);
      console.log('onExecuteTrade called successfully');
    } else {
      console.error('onExecuteTrade is not defined!');
    }
    
    setLimitPrice('');
    setIsSubmitting(false);
    console.log('=== TradingPanel handleTrade END ===');
  };

  const adjustLotSize = (delta) => {
    const decimals = isCrypto ? 4 : 2;
    const minLot = isCrypto ? 0.0001 : 0.01;
    const step = isCrypto ? 0.01 : 0.1;
    const actualDelta = delta > 0 ? step : -step;
    const newSize = Math.max(minLot, Math.min(maxLotSize, lotSize + actualDelta));
    setLotSize(parseFloat(newSize.toFixed(decimals)));
  };

  const formatPrice = (price) => {
    if (!price) return '—';
    if (symbol.symbol.includes('JPY')) return price.toFixed(3);
    if (symbol.symbol.includes('BTC') || symbol.symbol.includes('ETH') || symbol.symbol.includes('SOL')) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (symbol.symbol.includes('XRP') || symbol.symbol.includes('ADA') || symbol.symbol.includes('DOGE')) return price.toFixed(4);
    return price.toFixed(5);
  };

  // Use chart price if available, otherwise fall back to symbol price
  const baseDisplayPrice = chartPrice || symbol.bid || 1.08542;
  const displaySpread = isCrypto ? baseDisplayPrice * 0.001 : 0.00015;
  const currentPrice = tradeDirection === 'buy' ? baseDisplayPrice + displaySpread : baseDisplayPrice;

  return (
    <Card className="bg-slate-900 border-slate-800 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-800 px-4 py-3">
        <h3 className="text-white font-semibold text-sm">{t('terminal.tradingPanel.newOrder')}</h3>
      </div>

      <div className="p-4 space-y-4">
        {/* Buy/Sell Tabs */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setTradeDirection('buy')}
            className={`py-3 rounded-xl font-semibold transition-all ${
              tradeDirection === 'buy'
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            {t('terminal.tradingPanel.buyLong')}
          </button>
          <button
            onClick={() => setTradeDirection('sell')}
            className={`py-3 rounded-xl font-semibold transition-all ${
              tradeDirection === 'sell'
                ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            {t('terminal.tradingPanel.sellShort')}
          </button>
        </div>

        {/* Limit Price */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm text-slate-300 font-medium">{t('terminal.tradingPanel.price')}</label>
            <span className="text-xs text-slate-500">{t('terminal.tradingPanel.market')}: {formatPrice(currentPrice)}</span>
          </div>
          <Input
            type="number"
            step="0.00001"
            value={limitPrice}
            onChange={(e) => setLimitPrice(e.target.value)}
            placeholder={t('terminal.tradingPanel.leaveEmpty')}
            className="bg-slate-800 border-slate-700 text-white font-mono focus:border-emerald-500"
          />
        </div>

        {/* Lot Size */}
        <div className="space-y-2">
          <label className="text-sm text-slate-300 font-medium">{t('terminal.tradingPanel.amount')}</label>
          <div className="relative">
            <Input
              type="number"
              step={isCrypto ? "0.01" : "0.1"}
              min={isCrypto ? "0.0001" : "0.01"}
              value={lotSize}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val) && val > 0) {
                  const decimals = isCrypto ? 4 : 2;
                  setLotSize(parseFloat(val.toFixed(decimals)));
                }
              }}
              className="bg-slate-800 border-slate-700 text-white font-mono focus:border-emerald-500 pr-20"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
              {isCrypto ? symbol.symbol.split('/')[0] : t('terminal.lots')}
            </div>
          </div>
        </div>

        {/* Quick Amount Buttons */}
        <div className="grid grid-cols-5 gap-2">
          {[10, 25, 50, 75, 100].map((percent) => {
            const marginForPercent = accountBalance * (percent / 100);
            const priceForCalc = symbol.bid || 1;
            const cs = isCrypto ? 1 : 100000;
            const calculatedLot = (marginForPercent * leverage) / (cs * priceForCalc);
            
            return (
              <button
                key={percent}
                onClick={() => {
                  setLeveragePercent(percent);
                  const decimals = isCrypto ? 4 : 2;
                  const minLot = isCrypto ? 0.0001 : 0.01;
                  const finalLotSize = Math.max(minLot, Math.min(calculatedLot, maxLotSize));
                  setLotSize(parseFloat(finalLotSize.toFixed(decimals)));
                }}
                className={`py-2 text-xs rounded-lg font-medium transition-all ${
                  leveragePercent === percent
                    ? 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                {percent}%
              </button>
            );
          })}
        </div>

        {/* TP/SL */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-sm text-emerald-400 font-medium">{t('terminal.tradingPanel.takeProfit')}</label>
            <Input
              type="number"
              value={takeProfit}
              onChange={(e) => setTakeProfit(e.target.value)}
              placeholder={t('terminal.tradingPanel.optional')}
              className="bg-slate-800 border-slate-700 text-white font-mono focus:border-emerald-500"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-red-400 font-medium">{t('terminal.tradingPanel.stopLoss')}</label>
            <Input
              type="number"
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
              placeholder={t('terminal.tradingPanel.optional')}
              className="bg-slate-800 border-slate-700 text-white font-mono focus:border-red-500"
            />
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-slate-800/50 rounded-xl p-4 space-y-2.5 border border-slate-700">
          <div className="flex justify-between items-center">
            <span className="text-slate-400 text-sm">{t('terminal.tradingPanel.orderValue')}</span>
            <span className="text-white font-semibold">${calculateOrderValue()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400 text-sm">{t('terminal.tradingPanel.margin')}</span>
            <span className="text-white font-semibold">${calculateMargin()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400 text-sm">{t('terminal.tradingPanel.leverage')}</span>
            <span className="text-emerald-400 font-semibold">1:{leverage}</span>
          </div>
        </div>

        {/* Execute Button */}
        <button
          onClick={handleTrade}
          disabled={isSubmitting}
          className={`w-full py-4 rounded-xl font-bold text-white text-base transition-all active:scale-[0.98] disabled:opacity-50 ${
            tradeDirection === 'buy'
              ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-500/30'
              : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg shadow-red-500/30'
          }`}
        >
          {tradeDirection === 'buy' ? t('terminal.tradingPanel.placeBuyOrder') : t('terminal.tradingPanel.placeSellOrder')}
        </button>

        {/* Market Info */}
        <div className="grid grid-cols-1 gap-3 pt-2">
          <div className="text-center p-2 bg-slate-800 rounded-lg">
            <p className="text-[10px] text-slate-500 uppercase mb-1">{t('terminal.tradingPanel.bid')}</p>
            <p className="text-sm font-mono text-red-400 font-semibold">{formatPrice(symbol.bid)}</p>
          </div>
          <div className="text-center p-2 bg-slate-800/30 rounded-lg">
            <p className="text-[10px] text-slate-500 uppercase mb-1">{t('terminal.tradingPanel.spread')}</p>
            <p className="text-sm font-mono text-slate-300 font-semibold">{symbol.spread}</p>
          </div>
          <div className="text-center p-2 bg-slate-800/30 rounded-lg">
            <p className="text-[10px] text-slate-500 uppercase mb-1">{t('terminal.tradingPanel.ask')}</p>
            <p className="text-sm font-mono text-emerald-400 font-semibold">{formatPrice(symbol.ask)}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}