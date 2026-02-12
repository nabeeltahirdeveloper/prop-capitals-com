import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTrading } from '@/contexts/TradingContext';
import { usePrices } from '@/contexts/PriceContext';
import { createTrade } from '@/api/trades';
import { createPendingOrder } from '@/api/pending-orders';
import { useToast } from '@/components/ui/use-toast';
import { useTraderTheme } from './TraderPanelLayout';
import MarketWatchlist from '../trading/MarketWatchlist';
import TradingPanel from '../trading/TradingPanel';
import TradingChart from '../trading/TradingChart';
import TopBar from '@/components/trading/Topbar';
import { Card } from '@/components/ui/card';
import { LayoutGrid, Maximize2, Settings, Monitor, Activity, ShieldCheck, Zap, Layers, BarChart3 } from 'lucide-react';
import { useChallenges } from '@/contexts/ChallengesContext';

const PT5Terminal = () => {
  const { isDark: globalIsDark } = useTraderTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { 
    selectedSymbol, 
    setSelectedSymbol, 
    selectedTimeframe, 
    setSelectedTimeframe, 
    chartType, 
    setChartType 
  } = useTrading();
  const { selectedChallenge: currentAccount } = useChallenges();
  
  const { prices: unifiedPrices, lastUpdate: pricesLastUpdate } = usePrices();

  // use the global theme instead of forcing dark
  const isDark = globalIsDark;

  const termColors = {
    accent: '#10b981',
    accentGlow: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)'
  };

  // Enrich selectedSymbol with real-time prices
  const enrichedSelectedSymbol = useMemo(() => {
    if (!selectedSymbol?.symbol) return selectedSymbol;
    const priceData = unifiedPrices[selectedSymbol.symbol];
    if (priceData && typeof priceData === "object" && priceData.bid !== undefined && priceData.ask !== undefined) {
      const spread = ((priceData.ask - priceData.bid) * 10000).toFixed(1);
      return {
        ...selectedSymbol,
        bid: priceData.bid,
        ask: priceData.ask,
        spread: parseFloat(spread),
      };
    }
    return selectedSymbol;
  }, [selectedSymbol, unifiedPrices]);

  const [isExecutingTrade, setIsExecutingTrade] = useState(false);
  const accountId = currentAccount?.id;

  const handleExecuteTrade = async (tradeParams) => {
    if (!accountId) {
      toast({ title: "No account selected", variant: "destructive" });
      return;
    }
    if (isExecutingTrade) return;

    setIsExecutingTrade(true);
    try {
      const payload = {
        accountId,
        symbol: tradeParams.symbol,
        type: tradeParams.type.toUpperCase(),
        volume: parseFloat(tradeParams.lotSize),
        openPrice: tradeParams.entryPrice,
        stopLoss: tradeParams.stopLoss ? parseFloat(tradeParams.stopLoss) : null,
        takeProfit: tradeParams.takeProfit ? parseFloat(tradeParams.takeProfit) : null,
      };

      if (tradeParams.orderType === 'market') {
        await createTrade(payload);
        toast({ title: "Trade executed successfully" });
      } else {
        await createPendingOrder({
          tradingAccountId: accountId,
          ...payload,
          orderType: tradeParams.orderType === 'limit' ? 'LIMIT' : 'STOP',
          price: tradeParams.entryPrice
        });
        toast({ title: "Pending order created" });
      }
      
      queryClient.invalidateQueries({ queryKey: ['trades', accountId] });
      queryClient.invalidateQueries({ queryKey: ['pendingOrders', accountId] });
    } catch (error) {
      toast({
        title: "Trade failed",
        description: error.response?.data?.message || error.message,
        variant: "destructive"
      });
    } finally {
      setIsExecutingTrade(false);
    }
  };

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex flex-col gap-4 animate-in zoom-in-95 duration-500 p-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>
      
      {/* Functional Account Metrics Bar - Theme Aware */}
      <div className={`flex flex-wrap items-center justify-between px-4 py-2 rounded-xl shadow-sm border backdrop-blur-sm transition-all duration-300 ${
        isDark ? 'bg-slate-900/60 border-white/5 text-slate-200' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.4)]`} />
            <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>PT5 Engine</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-5 md:gap-8">
            <div className="flex flex-col items-center md:items-start group">
              <span className={`text-[8px] uppercase font-bold tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'} group-hover:text-emerald-500 transition-colors`}>Balance</span>
              <span className={`text-xs font-mono font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>${currentAccount?.currentBalance?.toLocaleString() || '0'}</span>
            </div>
            <div className="flex flex-col items-center md:items-start group">
              <span className={`text-[8px] uppercase font-bold tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'} group-hover:text-blue-500 transition-colors`}>Equity</span>
              <span className={`text-xs font-mono font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>${currentAccount?.currentBalance?.toLocaleString() || '0'}</span>
            </div>
            <div className="flex flex-col items-center md:items-start group">
              <span className={`text-[8px] uppercase font-bold tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Used Margin</span>
              <span className={`text-xs font-mono font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>$0.00</span>
            </div>
            <div className="flex flex-col items-center md:items-start group">
              <span className={`text-[8px] uppercase font-bold tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>P/L (24h)</span>
              <span className="text-xs font-mono font-black text-emerald-500">+$0.00</span>
            </div>
        </div>

        <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded bg-black/10 border border-white/5">
           <Zap className={`w-3 h-3 ${isDark ? 'text-amber-400' : 'text-amber-500'}`} />
           <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">High Performance</span>
        </div>
      </div>

      {/* Main Terminal Workspace - Synchronized Height (Reduced) */}
      <div className="grid grid-cols-12 gap-3 h-[580px] items-stretch">
        
        {/* Left: Market Intelligence Sidebar */}
        <div 
          className={`${sidebarCollapsed ? 'col-span-1' : 'col-span-12 lg:col-span-2'} transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] relative flex flex-col rounded-2xl overflow-hidden shadow-sm border bg-card border-border h-full`}
        >
          <div className={`px-4 py-2.5 border-b flex items-center justify-between transition-colors ${isDark ? 'bg-white/[0.02]' : 'bg-slate-50'}`}>
            {!sidebarCollapsed && (
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg border ${isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50/50 border-emerald-200'}`}>
                  <Activity className={`w-3.5 h-3.5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                </div>
                <span className={`font-bold text-[11px] uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>Watchlist</span>
              </div>
            )}
            <button 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={`p-1.5 rounded-lg transition-all duration-300 group ${isDark ? 'hover:bg-white/10' : 'hover:bg-slate-200/50'}`}
            >
              <LayoutGrid className={`w-3.5 h-3.5 transition-transform group-hover:scale-110 ${sidebarCollapsed ? (isDark ? 'text-emerald-400' : 'text-emerald-600') : 'text-slate-400'}`} />
            </button>
          </div>
          <div className="flex-1 overflow-hidden min-h-0">
            <MarketWatchlist
              onSymbolSelect={setSelectedSymbol}
              selectedSymbol={selectedSymbol}
              headless={true}
            />
          </div>
        </div>

        {/* Center: Advanced Visualization Hub */}
        <div 
          className={`${sidebarCollapsed ? 'col-span-11 lg:col-span-8' : 'col-span-12 lg:col-span-7'} flex flex-col transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] rounded-2xl overflow-hidden shadow-sm border bg-card border-border h-full`}
        >
          {/* Pro TopBar Integrated */}
          <div className={`border-b transition-colors ${isDark ? 'bg-white/[0.02]' : 'bg-slate-50/50'}`}>
            <TopBar
              selectedSymbol={selectedSymbol}
              selectedTimeframe={selectedTimeframe}
              onTimeframeChange={setSelectedTimeframe}
              chartType={chartType}
              onChartTypeChange={setChartType}
              marketWatchOpen={!sidebarCollapsed}
              onToggleMarketWatch={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
          </div>
          
          {/* High-Fi Chart Area */}
          <div className="flex-1 relative overflow-hidden group min-h-0">
            {/* Ambient Background Glows - Subtle and theme-aware */}
            <div className={`absolute top-0 left-1/4 w-1/2 h-1/4 blur-[100px] pointer-events-none ${isDark ? 'bg-emerald-500/5' : 'bg-emerald-500/10'}`} />
            <div className={`absolute bottom-0 right-1/4 w-1/2 h-1/4 blur-[100px] pointer-events-none ${isDark ? 'bg-blue-500/5' : 'bg-blue-500/10'}`} />
            
            <TradingChart
              key={`chart-${selectedSymbol?.symbol}`}
              symbol={enrichedSelectedSymbol}
              onPriceUpdate={() => {}} 
            />
            
            {/* Terminal Watermark Overlay */}
            <div className="absolute bottom-4 left-4 pointer-events-none select-none opacity-20">
               <div className="flex items-center gap-2">
                  <div className={`w-8 h-[1px] ${isDark ? 'bg-slate-500' : 'bg-slate-300'}`} />
                  <span className={`text-[8px] font-black uppercase tracking-[0.4em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>System v2.0</span>
               </div>
            </div>
          </div>
        </div>

        {/* Right: Order Execution Engine */}
        <div 
          className="col-span-12 lg:col-span-3 flex flex-col rounded-2xl overflow-hidden shadow-sm border bg-card border-border h-full"
        >
          <div className={`px-4 py-2.5 border-b flex items-center justify-between transition-colors ${isDark ? 'bg-white/[0.02]' : 'bg-slate-50'}`}>
            <div className="flex items-center gap-2">
               <div className={`p-1.5 rounded-lg border ${isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50/50 border-blue-200'}`}>
                  <Monitor className={`w-3.5 h-3.5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
               </div>
               <span className={`font-bold text-[11px] uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>Execution</span>
            </div>
          </div>
          
          <div className="flex-1 overflow-hidden min-h-0">
            <TradingPanel
              selectedSymbol={enrichedSelectedSymbol}
              accountBalance={currentAccount?.currentBalance || 0}
              onExecuteTrade={handleExecuteTrade}
              disabled={currentAccount?.status !== 'active'}
              chartPrice={enrichedSelectedSymbol?.bid}
              headless={true}
            />
          </div>
          
          {/* Quick Footer Stats */}
          <div className={`px-3 py-2 border-t transition-colors ${isDark ? 'bg-black/20' : 'bg-slate-50/80'}`}>
             <div className="flex justify-between items-center px-1">
                <span className={`text-[8px] font-bold uppercase tracking-tighter ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Engine</span>
                <span className={`text-[8px] font-bold uppercase tracking-tighter flex items-center gap-1 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                   <div className={`w-0.5 h-0.5 rounded-full ${isDark ? 'bg-emerald-400' : 'bg-emerald-600'}`} /> Sync
                </span>
             </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Experience - Fluid Watchlist */}
      <div className="lg:hidden animate-in slide-in-from-bottom-5 duration-700">
         <div 
           className="rounded-2xl overflow-hidden shadow-sm border bg-card border-border"
         >
            <div className={`p-5 border-b flex items-center gap-3 transition-colors ${isDark ? 'bg-white/[0.02]' : 'bg-slate-50'}`}>
               <Activity className={`w-5 h-5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
               <h4 className={`font-bold text-sm uppercase tracking-widest ${isDark ? 'text-white' : 'text-slate-900'}`}>Market Intelligence</h4>
            </div>
            <div className="h-[400px]">
              <MarketWatchlist
                onSymbolSelect={setSelectedSymbol}
                selectedSymbol={selectedSymbol}
                headless={true}
              />
            </div>
         </div>
      </div>

      <style jsx="true">{`
        .custom-pro-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-pro-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-pro-scrollbar::-webkit-scrollbar-thumb {
          background: ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};
          border-radius: 10px;
        }
        .custom-pro-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'};
        }
        
        /* Ensure no gaps from parent cards in light mode */
        :global(.bg-white) .custom-pro-scrollbar {
            background: transparent !important;
        }
      `}</style>
    </div>
  );
};

export default PT5Terminal;
