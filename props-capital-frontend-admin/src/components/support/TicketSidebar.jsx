import { useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import StatusBadge from '@/components/shared/StatusBadge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const mapStatus = (s) => {
  const map = {
    OPEN: 'open',
    IN_PROGRESS: 'in_progress',
    RESOLVED: 'resolved',
    CLOSED: 'closed',
    WAITING_FOR_ADMIN: 'waiting_for_admin',
    WAITING_FOR_TRADER: 'waiting_for_trader',
  };
  return map[s] || s?.toLowerCase() || 'open';
};

const getUserName = (user, ticket) => {
  if (user) {
    const p = user.profile;
    if (p?.firstName || p?.lastName) return [p.firstName, p.lastName].filter(Boolean).join(' ');
    return user.email || 'N/A';
  }
  if (ticket?.guestName || ticket?.guestEmail) {
    return `${ticket.guestName || ticket.guestEmail} (Guest)`;
  }
  return 'Guest';
};

function TicketItem({ ticket, isActive, onClick }) {
  const lastMsg = ticket.messages?.[0];
  const preview = lastMsg?.message
    ? lastMsg.message.length > 60 ? lastMsg.message.slice(0, 60) + '...' : lastMsg.message
    : ticket.message?.slice(0, 60) || '';

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-3 border-b border-border transition-colors hover:bg-accent/50 ${
        isActive ? 'bg-accent border-l-2 border-l-amber-500' : 'border-l-2 border-l-transparent'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-foreground line-clamp-1 flex-1">{ticket.subject}</p>
        <StatusBadge status={mapStatus(ticket.status)} className="shrink-0 !text-[9px] !px-1.5" />
      </div>
      <p className="text-xs text-muted-foreground mt-0.5">{getUserName(ticket.user, ticket)}</p>
      {preview && (
        <p className="text-xs text-muted-foreground/70 mt-1 line-clamp-1">{preview}</p>
      )}
      <p className="text-[10px] text-muted-foreground/50 mt-1">
        {ticket.createdAt
          ? formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })
          : ''}
      </p>
    </button>
  );
}

export default function TicketSidebar({
  tickets,
  activeTicketId,
  onSelectTicket,
  isLoading,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}) {
  const filtered = useMemo(() => {
    if (!tickets) return [];
    return tickets.filter((t) => {
      const q = searchQuery?.toLowerCase() || '';
      const matchesSearch =
        !q ||
        t.subject?.toLowerCase().includes(q) ||
        getUserName(t.user, t)?.toLowerCase().includes(q) ||
        t.user?.email?.toLowerCase().includes(q) ||
        t.guestEmail?.toLowerCase().includes(q) ||
        t.guestName?.toLowerCase().includes(q);
      const matchesStatus =
        !statusFilter || statusFilter === 'all' || mapStatus(t.status) === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [tickets, searchQuery, statusFilter]);

  return (
    <div className="flex flex-col h-full bg-card border-r border-border">
      <div className="p-3 space-y-2 border-b border-border shrink-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search tickets..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8 h-8 bg-muted border-border text-foreground placeholder:text-muted-foreground text-xs"
          />
        </div>
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="h-8 bg-muted border-border text-foreground text-xs">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border text-foreground">
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="waiting_for_admin">Waiting for Admin</SelectItem>
            <SelectItem value="waiting_for_trader">Waiting for Trader</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="p-3 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-full" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">No tickets found</div>
        ) : (
          filtered.map((ticket) => (
            <TicketItem
              key={ticket.id}
              ticket={ticket}
              isActive={ticket.id === activeTicketId}
              onClick={() => onSelectTicket(ticket.id)}
            />
          ))
        )}
      </ScrollArea>
    </div>
  );
}
