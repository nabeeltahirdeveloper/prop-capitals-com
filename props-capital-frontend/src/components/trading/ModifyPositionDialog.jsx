import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, X } from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext';

export default function ModifyPositionDialog({
  isOpen,
  onClose,
  position,
  onSave,
  currentPrice
}) {
  const { t } = useTranslation();
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (position) {
      setStopLoss(position.stopLoss?.toString() || '');
      setTakeProfit(position.takeProfit?.toString() || '');
    }
  }, [position]);

  if (!position) return null;

  const formatPrice = (price) => {
    if (!price) return '—';
    if (position.symbol?.includes('JPY')) return price.toFixed(3);
    if (position.symbol?.includes('BTC') || position.symbol?.includes('ETH') || position.symbol?.includes('SOL')) return price.toFixed(2);
    if (position.symbol?.includes('XRP') || position.symbol?.includes('ADA') || position.symbol?.includes('DOGE')) return price.toFixed(4);
    return price.toFixed(5);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        ...position,
        stopLoss: stopLoss ? parseFloat(stopLoss) : null,
        takeProfit: takeProfit ? parseFloat(takeProfit) : null
      });
      // onClose will be called by parent after successful save
      // If there's an error, parent will show toast and keep dialog open
    } catch (error) {
      console.error('Error saving position modification:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const price = currentPrice || position.entryPrice;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${position.type === 'buy' ? 'bg-emerald-500/20' : 'bg-red-500/20'
              }`}>
              {position.type === 'buy'
                ? <TrendingUp className="w-5 h-5 text-emerald-400" />
                : <TrendingDown className="w-5 h-5 text-red-400" />
              }
            </div>
            <div>
              <span>{t('terminal.modifyDialog.title', { symbol: position.symbol })}</span>
              <Badge className={`ml-2 text-xs ${position.type === 'buy'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-red-500/20 text-red-400'
                }`}>
                {t(`terminal.positions.${position.type.toLowerCase()}`)}
              </Badge>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Position Info */}
          <div className="grid grid-cols-3 gap-4 p-3 bg-slate-800/50 rounded-lg text-sm">
            <div>
              <p className="text-slate-500 text-xs">{t('terminal.positions.entry')}</p>
              <p className="text-white font-mono">{formatPrice(position.entryPrice)}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">{t('terminal.positions.current')}</p>
              <p className="text-white font-mono">{formatPrice(price)}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">{t('terminal.modifyDialog.lotSize')}</p>
              <p className="text-white font-mono">{position.lotSize}</p>
            </div>
          </div>

          {/* Take Profit */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-slate-300">{t('terminal.tradingPanel.takeProfit')}</Label>
              {takeProfit && (
                <button
                  onClick={() => setTakeProfit('')}
                  className="text-slate-500 hover:text-slate-300"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                step="any"
                value={takeProfit}
                onChange={(e) => setTakeProfit(e.target.value)}
                placeholder={t('terminal.modifyDialog.enterTP')}
                className="bg-slate-800 border-slate-700 text-white font-mono"
              />
              {takeProfit && price && (
                <span className={`text-xs min-w-[60px] text-right ${(position.type === 'buy' && parseFloat(takeProfit) > price) ||
                    (position.type === 'sell' && parseFloat(takeProfit) < price)
                    ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                  {(((parseFloat(takeProfit) - price) / price) * 100 * (position.type === 'buy' ? 1 : -1)).toFixed(2)}%
                </span>
              )}
            </div>
          </div>

          {/* Stop Loss */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-slate-300">{t('terminal.tradingPanel.stopLoss')}</Label>
              {stopLoss && (
                <button
                  onClick={() => setStopLoss('')}
                  className="text-slate-500 hover:text-slate-300"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                step="any"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                placeholder={t('terminal.modifyDialog.enterSL')}
                className="bg-slate-800 border-slate-700 text-white font-mono"
              />
              {stopLoss && price && (
                <span className={`text-xs min-w-[60px] text-right ${(position.type === 'buy' && parseFloat(stopLoss) < position.entryPrice) ||
                    (position.type === 'sell' && parseFloat(stopLoss) > position.entryPrice)
                    ? 'text-red-400' : 'text-emerald-400'
                  }`}>
                  {(((parseFloat(stopLoss) - price) / price) * 100 * (position.type === 'buy' ? 1 : -1)).toFixed(2)}%
                </span>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-slate-700 text-slate-300"
            disabled={isSaving}
          >
            {t('terminal.cancel')}
          </Button>
          <Button
            onClick={handleSave}
            className="bg-emerald-500 hover:bg-emerald-600"
            disabled={isSaving}
          >
            {isSaving ? t('terminal.modifyDialog.saving') : t('terminal.modifyDialog.saveChanges')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}