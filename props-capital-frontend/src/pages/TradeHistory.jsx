import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { getCurrentUser } from '@/api/auth';
import { getUserAccounts } from '@/api/accounts';
import { getAccountTrades } from '@/api/trades';
import { useTranslation } from '../contexts/LanguageContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DataTable from '../components/shared/DataTable';
import StatsCard from '../components/shared/StatsCard';
import {
  Search,
  Filter,
  Download,
  TrendingUp,
  TrendingDown,
  Clock,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { isForex } from '../utils/instrumentType';

export default function TradeHistory() {
  const { t } = useTranslation();
  const [selectedAccount, setSelectedAccount] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('closed');

  // Get current user
  const { data: user } = useQuery({
    queryKey: ['user', 'me'],
    queryFn: getCurrentUser,
    retry: false,
  });

  // Get user's trading accounts
  const { data: accounts = [] } = useQuery({
    queryKey: ['trading-accounts', user?.userId],
    queryFn: async () => {
      if (!user?.userId) return [];
      try {
        return await getUserAccounts(user.userId);
      } catch (error) {
        console.error('Failed to fetch accounts:', error);
        return [];
      }
    },
    enabled: !!user?.userId,
    retry: false,
  });

  // Get trades for selected account(s)
  const { data: allTrades = [], isLoading } = useQuery({
    queryKey: ['trades', selectedAccount, accounts],
    queryFn: async () => {
      try {
        if (selectedAccount === 'all') {
          // Fetch trades for all accounts
          if (!accounts || accounts.length === 0) return [];
          const tradePromises = accounts.map(account =>
            getAccountTrades(account.id).catch(() => [])
          );
          const allTradesArrays = await Promise.all(tradePromises);
          return allTradesArrays.flat();
        } else {
          return await getAccountTrades(selectedAccount);
        }
      } catch (error) {
        console.error('Failed to fetch trades:', error);
        return [];
      }
    },
    enabled: accounts.length > 0,
    retry: false,
  });

  // Map backend trades to frontend format
  const mappedTrades = (allTrades || []).map(trade => ({
    id: trade.id,
    ticket: trade.id.slice(0, 8),
    symbol: trade.symbol,
    type: trade.type?.toLowerCase() || 'buy',
    lot_size: trade.volume || 0,
    open_price: trade.openPrice,
    close_price: trade.closePrice,
    profit: trade.profit || 0,
    commission: 0, // Backend doesn't have commission field
    swap: 0, // Backend doesn't have swap field
    open_time: trade.openedAt,
    close_time: trade.closedAt,
    status: trade.closePrice ? 'closed' : 'open',
  }));

  // Use only real trades from backend (no mock data fallback)
  const displayTrades = mappedTrades;

  // Filter trades
  const filteredTrades = displayTrades.filter(trade => {
    const matchesSearch = trade.symbol?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trade.ticket?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || trade.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || trade.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  // Calculate stats
  const closedTrades = displayTrades.filter(t => t.status === 'closed');
  const totalProfit = closedTrades.reduce((sum, t) => sum + (t.profit || 0), 0);
  const winningTrades = closedTrades.filter(t => t.profit > 0);
  const losingTrades = closedTrades.filter(t => t.profit < 0);
  const winRate = closedTrades.length > 0 ? ((winningTrades.length / closedTrades.length) * 100).toFixed(2) : 0;
  const avgWin = winningTrades.length > 0 ? winningTrades.reduce((sum, t) => sum + t.profit, 0) / winningTrades.length : 0;
  const avgLoss = losingTrades.length > 0 ? Math.abs(losingTrades.reduce((sum, t) => sum + t.profit, 0) / losingTrades.length) : 0;

  const columns = [
    {
      header: t('tradeHistory.ticket'),
      accessorKey: 'ticket',
      cell: (row) => <span className="text-slate-300 font-mono text-sm">{row.ticket}</span>
    },
    {
      header: t('tradeHistory.time'),
      accessorKey: 'open_time',
      cell: (row) => (
        <div className="text-sm">
          <p className="text-white">{format(new Date(row.open_time), 'MMM d, HH:mm')}</p>
          {row.close_time && (
            <p className="text-slate-500 text-xs">{format(new Date(row.close_time), 'MMM d, HH:mm')}</p>
          )}
        </div>
      )
    },
    {
      header: t('tradeHistory.symbol'),
      accessorKey: 'symbol',
      cell: (row) => <span className="text-white font-semibold">{row.symbol}</span>
    },
    {
      header: t('tradeHistory.type'),
      accessorKey: 'type',
      cell: (row) => (
        <div className="flex items-center gap-1">
          {row.type === 'buy' ? (
            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
          ) : (
            <ArrowDownRight className="w-4 h-4 text-red-400" />
          )}
          <span className={`px-2 py-1 rounded text-xs font-medium ${row.type === 'buy' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
            }`}>
            {row.type === 'buy' ? t('tradeHistory.buy').toUpperCase() : t('tradeHistory.sell').toUpperCase()}
          </span>
        </div>
      )
    },
    {
      header: t('tradeHistory.lots'),
      accessorKey: 'lot_size',
      cell: (row) => <span className="text-slate-300">{row.lot_size?.toFixed(2)}</span>
    },
    {
      header: t('tradeHistory.openPrice'),
      accessorKey: 'open_price',
      cell: (row) => <span className="text-slate-300 font-mono">{row.open_price?.toFixed(2)}</span>
    },
    {
      header: t('tradeHistory.closePrice'),
      accessorKey: 'close_price',
      cell: (row) => <span className="text-slate-300 font-mono">{row.close_price ? row.close_price.toFixed(2) : '-'}</span>
    },
    {
      header: t('tradeHistory.commSwap'),
      accessorKey: 'commission',
      cell: (row) => (
        <span className="text-slate-400 text-sm">
          ${((row.commission || 0) + (row.swap || 0)).toFixed(2)}
        </span>
      )
    },
    {
      header: t('tradeHistory.profit'),
      accessorKey: 'profit',
      cell: (row) => (
        <span className={`font-bold ${row.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {row.profit >= 0 ? '+' : ''}${row.profit?.toFixed(2)}
        </span>
      )
    },
    {
      header: t('tradeHistory.status'),
      accessorKey: 'status',
      cell: (row) => (
        <Badge className={row.status === 'open' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-slate-500/20 text-slate-400 border-slate-500/30'}>
          {row.status === 'open' ? t('tradeHistory.open') : t('tradeHistory.closed')}
        </Badge>
      )
    },
  ];

  // Show loading state while fetching accounts
  if (isLoading && accounts.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <Skeleton className="h-8 w-64 bg-slate-800" />
          <Skeleton className="h-10 w-40 bg-slate-800" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24 bg-slate-800" />
          ))}
        </div>
        <Skeleton className="h-96 bg-slate-800" />
      </div>
    );
  }

  // Show empty state if user has no accounts
  if (!isLoading && accounts.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">{t('tradeHistory.title')}</h1>
            <p className="text-slate-400">{t('tradeHistory.subtitle')}</p>
          </div>
        </div>
        <Card className="bg-slate-900 border-slate-800 p-12 text-center">
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-8 h-8 text-slate-600" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">{t('tradeHistory.noAccounts')}</h3>
          <p className="text-slate-400">{t('tradeHistory.noAccountsDesc')}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">{t('tradeHistory.title')}</h1>
            <p className="text-slate-400">{t('tradeHistory.subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedAccount} onValueChange={setSelectedAccount}>
            <SelectTrigger className="w-full md:w-[280px] bg-slate-900 border-slate-800 text-white">
              <SelectValue placeholder={t('tradeHistory.selectAccount')} />
            </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-white [&>svg]:text-white">
              <SelectItem value="all"   className="text-white
                          hover:text-white
                          focus:text-white
                          data-[highlighted]:text-white
                          data-[state=checked]:text-white
                          hover:bg-slate-700
                          focus:bg-slate-700">{t('tradeHistory.allAccounts')}</SelectItem>
              {accounts.map((acc) => {
                const accInitialBalance = acc.initial_balance || acc.initialBalance || 0;
                const accPlatform = acc.platform || 'MT5';
                // Normalize phase value - handle uppercase, lowercase, and mixed case
                const rawPhase = acc.current_phase || acc.phase || 'phase1';
                const accPhaseMap = {
                  'PHASE1': 'phase1',
                  'PHASE2': 'phase2',
                  'FUNDED': 'funded',
                  'FAILED': 'failed',
                  'phase1': 'phase1',
                  'phase2': 'phase2',
                  'funded': 'funded',
                  'failed': 'failed'
                };
                const accPhase = accPhaseMap[rawPhase] || rawPhase?.toLowerCase() || 'phase1';
                const phaseTranslations = {
                  'phase1': t('tradeHistory.phase1'),
                  'phase2': t('tradeHistory.phase2'),
                  'funded': t('tradeHistory.funded'),
                  'failed': t('tradeHistory.failed')
                };
                return (
                  <SelectItem key={acc.id} value={acc.id} className=" text-white
                          hover:text-white
                          focus:text-white
                          data-[highlighted]:text-white
                          data-[state=checked]:text-white
                          hover:bg-slate-700
                          focus:bg-slate-700">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">${accInitialBalance.toLocaleString()}</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-400 text-xs">{accPlatform}</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-xs text-emerald-400">{phaseTranslations[accPhase] || accPhase}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <Button variant="outline" className="border-slate-700 bg-slate-800/50 text-white hover:bg-slate-700 w-full md:w-auto hover:text-white">
            <Download className="w-4 h-4 mr-2" />
            {t('tradeHistory.export')}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        <StatsCard
          title={t('tradeHistory.totalTrades')}
          value={closedTrades.length}
          icon={BarChart3}
          gradient="from-blue-500 to-cyan-500"
        />
        <StatsCard
          title={t('tradeHistory.winRate')}
          value={`${winRate}%`}
          icon={TrendingUp}
          gradient="from-emerald-500 to-teal-500"
        />
        <StatsCard
          title={t('tradeHistory.totalProfit')}
          value={`${totalProfit >= 0 ? '+' : ''}$${totalProfit.toFixed(0)}`}
          icon={totalProfit >= 0 ? TrendingUp : TrendingDown}
          gradient={totalProfit >= 0 ? "from-emerald-500 to-green-500" : "from-red-500 to-pink-500"}
        />
        <Card className="bg-slate-900 border-slate-800 p-3 sm:p-4">
          <p className="text-sm text-slate-400 mb-1">{t('tradeHistory.avgWin')}</p>
          <p className="text-lg sm:text-xl font-bold text-emerald-400">+${avgWin.toFixed(0)}</p>
        </Card>
        <Card className="bg-slate-900 border-slate-800 p-3 sm:p-4">
          <p className="text-sm text-slate-400 mb-1">{t('tradeHistory.avgLoss')}</p>
          <p className="text-lg sm:text-xl font-bold text-red-400">-${avgLoss.toFixed(0)}</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-slate-900 border-slate-800 p-4">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="relative flex-1 w-full md:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder={t('tradeHistory.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 w-full"
            />
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Tabs value={typeFilter} onValueChange={setTypeFilter}>
              <TabsList className="bg-slate-800 border border-slate-700">
                <TabsTrigger value="all" className="data-[state=active]:bg-slate-700 text-slate-300 data-[state=active]:text-white px-2 sm:px-3 ">{t('tradeHistory.all')}</TabsTrigger>
                <TabsTrigger value="buy" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 text-slate-300 px-2 sm:px-3">{t('tradeHistory.buy')}</TabsTrigger>
                <TabsTrigger value="sell" className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400 text-slate-300 px-2 sm:px-3">{t('tradeHistory.sell')}</TabsTrigger>
              </TabsList>
            </Tabs>

            <Tabs value={statusFilter} onValueChange={setStatusFilter}>
              <TabsList className="bg-slate-800 border border-slate-700">
                <TabsTrigger value="all" className="data-[state=active]:bg-slate-700 text-slate-300 data-[state=active]:text-white px-2 sm:px-3 ">{t('tradeHistory.all')}</TabsTrigger>
                <TabsTrigger value="open" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400 text-slate-300 px-2 sm:px-3">{t('tradeHistory.open')}</TabsTrigger>
                <TabsTrigger value="closed" className="data-[state=active]:bg-slate-700 text-slate-300 data-[state=active]:text-white px-2 sm:px-3 ">{t('tradeHistory.closed')}</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </Card>

      {/* Open Positions */}
      {displayTrades.filter(t => t.status === 'open').length > 0 && (
        <Card className="bg-slate-900 border-slate-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              {t('tradeHistory.openPositions')}
            </h3>
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
              {displayTrades.filter(t => t.status === 'open').length} {t('tradeHistory.active')}
            </Badge>
          </div>
          <div className="space-y-3">
            {displayTrades.filter(t => t.status === 'open').map((trade) => (
              <div key={trade.id} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${trade.type === 'buy' ? 'bg-emerald-500/20' : 'bg-red-500/20'
                      }`}>
                      {trade.type === 'buy' ? (
                        <ArrowUpRight className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <ArrowDownRight className="w-5 h-5 text-red-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-semibold">{trade.symbol}</span>
                        <Badge className={trade.type === 'buy' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}>
                          {trade.type === 'buy' ? t('tradeHistory.buy').toUpperCase() : t('tradeHistory.sell').toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-400">
                        {trade.lot_size?.toFixed(2)} {t('tradeHistory.lots')} @ {trade.open_price}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-xl font-bold ${trade.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {trade.profit >= 0 ? '+' : ''}${trade.profit?.toFixed(2)}
                    </p>
                    {!isForex(trade.symbol) && trade.close_price && (
                      <p className="text-sm text-slate-400">
                        {t('tradeHistory.priceChange')}: {trade.close_price >= trade.open_price ? '+' : ''}{(trade.close_price - trade.open_price).toFixed(5)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Trade History Table */}
      <Card className="bg-slate-900 border-slate-800 p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">{t('tradeHistory.closedTrades')}</h3>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Clock className="w-4 h-4" />
            {t('tradeHistory.showing')} {filteredTrades.filter(t => t.status === 'closed').length} {t('tradeHistory.trades')}
          </div>
        </div>
        {/* Horizontal scroll wrapper for mobile */}
        <div className="overflow-x-auto -mx-4 md:mx-0">
          <div className="min-w-full inline-block align-middle">
            <DataTable
              columns={columns}
              data={filteredTrades.filter(t => statusFilter === 'all' || t.status === statusFilter)}
              isLoading={isLoading}
              emptyMessage={t('tradeHistory.noTradesFound')}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}