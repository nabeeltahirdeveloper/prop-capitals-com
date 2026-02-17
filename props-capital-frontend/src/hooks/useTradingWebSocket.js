import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

const WEBSOCKET_URL =
  import.meta.env.VITE_WEBSOCKET_URL || "https://dev-api.prop-capitals.com";

/**
 * Custom hook to manage WebSocket connection for trading events
 * Provides real-time updates for position closures and account status changes
 */
export function useTradingWebSocket({
  accountId,
  onPositionClosed,
  onAccountStatusChange,
  onAccountUpdate,
}) { // Updated hook signature
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("disconnected"); // 'disconnected', 'connecting', 'connected', 'reconnecting'
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const subscribedAccountRef = useRef(null);

  // Get auth token from localStorage
  const getAuthToken = useCallback(() => {
    try {
      // Try 'accessToken' first (common), then 'token', then others
      const token =
        localStorage.getItem("accessToken") ||
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("jwt_token");
      if (!token) {
        console.warn("[WebSocket] No auth token found in localStorage");
        return null;
      }
      return token;
    } catch (error) {
      console.error("[WebSocket] Error getting auth token:", error);
      return null;
    }
  }, []);

  // Connect to WebSocket server
  const connect = useCallback(() => {
    const token = getAuthToken();
    if (!token) {
      console.warn("[WebSocket] Cannot connect without auth token");
      return;
    }

    if (socketRef.current?.connected) {
      console.log("[WebSocket] Already connected");
      return;
    }

    console.log("[WebSocket] Connecting to", WEBSOCKET_URL);
    setConnectionStatus("connecting");

    const socket = io(`${WEBSOCKET_URL}/trading`, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    // Connection events
    socket.on("connect", () => {
      console.log("[WebSocket] Connected:", socket.id);
      setIsConnected(true);
      setConnectionStatus("connected");

      // Subscribe to account updates if accountId is set
      // Use subscribedAccountRef to get current accountId value
      const currentAccountId = subscribedAccountRef.current;
      if (currentAccountId && socket.connected) {
        socket.emit("subscribe:account", { accountId: currentAccountId });
        console.log("[WebSocket] Auto-subscribed to account on connect:", currentAccountId);
      }
    });

    socket.on("disconnect", (reason) => {
      console.log("[WebSocket] Disconnected:", reason);
      setIsConnected(false);
      setConnectionStatus("disconnected");
      // Don't clear subscribedAccountRef here - we want to resubscribe on reconnect
    });

    socket.on("connect_error", (error) => {
      console.error("[WebSocket] Connection error:", error.message);
      setIsConnected(false);
      setConnectionStatus("reconnecting");
    });

    socket.on("reconnect_attempt", (attemptNumber) => {
      console.log(`[WebSocket] Reconnection attempt ${attemptNumber}`);
      setConnectionStatus("reconnecting");
    });

    socket.on("reconnect", (attemptNumber) => {
      console.log(`[WebSocket] Reconnected after ${attemptNumber} attempts`);
      setIsConnected(true);
      setConnectionStatus("connected");

      // Resubscribe to account after reconnection
      const currentAccountId = subscribedAccountRef.current;
      if (currentAccountId && socketRef.current?.connected) {
        socketRef.current.emit("subscribe:account", { accountId: currentAccountId });
        console.log("[WebSocket] Resubscribed to account after reconnect:", currentAccountId);
      }
    });

    socket.on("reconnect_failed", () => {
      console.error("[WebSocket] Reconnection failed after all attempts");
      setIsConnected(false);
      setConnectionStatus("disconnected");
    });

    // Subscription confirmation
    socket.on("subscription:confirmed", (data) => {
      console.log("[WebSocket] Subscription confirmed:", data);
    });

    // Position closed event
    socket.on("position:closed", (event) => {
      console.log("[WebSocket] Position closed:", event);
      if (onPositionClosed) {
        onPositionClosed(event);
      }
    });

    // Account status change event
    socket.on("account:status-changed", (event) => {
      console.log("[WebSocket] Account status changed:", event);
      if (onAccountStatusChange) {
        onAccountStatusChange(event);
      }
    });

    // Account update event (for trading days, balance, equity)
    socket.on("account:update", (event) => {
      console.log("[WebSocket] Account update:", event);
      if (onAccountUpdate) {
        onAccountUpdate(event);
      }
    });

    socketRef.current = socket;
  }, [getAuthToken, onPositionClosed, onAccountStatusChange, onAccountUpdate]);

  // Update subscribedAccountRef when accountId changes and handle subscription
  useEffect(() => {
    if (!accountId) {
      subscribedAccountRef.current = null;
      return;
    }

    // Update ref immediately so connect() can use it
    const prevAccountId = subscribedAccountRef.current;
    subscribedAccountRef.current = accountId;

    // Only handle subscription if socket is connected
    if (!socketRef.current?.connected) {
      // Socket will auto-subscribe on connect using the ref
      return;
    }

    // If already subscribed to this account, skip
    if (prevAccountId === accountId) {
      return;
    }

    // Unsubscribe from previous account
    if (prevAccountId) {
      console.log(
        "[WebSocket] Unsubscribing from account:",
        prevAccountId
      );
      socketRef.current.emit("unsubscribe:account", {
        accountId: prevAccountId,
      });
    }

    // Subscribe to new account
    console.log("[WebSocket] Subscribing to account:", accountId);
    socketRef.current.emit("subscribe:account", { accountId });
  }, [accountId]);

  // Initialize connection on mount
  useEffect(() => {
    connect();

    // Cleanup on unmount
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      if (socketRef.current) {
        console.log("[WebSocket] Disconnecting");
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      subscribedAccountRef.current = null;
      setIsConnected(false);
      setConnectionStatus("disconnected");
    };
  }, [connect]); // Depend on connect to ensure latest version is used

  // Manual reconnect function
  const reconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    connect();
  }, [connect]);

  return {
    isConnected,
    connectionStatus,
    reconnect,
  };
}
