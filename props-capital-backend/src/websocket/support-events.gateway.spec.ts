import {
  SupportEventsGateway,
  SupportMessagePayload,
} from './support-events.gateway';

/**
 * These tests pin down the contract that real-time emit is a *best-effort side
 * effect*: a missing/unhealthy Socket.IO server must NEVER throw back into the
 * caller. Ticket creation commits the row first and only then emits, so a throw
 * here turns an already-saved ticket into an HTTP 500 ("Internal server error")
 * for the user — the exact bug seen in the support chat widget.
 */
describe('SupportEventsGateway emit resilience', () => {
  const gateway = new SupportEventsGateway(null as any, null as any);

  const payload: SupportMessagePayload = {
    id: 'msg_1',
    ticketId: 'tkt_1',
    senderType: 'TRADER',
    senderId: null,
    message: 'hello',
    createdAt: new Date(),
  };

  it('emitNewMessage does not throw when the server is not initialized', () => {
    (gateway as any).server = undefined;
    expect(() => gateway.emitNewMessage('tkt_1', payload)).not.toThrow();
  });

  it('emitStatusChanged does not throw when the server is not initialized', () => {
    (gateway as any).server = undefined;
    expect(() => gateway.emitStatusChanged('tkt_1', 'OPEN')).not.toThrow();
  });

  it('emitTicketsUpdated does not throw when the server is not initialized', () => {
    (gateway as any).server = undefined;
    expect(() => gateway.emitTicketsUpdated()).not.toThrow();
  });

  it('swallows errors thrown by the underlying socket server', () => {
    (gateway as any).server = {
      to: () => {
        throw new Error('socket boom');
      },
    };
    expect(() => gateway.emitNewMessage('tkt_1', payload)).not.toThrow();
  });

  it('still emits normally when the server is healthy', () => {
    const emit = jest.fn();
    const to = jest.fn().mockReturnValue({ emit });
    (gateway as any).server = { to };

    gateway.emitNewMessage('tkt_1', payload);

    expect(to).toHaveBeenCalledWith('ticket:tkt_1');
    expect(emit).toHaveBeenCalledWith(
      'ticket:newMessage',
      expect.objectContaining({ id: 'msg_1', ticketId: 'tkt_1' }),
    );
  });
});
