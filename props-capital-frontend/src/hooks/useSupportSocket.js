import { useEffect, useRef, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import supportSocket, {
  connectSupportSocket,
  disconnectSupportSocket,
} from '@/lib/supportSocket';

export function useSupportSocket({ ticketId } = {}) {
  const [isConnected, setIsConnected] = useState(supportSocket.connected);
  const queryClient = useQueryClient();
  const subscribedTicketRef = useRef(null);
  const ticketIdRef = useRef(ticketId);
  ticketIdRef.current = ticketId;

  const subscribeToTicket = useCallback((id) => {
    if (!id || !supportSocket.connected) return;
    if (subscribedTicketRef.current === id) return;

    if (subscribedTicketRef.current) {
      supportSocket.emit('unsubscribe:ticket', {
        ticketId: subscribedTicketRef.current,
      });
    }

    supportSocket.emit('subscribe:ticket', { ticketId: id });
    subscribedTicketRef.current = id;
  }, []);

  useEffect(() => {
    connectSupportSocket();

    const onConnect = () => {
      setIsConnected(true);
      if (ticketIdRef.current) {
        subscribedTicketRef.current = null;
        subscribeToTicket(ticketIdRef.current);
      }
    };

    const onDisconnect = () => {
      setIsConnected(false);
      subscribedTicketRef.current = null;
    };

    const onNewMessage = (message) => {
      const msgTicketId = message?.ticketId;
      if (!msgTicketId) return;

      queryClient.setQueryData(
        ['ticket-messages', msgTicketId],
        (old) => {
          const list = Array.isArray(old) ? old : [];
          if (list.some((m) => m.id === message.id)) return old;
          return [...list, message];
        },
      );

      queryClient.invalidateQueries({
        queryKey: ['support-tickets'],
        exact: false,
      });
    };

    const onStatusChanged = ({ ticketId: tid, status }) => {
      if (!tid) return;
      queryClient.invalidateQueries({
        queryKey: ['support-tickets'],
        exact: false,
      });
      queryClient.invalidateQueries({
        queryKey: ['ticket-messages', tid],
      });
    };

    supportSocket.on('connect', onConnect);
    supportSocket.on('disconnect', onDisconnect);
    supportSocket.on('ticket:newMessage', onNewMessage);
    supportSocket.on('ticket:statusChanged', onStatusChanged);

    if (supportSocket.connected) {
      setIsConnected(true);
      subscribedTicketRef.current = null;
      subscribeToTicket(ticketIdRef.current);
    }

    return () => {
      supportSocket.off('connect', onConnect);
      supportSocket.off('disconnect', onDisconnect);
      supportSocket.off('ticket:newMessage', onNewMessage);
      supportSocket.off('ticket:statusChanged', onStatusChanged);

      if (subscribedTicketRef.current) {
        supportSocket.emit('unsubscribe:ticket', {
          ticketId: subscribedTicketRef.current,
        });
        subscribedTicketRef.current = null;
      }

      disconnectSupportSocket();
    };
  }, [queryClient, subscribeToTicket]);

  useEffect(() => {
    subscribeToTicket(ticketId);
  }, [ticketId, subscribeToTicket]);

  return { isConnected };
}
