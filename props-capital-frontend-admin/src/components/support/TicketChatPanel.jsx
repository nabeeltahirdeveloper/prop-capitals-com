import { useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { adminGetTicketMessages, adminSendTicketMessage, adminUpdateTicketStatus } from '@/api/admin';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import StatusBadge from '@/components/shared/StatusBadge';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import { ArrowLeft, Menu, X as XIcon } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useSupportSocket } from '@/hooks/useSupportSocket';

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

export default function TicketChatPanel({ ticket, onToggleSidebar, showSidebarToggle }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const messagesEndRef = useRef(null);
  const ticketId = ticket?.id;

  const isClosed = ticket?.status === 'CLOSED';

  useSupportSocket({ ticketId });

  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['ticket-messages', ticketId],
    queryFn: () => adminGetTicketMessages(ticketId),
    enabled: !!ticketId,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMutation = useMutation({
    mutationFn: (message) => adminSendTicketMessage(ticketId, message),
    onMutate: async (message) => {
      await queryClient.cancelQueries({ queryKey: ['ticket-messages', ticketId] });
      const previous = queryClient.getQueryData(['ticket-messages', ticketId]);
      queryClient.setQueryData(['ticket-messages', ticketId], (old = []) => [
        ...old,
        {
          id: `optimistic-${Date.now()}`,
          ticketId,
          senderType: 'ADMIN',
          senderId: null,
          message,
          createdAt: new Date().toISOString(),
        },
      ]);
      return { previous };
    },
    onError: (_err, _msg, context) => {
      queryClient.setQueryData(['ticket-messages', ticketId], context?.previous);
      toast({
        title: 'Send Failed',
        description: 'Could not send message. Please try again.',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-messages', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['admin-ticket', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['admin-support-tickets'] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ status }) => adminUpdateTicketStatus(ticketId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ticket', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['admin-support-tickets'] });
      toast({ title: 'Status Updated' });
    },
  });

  if (!ticket) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Select a ticket to view the conversation</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background min-w-0">
      {/* Header */}
      <div className="shrink-0 border-b border-border bg-card px-4 py-3 flex items-center gap-3">
        {showSidebarToggle && (
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-8 w-8 shrink-0"
            onClick={onToggleSidebar}
          >
            <Menu className="w-4 h-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => navigate('/AdminSupport')}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{ticket.subject}</p>
          <p className="text-xs text-muted-foreground truncate">
            {getUserName(ticket.user, ticket)} {ticket.user?.email ? `· ${ticket.user.email}` : ticket.guestEmail ? `· ${ticket.guestEmail}` : ''}
          </p>
        </div>
        <StatusBadge status={mapStatus(ticket.status)} />
        {!isClosed && (
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-7 border-border"
            onClick={() => statusMutation.mutate({ status: 'CLOSED' })}
            disabled={statusMutation.isPending}
          >
            <XIcon className="w-3 h-3 mr-1" />
            Close
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {messagesLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                <Skeleton className="h-12 w-48 rounded-2xl" />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-muted-foreground">No messages yet</p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg.message}
              senderType={msg.senderType}
              createdAt={msg.createdAt}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <MessageInput
        onSend={(msg) => sendMutation.mutate(msg)}
        disabled={isClosed}
        isPending={sendMutation.isPending}
      />
    </div>
  );
}
