import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { adminGetTicket, adminGetAllSupportTicketsPaginated } from '@/api/admin';
import TicketSidebar from '@/components/support/TicketSidebar';
import TicketChatPanel from '@/components/support/TicketChatPanel';
import { Sheet, SheetContent } from '@/components/ui/sheet';

export default function AdminTicketChat() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: ticket, isLoading: ticketLoading } = useQuery({
    queryKey: ['admin-ticket', id],
    queryFn: () => adminGetTicket(id),
    enabled: !!id,
  });

  const { data: ticketsResponse, isLoading: listLoading } = useQuery({
    queryKey: ['admin-support-tickets'],
    queryFn: () => adminGetAllSupportTicketsPaginated(1, 100),
  });

  const rawTickets = ticketsResponse?.data ?? ticketsResponse;
  const tickets = Array.isArray(rawTickets) ? rawTickets : [];

  const handleSelectTicket = (ticketId) => {
    navigate(`/AdminSupport/tickets/${ticketId}`);
    setSidebarOpen(false);
  };

  const sidebarContent = (
    <TicketSidebar
      tickets={tickets}
      activeTicketId={id}
      onSelectTicket={handleSelectTicket}
      isLoading={listLoading}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      statusFilter={statusFilter}
      onStatusFilterChange={setStatusFilter}
    />
  );

  return (
    <div className="flex h-[calc(100vh-8rem)] -m-4 lg:-m-8 rounded-lg overflow-hidden border border-border bg-card">
      {/* Desktop sidebar */}
      <div className="hidden lg:block w-[340px] shrink-0">
        {sidebarContent}
      </div>

      {/* Mobile sidebar drawer */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-[340px] bg-card">
          {sidebarContent}
        </SheetContent>
      </Sheet>

      {/* Chat panel */}
      {ticketLoading ? (
        <div className="flex-1 flex items-center justify-center bg-background">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <TicketChatPanel
          ticket={ticket}
          onToggleSidebar={() => setSidebarOpen(true)}
          showSidebarToggle
        />
      )}
    </div>
  );
}
