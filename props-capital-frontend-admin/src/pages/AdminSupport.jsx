import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminGetAllSupportTickets, adminGetSupportStatistics, adminUpdateTicketStatus } from '@/api/admin';
import { useTranslation } from "../contexts/LanguageContext";
import { useToast } from '@/components/ui/use-toast';
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
import DataTable from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import StatsCard from "@/components/shared/StatsCard";
import {
  Search,
  MessageCircle,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Send,
  MessageSquare,
} from 'lucide-react';
import { format } from 'date-fns';

export default function AdminSupport() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [response, setResponse] = useState('');
  const queryClient = useQueryClient();

  // Fetch tickets from backend
  const { data: ticketsData = [], isLoading } = useQuery({
    queryKey: ['admin-support-tickets'],
    queryFn: adminGetAllSupportTickets,
    refetchInterval: 30000,
  });

  // Fetch statistics from backend
  const { data: statistics = {} } = useQuery({
    queryKey: ['admin-support-statistics'],
    queryFn: adminGetSupportStatistics,
    refetchInterval: 30000,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status, adminReply }) => adminUpdateTicketStatus(id, status, adminReply),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['admin-support-statistics'] });
      setSelectedTicket(null);
      setResponse('');
      toast({
        title: t('admin.support.toast.successTitle') || 'Ticket Updated',
        description: variables.adminReply
          ? t('admin.support.toast.replySent') || 'Reply sent and status updated successfully.'
          : t('admin.support.toast.statusUpdated') || 'Ticket status updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: t('admin.support.toast.errorTitle') || 'Update Failed',
        description: error?.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Helper to build display name: prefer firstName+lastName, fallback to email
  const getUserDisplayName = (user) => {
    if (!user) return 'N/A';
    const profile = user.profile;
    if (profile?.firstName || profile?.lastName) {
      return [profile.firstName, profile.lastName].filter(Boolean).join(' ');
    }
    return user.email || 'N/A';
  };

  // Helper to get user email regardless of profile
  const getUserEmail = (user) => user?.email || 'N/A';

  const mapStatusToFrontend = (status) => {
    const statusMap = {
      'OPEN': 'open',
      'IN_PROGRESS': 'in_progress',
      'RESOLVED': 'resolved',
      'CLOSED': 'closed',
    };
    return statusMap[status] || status?.toLowerCase() || 'open';
  };

  const mapCategoryToFrontend = (category) => category ? category.toLowerCase() : 'other';
  const mapPriorityToFrontend = (priority) => priority ? priority.toLowerCase() : 'medium';

  // Map backend ticket data to frontend format
  const displayTickets = useMemo(() => {
    return (ticketsData || []).map(ticket => ({
      id: ticket.id,
      displayName: getUserDisplayName(ticket.user),
      email: getUserEmail(ticket.user),
      subject: ticket.subject,
      category: mapCategoryToFrontend(ticket.category),
      priority: mapPriorityToFrontend(ticket.priority),
      status: mapStatusToFrontend(ticket.status),
      message: ticket.message,
      adminReply: ticket.adminReply || null,
      repliedAt: ticket.repliedAt || null,
      created_date: ticket.createdAt,
      updated_date: ticket.updatedAt,
    }));
  }, [ticketsData]);

  const handleUpdateStatus = (ticket, status) => {
    const statusMap = {
      'open': 'OPEN',
      'in_progress': 'IN_PROGRESS',
      'resolved': 'RESOLVED',
      'closed': 'CLOSED',
    };
    updateMutation.mutate({
      id: ticket.id,
      status: statusMap[status] || status.toUpperCase(),
    });
  };

  const handleSendResponse = () => {
    if (!response.trim()) return;
    updateMutation.mutate({
      id: selectedTicket.id,
      status: 'RESOLVED',
      adminReply: response.trim(),
    });
  };

  const filteredTickets = displayTickets.filter(ticket => {
    const matchesSearch =
      ticket.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.subject?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const priorityColors = {
    low: 'bg-muted text-muted-foreground border border-border',
    medium: 'bg-amber-50 text-[#d97706] border border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-700',
    high: 'bg-red-50 text-red-600 border border-red-200 dark:bg-red-950/60 dark:text-red-400 dark:border-red-800',
  };

  const getPriorityClass = (priority) =>
    priorityColors[priority] || priorityColors.medium;

  const formatDate = (dateStr) => {
    try {
      if (!dateStr) return '-';
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '-';
      return format(date, 'MMM d, HH:mm');
    } catch {
      return '-';
    }
  };

  const columns = [
    {
      header: t('admin.support.table.ticket'),
      accessorKey: 'subject',
      cell: (row) => (
        <div>
          <p className="text-foreground font-medium line-clamp-1">{row.subject}</p>
          <p className="text-xs text-muted-foreground">{row.displayName}</p>
          <p className="text-xs text-muted-foreground/70">{row.email}</p>
        </div>
      )
    },
    {
      header: t('admin.support.table.category'),
      accessorKey: 'category',
      cell: (row) => (
        <span className="capitalize text-foreground">
          {t(`admin.support.category.${row.category}`, { defaultValue: row.category })}
        </span>
      )
    },
    {
      header: t('admin.support.table.priority'),
      accessorKey: 'priority',
      cell: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getPriorityClass(row.priority)}`}>
          {t(`admin.support.priority.${row.priority}`, { defaultValue: row.priority })}
        </span>
      )
    },
    {
      header: t('admin.support.table.status'),
      accessorKey: 'status',
      cell: (row) => <StatusBadge status={row.status} />
    },
    {
      header: t('admin.support.table.created'),
      accessorKey: 'created_date',
      cell: (row) => formatDate(row.created_date),
    },
    {
      header: t('admin.support.table.actions'),
      accessorKey: 'id',
      cell: (row) => (
        <div className="flex items-center gap-1 flex-wrap">
          <Button
            size="sm"
            variant="ghost"
            className="text-muted-foreground hover:text-foreground h-7 px-2"
            onClick={() => setSelectedTicket(row)}
          >
            <Eye className="w-4 h-4" />
          </Button>
          {row.status === 'open' && (
            <Button
              size="sm"
              variant="ghost"
              className="text-[#d97706] hover:text-amber-600 h-7 px-2 text-xs"
              onClick={() => handleUpdateStatus(row, 'in_progress')}
              disabled={updateMutation.isPending}
            >
              {t('admin.support.actions.take')}
            </Button>
          )}
          {row.status === 'in_progress' && (
            <Button
              size="sm"
              variant="ghost"
              className="text-emerald-500 hover:text-emerald-600 h-7 px-2 text-xs"
              onClick={() => handleUpdateStatus(row, 'resolved')}
              disabled={updateMutation.isPending}
            >
              {t('admin.support.actions.resolve')}
            </Button>
          )}
          {(row.status === 'open' || row.status === 'in_progress' || row.status === 'resolved') && (
            <Button
              size="sm"
              variant="ghost"
              className="text-muted-foreground hover:text-foreground h-7 px-2 text-xs"
              onClick={() => handleUpdateStatus(row, 'closed')}
              disabled={updateMutation.isPending}
            >
              {t('admin.support.actions.close') || 'Close'}
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
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">{t('admin.support.title')}</h1>
          <p className="text-sm sm:text-base text-muted-foreground">{t('admin.support.subtitle')}</p>
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
          gradient="from-[#d97706] to-[#d97706]"
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
      <Card className="bg-card border-border p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t('admin.support.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-muted border-border text-foreground placeholder:text-muted-foreground text-sm"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[150px] bg-muted border-border text-foreground text-sm">
              <SelectValue placeholder={t('admin.support.filter.status')} />
            </SelectTrigger>
            <SelectContent className="bg-card border-border text-foreground">
              <SelectItem value="all" className="text-foreground">{t('admin.support.filter.allStatus')}</SelectItem>
              <SelectItem value="open" className="text-foreground">{t('admin.support.filter.open')}</SelectItem>
              <SelectItem value="in_progress" className="text-foreground">{t('admin.support.filter.inProgress')}</SelectItem>
              <SelectItem value="resolved" className="text-foreground">{t('admin.support.filter.resolved')}</SelectItem>
              <SelectItem value="closed" className="text-foreground">{t('admin.support.filter.closed')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Tickets Table */}
      <Card className="bg-card border-border p-3 sm:p-4 md:p-6">
        <DataTable
          columns={columns}
          data={filteredTickets}
          isLoading={isLoading}
          emptyMessage={t('admin.support.emptyMessage')}
        />
      </Card>

      {/* Ticket Detail Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => { setSelectedTicket(null); setResponse(''); }}>
        <DialogContent className="bg-card border-border w-[95vw] sm:w-full sm:max-w-2xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground text-base sm:text-lg md:text-xl pr-6">
              {selectedTicket?.subject}
            </DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4 mt-3">
              {/* Meta info */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <StatusBadge status={selectedTicket.status} />
                <span className={`px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-medium capitalize ${getPriorityClass(selectedTicket.priority)}`}>
                  {t(`admin.support.priority.${selectedTicket.priority}`, { defaultValue: selectedTicket.priority })}
                </span>
                <span className="text-xs text-muted-foreground capitalize bg-muted px-2 py-0.5 rounded">
                  {t(`admin.support.category.${selectedTicket.category}`, { defaultValue: selectedTicket.category })}
                </span>
              </div>

              {/* User details */}
              <div className="bg-muted/40 rounded-lg p-3 space-y-1">
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{t('admin.support.dialog.from') || 'From'}:</span>{' '}
                  {selectedTicket.displayName}
                </p>
                {selectedTicket.displayName !== selectedTicket.email && (
                  <p className="text-xs text-muted-foreground">{selectedTicket.email}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{t('admin.support.dialog.submitted') || 'Submitted'}:</span>{' '}
                  {formatDate(selectedTicket.created_date)}
                </p>
              </div>

              {/* User message */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">
                  {t('admin.support.dialog.userMessage') || 'User Message'}
                </p>
                <div className="bg-muted/60 rounded-lg p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                    {selectedTicket.message}
                  </p>
                </div>
              </div>

              {/* Previous admin reply (if any) */}
              {selectedTicket.adminReply && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" />
                    {t('admin.support.dialog.previousReply') || 'Previous Admin Reply'}
                    {selectedTicket.repliedAt && (
                      <span className="ml-auto font-normal">{formatDate(selectedTicket.repliedAt)}</span>
                    )}
                  </p>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 sm:p-4">
                    <p className="text-xs sm:text-sm text-emerald-400 leading-relaxed whitespace-pre-wrap">
                      {selectedTicket.adminReply}
                    </p>
                  </div>
                </div>
              )}

              {/* Reply form */}
              {selectedTicket.status !== 'closed' && (
                <div className="space-y-3">
                  <p className="text-xs font-medium text-muted-foreground">
                    {selectedTicket.adminReply
                      ? (t('admin.support.dialog.sendNewReply') || 'Send New Reply')
                      : (t('admin.support.dialog.writeResponse') || 'Write a Response')}
                  </p>
                  <Textarea
                    placeholder={t('admin.support.dialog.writeResponse') || 'Type your response here...'}
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    className="bg-muted border-border text-foreground placeholder:text-muted-foreground text-sm min-h-[100px] sm:min-h-[120px]"
                  />
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <Button
                      variant="outline"
                      className="w-full sm:flex-1 border-border text-foreground hover:bg-accent order-2 sm:order-1 h-9 sm:h-11"
                      onClick={() => { setSelectedTicket(null); setResponse(''); }}
                    >
                      {t('admin.support.dialog.close') || 'Close'}
                    </Button>
                    <Button
                      className="w-full sm:flex-1 bg-gradient-to-r from-[#d97706] to-amber-600 hover:from-amber-600 hover:to-amber-700 order-1 sm:order-2 h-9 sm:h-11 text-white disabled:opacity-50"
                      onClick={handleSendResponse}
                      disabled={updateMutation.isPending || !response.trim()}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {updateMutation.isPending
                        ? (t('admin.support.dialog.sending') || 'Sending...')
                        : (t('admin.support.dialog.sendAndResolve') || 'Send & Resolve')}
                    </Button>
                  </div>
                </div>
              )}

              {/* Closed state */}
              {selectedTicket.status === 'closed' && (
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    className="border-border text-foreground hover:bg-accent h-9"
                    onClick={() => { setSelectedTicket(null); setResponse(''); }}
                  >
                    {t('admin.support.dialog.close') || 'Close'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}