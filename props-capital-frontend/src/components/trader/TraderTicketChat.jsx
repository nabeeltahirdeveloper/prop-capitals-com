import { useState, useRef, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTraderTheme } from './TraderPanelLayout';
import { getCurrentUser } from '@/api/auth';
import {
  getUserTickets,
  getTicket,
  getTicketMessages,
  sendTicketMessage,
} from '@/api/support';
import { useSupportSocket } from '@/hooks/useSupportSocket';
import MessageBubble from '@/components/support/MessageBubble';
import MessageInput from '@/components/support/MessageInput';
import {
  ArrowLeft,
  Menu,
  X as XIcon,
  Search,
  MessageSquare,
  Loader2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';

const STATUS_MAP = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
  WAITING_FOR_ADMIN: 'waiting_for_admin',
  WAITING_FOR_TRADER: 'waiting_for_trader',
};

const STATUS_STYLES = {
  open: { bg: 'bg-amber-500/10', text: 'text-amber-500' },
  in_progress: { bg: 'bg-blue-500/10', text: 'text-blue-500' },
  resolved: { bg: 'bg-emerald-500/10', text: 'text-emerald-500' },
  closed: { bg: 'bg-slate-500/10', text: 'text-slate-400' },
  waiting_for_admin: { bg: 'bg-orange-500/10', text: 'text-orange-400' },
  waiting_for_trader: { bg: 'bg-cyan-500/10', text: 'text-cyan-400' },
};

function StatusBadge({ status }) {
  const mapped = STATUS_MAP[status] || status?.toLowerCase() || 'open';
  const style = STATUS_STYLES[mapped] || STATUS_STYLES.open;
  const label = mapped
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  return (
    <span
      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${style.bg} ${style.text}`}
    >
      {label}
    </span>
  );
}

function TicketSidebarItem({ ticket, isActive, onClick, isDark }) {
  const lastMsg = ticket.messages?.[0];
  const preview = lastMsg?.message
    ? lastMsg.message.length > 50
      ? lastMsg.message.slice(0, 50) + '...'
      : lastMsg.message
    : ticket.message?.slice(0, 50) || '';

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-3 border-b transition-colors ${
        isDark ? 'border-white/5 hover:bg-white/5' : 'border-slate-100 hover:bg-slate-50'
      } ${isActive ? (isDark ? 'bg-white/5 border-l-2 border-l-amber-500' : 'bg-amber-50/50 border-l-2 border-l-amber-500') : 'border-l-2 border-l-transparent'}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p
          className={`text-sm font-medium line-clamp-1 flex-1 ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}
        >
          {ticket.subject}
        </p>
        <StatusBadge status={ticket.status} />
      </div>
      {preview && (
        <p
          className={`text-xs mt-1 line-clamp-1 ${
            isDark ? 'text-gray-500' : 'text-slate-400'
          }`}
        >
          {preview}
        </p>
      )}
      <p
        className={`text-[10px] mt-1 ${isDark ? 'text-gray-600' : 'text-slate-300'}`}
      >
        {ticket.createdAt
          ? formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })
          : ''}
      </p>
    </button>
  );
}

export default function TraderTicketChat() {
  const { id: ticketId } = useParams();
  const navigate = useNavigate();
  const { isDark } = useTraderTheme();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const messagesEndRef = useRef(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: user } = useQuery({
    queryKey: ['user', 'me'],
    queryFn: getCurrentUser,
    retry: false,
  });
  const authUserId = user?.userId || user?.id;

  useSupportSocket({ ticketId });

  const { data: ticketsRaw = [], isLoading: listLoading } = useQuery({
    queryKey: ['support-tickets', authUserId],
    queryFn: () => getUserTickets(authUserId),
    enabled: !!authUserId,
  });

  const tickets = Array.isArray(ticketsRaw) ? ticketsRaw : [];

  const filteredTickets = useMemo(() => {
    if (!searchQuery) return tickets;
    const q = searchQuery.toLowerCase();
    return tickets.filter(
      (t) =>
        t.subject?.toLowerCase().includes(q) ||
        t.message?.toLowerCase().includes(q),
    );
  }, [tickets, searchQuery]);

  const { data: ticket, isLoading: ticketLoading } = useQuery({
    queryKey: ['support-ticket-detail', ticketId],
    queryFn: () => getTicket(ticketId),
    enabled: !!ticketId,
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['ticket-messages', ticketId],
    queryFn: () => getTicketMessages(ticketId),
    enabled: !!ticketId,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const isClosed = ticket?.status === 'CLOSED';

  const sendMutation = useMutation({
    mutationFn: (message) => sendTicketMessage(ticketId, message),
    onMutate: async (message) => {
      await queryClient.cancelQueries({ queryKey: ['ticket-messages', ticketId] });
      const previous = queryClient.getQueryData(['ticket-messages', ticketId]);
      queryClient.setQueryData(['ticket-messages', ticketId], (old = []) => [
        ...old,
        {
          id: `optimistic-${Date.now()}`,
          ticketId,
          senderType: 'TRADER',
          senderId: authUserId,
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
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
    },
  });

  const handleSelectTicket = (id) => {
    navigate(`/traderdashboard/support/tickets/${id}`);
    setSidebarOpen(false);
  };

  const sidebarContent = (
    <div
      className={`flex flex-col h-full ${
        isDark ? 'bg-[#12161d]' : 'bg-white'
      }`}
    >
      <div
        className={`p-3 border-b shrink-0 ${
          isDark ? 'border-white/5' : 'border-slate-200'
        }`}
      >
        <div className="relative">
          <Search
            className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${
              isDark ? 'text-gray-500' : 'text-slate-400'
            }`}
          />
          <input
            type="text"
            placeholder="Search tickets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-8 pr-3 py-2 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
              isDark
                ? 'bg-[#0a0d12] border border-white/10 text-white placeholder-gray-500'
                : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400'
            }`}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {listLoading ? (
          <div className="p-4 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
          </div>
        ) : filteredTickets.length === 0 ? (
          <div
            className={`p-6 text-center text-sm ${
              isDark ? 'text-gray-500' : 'text-slate-400'
            }`}
          >
            No tickets found
          </div>
        ) : (
          filteredTickets.map((t) => (
            <TicketSidebarItem
              key={t.id}
              ticket={t}
              isActive={t.id === ticketId}
              onClick={() => handleSelectTicket(t.id)}
              isDark={isDark}
            />
          ))
        )}
      </div>
    </div>
  );

  const chatPanel = ticketId ? (
    <div
      className={`flex-1 flex flex-col h-full min-w-0 ${
        isDark ? 'bg-[#0a0d12]' : 'bg-slate-50'
      }`}
    >
      {/* Header */}
      <div
        className={`shrink-0 border-b px-4 py-3 flex items-center gap-3 ${
          isDark
            ? 'bg-[#12161d] border-white/10'
            : 'bg-white border-slate-200'
        }`}
      >
        <button
          onClick={() => setSidebarOpen(true)}
          className={`lg:hidden p-1.5 rounded-lg ${
            isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-slate-100 text-slate-500'
          }`}
        >
          <Menu className="w-4 h-4" />
        </button>
        <button
          onClick={() => navigate('/traderdashboard/support')}
          className={`p-1.5 rounded-lg ${
            isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-slate-100 text-slate-500'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-semibold truncate ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            {ticket?.subject || 'Loading...'}
          </p>
        </div>
        {ticket && <StatusBadge status={ticket.status} />}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {messagesLoading || ticketLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
              No messages yet
            </p>
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
  ) : (
    <div
      className={`flex-1 flex items-center justify-center ${
        isDark ? 'bg-[#0a0d12]' : 'bg-slate-50'
      }`}
    >
      <div className="text-center">
        <MessageSquare
          className={`w-10 h-10 mx-auto mb-3 ${
            isDark ? 'text-gray-600' : 'text-slate-300'
          }`}
        />
        <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
          Select a ticket to view the conversation
        </p>
      </div>
    </div>
  );

  return (
    <div
      className={`flex h-[calc(100vh-8rem)] rounded-2xl overflow-hidden border ${
        isDark ? 'bg-[#12161d] border-white/5' : 'bg-white border-slate-200'
      }`}
    >
      {/* Desktop sidebar */}
      <div
        className={`hidden lg:block w-[320px] shrink-0 border-r ${
          isDark ? 'border-white/5' : 'border-slate-200'
        }`}
      >
        {sidebarContent}
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <div
            className={`fixed left-0 top-0 h-full w-[320px] z-50 lg:hidden ${
              isDark ? 'bg-[#12161d]' : 'bg-white'
            }`}
          >
            <div className="flex items-center justify-between p-3 border-b">
              <span
                className={`text-sm font-semibold ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                Tickets
              </span>
              <button
                onClick={() => setSidebarOpen(false)}
                className={`p-1 rounded ${
                  isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-slate-100 text-slate-500'
                }`}
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>
            {sidebarContent}
          </div>
        </>
      )}

      {chatPanel}
    </div>
  );
}
