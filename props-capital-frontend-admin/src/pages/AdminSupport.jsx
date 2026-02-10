import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminGetAllSupportTickets, adminGetSupportStatistics, adminUpdateTicketStatus } from '@/api/admin';
import { useTranslation } from '../../../props-capital-frontend/src/contexts/LanguageContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import DataTable from '../../../props-capital-frontend/src/components/shared/DataTable';
import StatusBadge from '../../../props-capital-frontend/src/components/shared/StatusBadge';
import StatsCard from '../../../props-capital-frontend/src/components/shared/StatsCard';
import {
  Search,
  MessageCircle,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Send
} from 'lucide-react';
import { format } from 'date-fns';

export default function AdminSupport() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [response, setResponse] = useState('');
  const queryClient = useQueryClient();

  // Fetch tickets from backend
  const { data: ticketsData = [], isLoading } = useQuery({
    queryKey: ['admin-support-tickets'],
    queryFn: adminGetAllSupportTickets,
    refetchInterval: 30000, // Real-time updates every 30 seconds
  });

  // Fetch statistics from backend
  const { data: statistics = {} } = useQuery({
    queryKey: ['admin-support-statistics'],
    queryFn: adminGetSupportStatistics,
    refetchInterval: 30000,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => adminUpdateTicketStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['admin-support-statistics'] });
      setSelectedTicket(null);
      setResponse('');
    },
  });

  // Helper function to map backend enum to frontend format
  const mapStatusToFrontend = (status) => {
    const statusMap = {
      'OPEN': 'open',
      'IN_PROGRESS': 'in_progress',
      'RESOLVED': 'resolved',
      'CLOSED': 'closed',
    };
    return statusMap[status] || status.toLowerCase();
  };

  const mapCategoryToFrontend = (category) => {
    return category.toLowerCase();
  };

  const mapPriorityToFrontend = (priority) => {
    return priority.toLowerCase();
  };

  // Map backend ticket data to frontend format
  const displayTickets = useMemo(() => {
    return (ticketsData || []).map(ticket => ({
      id: ticket.id,
      user_id: ticket.user?.email || 'N/A',
      subject: ticket.subject,
      category: mapCategoryToFrontend(ticket.category),
      priority: mapPriorityToFrontend(ticket.priority),
      status: mapStatusToFrontend(ticket.status),
      message: ticket.message,
      created_date: ticket.createdAt,
    }));
  }, [ticketsData]);

  const handleUpdateStatus = (ticket, status) => {
    // Map frontend status to backend enum format
    const statusMap = {
      'open': 'OPEN',
      'in_progress': 'IN_PROGRESS',
      'resolved': 'RESOLVED',
      'closed': 'CLOSED',
    };
    updateMutation.mutate({
      id: ticket.id,
      status: statusMap[status] || status.toUpperCase()
    });
  };

  const handleSendResponse = () => {
    // Update status to resolved
    updateMutation.mutate({
      id: selectedTicket.id,
      status: 'RESOLVED'
    });
  };

  const filteredTickets = displayTickets.filter(ticket => {
    const matchesSearch = ticket.user_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.subject?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const priorityColors = {
    low: 'bg-slate-500/20 text-slate-400',
    medium: 'bg-amber-500/20 text-amber-400',
    high: 'bg-red-500/20 text-red-400'
  };

  const columns = [
    {
      header: t('admin.support.table.ticket'),
      accessorKey: 'subject',
      cell: (row) => (
        <div>
          <p className="text-white font-medium">
            {row.subjectKey ? t(`admin.support.subjects.${row.subjectKey}`, { defaultValue: row.subject }) : row.subject}
          </p>
          <p className="text-xs text-slate-400">{row.user_id}</p>
        </div>
      )
    },
    {
      header: t('admin.support.table.category'),
      accessorKey: 'category',
      cell: (row) => (
        <span className="capitalize">
          {t(`admin.support.category.${row.category}`, { defaultValue: row.category })}
        </span>
      )
    },
    {
      header: t('admin.support.table.priority'),
      accessorKey: 'priority',
      cell: (row) => (
        <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${priorityColors[row.priority]}`}>
          {t(`admin.support.priority.${row.priority}`, { defaultValue: row.priority })}
        </span>
      )
    },
    { header: t('admin.support.table.status'), accessorKey: 'status', cell: (row) => <StatusBadge status={row.status} /> },
    {
      header: t('admin.support.table.created'),
      accessorKey: 'created_date',
      cell: (row) => {
        try {
          if (!row.created_date) return '-';
          const date = new Date(row.created_date);
          if (isNaN(date.getTime())) return '-';
          return format(date, 'MMM d, HH:mm');
        } catch (error) {
          return '-';
        }
      }
    },
    {
      header: t('admin.support.table.actions'),
      accessorKey: 'id',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="text-slate-400 hover:text-white"
            onClick={() => setSelectedTicket(row)}
          >
            <Eye className="w-4 h-4" />
          </Button>
          {row.status === 'open' && (
            <Button
              size="sm"
              variant="ghost"
              className="text-amber-400 hover:text-amber-300"
              onClick={() => handleUpdateStatus(row, 'in_progress')}
            >
              {t('admin.support.actions.take')}
            </Button>
          )}
          {row.status === 'in_progress' && (
            <Button
              size="sm"
              variant="ghost"
              className="text-emerald-400 hover:text-emerald-300"
              onClick={() => handleUpdateStatus(row, 'resolved')}
            >
              {t('admin.support.actions.resolve')}
            </Button>
          )}
        </div>
      )
    },
  ];

  // Use statistics from backend, fallback to calculated values
  const openCount = statistics.openCount ?? displayTickets.filter(t => t.status === 'open').length;
  const inProgressCount = statistics.inProgressCount ?? displayTickets.filter(t => t.status === 'in_progress').length;
  const resolvedCount = statistics.resolvedCount ?? displayTickets.filter(t => t.status === 'resolved').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">{t('admin.support.title')}</h1>
          <p className="text-sm sm:text-base text-slate-400">{t('admin.support.subtitle')}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatsCard
          title={t('admin.support.stats.openTickets')}
          value={openCount}
          icon={AlertCircle}
          gradient="from-red-500 to-pink-500"
        />
        <StatsCard
          title={t('admin.support.stats.inProgress')}
          value={inProgressCount}
          icon={Clock}
          gradient="from-amber-500 to-orange-500"
        />
        <StatsCard
          title={t('admin.support.stats.resolved')}
          value={resolvedCount}
          icon={CheckCircle}
          gradient="from-emerald-500 to-teal-500"
        />
        <StatsCard
          title={t('admin.support.stats.today')}
          value={statistics.todayCount ?? 0}
          icon={MessageCircle}
          gradient="from-blue-500 to-cyan-500"
        />
      </div>

      {/* Filters */}
      <Card className="bg-slate-900 border-slate-800 p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder={t('admin.support.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 text-sm"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[150px] bg-slate-800 border-slate-700 text-white text-sm">
              <SelectValue placeholder={t('admin.support.filter.status')} />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700 text-white">
              <SelectItem value="all" className="text-white">{t('admin.support.filter.allStatus')}</SelectItem>
              <SelectItem value="open" className="text-white">{t('admin.support.filter.open')}</SelectItem>
              <SelectItem value="in_progress" className="text-white">{t('admin.support.filter.inProgress')}</SelectItem>
              <SelectItem value="resolved" className="text-white">{t('admin.support.filter.resolved')}</SelectItem>
              <SelectItem value="closed" className="text-white">{t('admin.support.filter.closed')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Tickets Table */}
      <Card className="bg-slate-900 border-slate-800 p-3 sm:p-4 md:p-6">
        <DataTable
          columns={columns}
          data={filteredTickets}
          isLoading={isLoading}
          emptyMessage={t('admin.support.emptyMessage')}
        />
      </Card>

      {/* Ticket Detail Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="bg-slate-900 border-slate-800 w-[95vw] sm:w-full sm:max-w-2xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-base sm:text-lg md:text-xl">{selectedTicket?.subject}</DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
              <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                <span className="text-xs sm:text-sm text-slate-400">{t('admin.support.dialog.from')}: {selectedTicket.user_id}</span>
                <StatusBadge status={selectedTicket.status} />
                <span className={`px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-medium capitalize ${priorityColors[selectedTicket.priority]}`}>
                  {t(`admin.support.priority.${selectedTicket.priority}`, { defaultValue: selectedTicket.priority })}
                </span>
              </div>

              <div className="bg-slate-800/50 rounded-lg p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{selectedTicket.message}</p>
              </div>

              {selectedTicket.status !== 'closed' && (
                <div className="space-y-3 sm:space-y-4">
                  <Textarea
                    placeholder={t('admin.support.dialog.writeResponse')}
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 text-sm min-h-[100px] sm:min-h-[120px]"
                  />
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <Button
                      variant="outline"
                      className="w-full sm:flex-1 border-slate-700 text-slate-300 hover:text-white order-2 sm:order-1 h-9 sm:h-11"
                      onClick={() => setSelectedTicket(null)}
                    >
                      {t('admin.support.dialog.close')}
                    </Button>
                    <Button
                      className="w-full sm:flex-1 bg-gradient-to-r from-emerald-500 to-cyan-500 order-1 sm:order-2 h-9 sm:h-11"
                      onClick={handleSendResponse}
                      disabled={updateMutation.isPending}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {updateMutation.isPending ? t('admin.support.dialog.sending') : t('admin.support.dialog.sendAndResolve')}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}