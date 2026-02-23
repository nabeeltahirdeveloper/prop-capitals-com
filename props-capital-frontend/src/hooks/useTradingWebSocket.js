import { useEffect, useRef, useState, useCallback } from "react";
import socket, { reconnectSocketWithToken } from "@/lib/socket";

/**
 * Custom hook to manage WebSocket connection for trading events.
 * Uses the shared singleton socket from lib/socket.js to avoid duplicate connections.
 */
export function useTradingWebSocket({
  accountId,
  onPositionClosed,
  onAccountStatusChange,
  onAccountUpdate,
}) {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [connectionStatus, setConnectionStatus] = useState(
    socket.connected ? "connected" : "disconnected"
  );
  const subscribedAccountRef = useRef(null);

  // Keep callback refs up to date without re-registering listeners on every render
  const onPositionClosedRef = useRef(onPositionClosed);
  const onAccountStatusChangeRef = useRef(onAccountStatusChange);
  const onAccountUpdateRef = useRef(onAccountUpdate);

  useEffect(() => { onPositionClosedRef.current = onPositionClosed; }, [onPositionClosed]);
  useEffect(() => { onAccountStatusChangeRef.current = onAccountStatusChange; }, [onAccountStatusChange]);
  useEffect(() => { onAccountUpdateRef.current = onAccountUpdate; }, [onAccountUpdate]);

  // Register listeners once on mount, clean up on unmount
  useEffect(() => {
    const onConnect = () => {
      setIsConnected(true);
      setConnectionStatus("connected");
      // Resubscribe to account after reconnect
      const currentAccountId = subscribedAccountRef.current;
      if (currentAccountId) {
        socket.emit("subscribe:account", { accountId: currentAccountId });
      }
    };

    const onDisconnect = () => {
      setIsConnected(false);
      setConnectionStatus("disconnected");
    };

    const onConnectError = () => {
      setIsConnected(false);
      setConnectionStatus("reconnecting");
    };

    const onPositionClosedHandler = (event) => {
      if (onPositionClosedRef.current) onPositionClosedRef.current(event);
    };

    const onAccountStatusChangedHandler = (event) => {
      if (onAccountStatusChangeRef.current) onAccountStatusChangeRef.current(event);
    };

    const onAccountUpdateHandler = (event) => {
      if (onAccountUpdateRef.current) onAccountUpdateRef.current(event);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("position:closed", onPositionClosedHandler);
    socket.on("account:status-changed", onAccountStatusChangedHandler);
    socket.on("account:update", onAccountUpdateHandler);

    // Sync initial connected state
    if (socket.connected) {
      setIsConnected(true);
      setConnectionStatus("connected");
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("position:closed", onPositionClosedHandler);
      socket.off("account:status-changed", onAccountStatusChangedHandler);
      socket.off("account:update", onAccountUpdateHandler);
    };
  }, []); // Empty deps — listeners registered once, callbacks accessed via refs

  // Handle account subscription when accountId changes
  useEffect(() => {
    if (!accountId) {
      subscribedAccountRef.current = null;
      return;
    }

    const prevAccountId = subscribedAccountRef.current;
    subscribedAccountRef.current = accountId;

    if (!socket.connected) return; // Will auto-subscribe on connect via ref

    if (prevAccountId === accountId) return;

    if (prevAccountId) {
      socket.emit("unsubscribe:account", { accountId: prevAccountId });
    }

    socket.emit("subscribe:account", { accountId });
  }, [accountId]);

  const reconnect = useCallback(() => {
    reconnectSocketWithToken();
  }, []);

  return { isConnected, connectionStatus, reconnect };
}
