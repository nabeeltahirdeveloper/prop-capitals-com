import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { getUnifiedPrices } from '@/api/market-data';
import { io } from 'socket.io-client';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'react-router-dom';

// Create context with a default value to help with debugging
const PriceContext = createContext(undefined);

const WEBSOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL || 'http://localhost:3000';

// Unified price polling interval: 1000ms for smooth updates
const POLL_INTERVAL = 1000;
const MAX_RECONNECT_ATTEMPTS = 5;
const BASE_BACKOFF_MS = 2000; // Base backoff delay
const MAX_BACKOFF_MS = 30000; // Max backoff delay (30 seconds)

// Pages that require live price updates
const PRICE_REQUIRED_PAGES = [
  '/TradingTerminal',
];

/**
 * Check if current route requires price updates
 * Matches exact path or paths that start with the page path
 */
const isPriceRequiredPage = (pathname) => {
  const normalizedPath = pathname.toLowerCase();
  return PRICE_REQUIRED_PAGES.some(page => {
    const normalizedPage = page.toLowerCase();
    // Match exact path or path that starts with the page path (e.g., /TradingTerminal or /TradingTerminal/...)
    return normalizedPath === normalizedPage || normalizedPath.startsWith(normalizedPage + '/');
  });
};

export function PriceProvider({ children, currentPathname = null }) {
  // Always provide the context, even if we can't determine the pathname
  // This ensures usePrices() works everywhere
  const { status: authStatus } = useAuth(); // Check authentication status
  
  // Use provided pathname or fallback to window.location (for when Router is not available)
  const getCurrentPathname = useCallback(() => {
    if (currentPathname !== null && currentPathname !== undefined) {
      return currentPathname;
    }
    // Fallback to window.location if Router context is not available
    return typeof window !== 'undefined' ? window.location.pathname : '';
  }, [currentPathname]);
  
  const [prices, setPrices] = useState({});
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [priceSource, setPriceSource] = useState('rest'); // 'websocket' or 'rest'
  
  // Connection status: 'connected' | 'reconnecting' | 'offline'
  const [connectionStatus, setConnectionStatus] = useState('reconnecting');
  const [failedAttempts, setFailedAttempts] = useState(0);
  
  const pollingIntervalRef = useRef(null);
  const lastPriceRef = useRef({}); // For jump detection
  const lastUpdateTimeRef = useRef({}); // For jump detection
  const backoffTimeoutRef = useRef(null);
  const isRetryingRef = useRef(false);
  const forexSocketRef = useRef(null); // WebSocket for forex prices
  const forexSymbolsRef = useRef(new Set()); // Track forex symbols we're interested in
  const authStatusRef = useRef(authStatus); // Track current auth status for polling checks
  const locationRef = useRef(getCurrentPathname()); // Track current location for polling checks

  /**
   * Calculate exponential backoff delay
   */
  const getBackoffDelay = useCallback((attempts) => {
    // Exponential backoff: 2s, 4s, 8s, 16s, 30s (capped)
    const delay = Math.min(BASE_BACKOFF_MS * Math.pow(2, attempts), MAX_BACKOFF_MS);
    return delay;
  }, []);

  /**
   * Update price with jump detection
   */
  const updatePrice = useCallback((symbol, bid, ask, timestamp) => {
    if (!symbol || typeof bid !== 'number' || typeof ask !== 'number' || isNaN(bid) || isNaN(ask)) {
      return false;
    }

    const now = Date.now();
    const lastPrice = lastPriceRef.current[symbol];
    const lastUpdateTime = lastUpdateTimeRef.current[symbol];

    // Jump detection: reject updates >5% within 1 second
    if (lastPrice && lastUpdateTime && (now - lastUpdateTime) < 1000) {
      const oldBid = lastPrice.bid;
      const bidChangePercent = Math.abs((bid - oldBid) / oldBid) * 100;
      
      if (bidChangePercent > 5) {
        console.warn(`⚠️ Price jump detected for ${symbol}: ${oldBid} → ${bid} (${bidChangePercent.toFixed(2)}% change). Rejecting update.`);
        return false;
      }
    }

    // Update price
    setPrices(prev => ({
      ...prev,
      [symbol]: {
        bid,
        ask,
        price: bid, // Use bid as price
        timestamp: timestamp || now,
      }
    }));

    // Track for jump detection
    lastPriceRef.current[symbol] = { bid, ask };
    lastUpdateTimeRef.current[symbol] = now;

    return true;
  }, []);

  /**
   * Fetch prices from unified endpoint with retry logic
   */
  const fetchPrices = useCallback(async (symbols = []) => {
    try {
      const startTime = Date.now();
      const response = await getUnifiedPrices(symbols);
      const fetchTime = Date.now() - startTime;
      
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[PriceContext] Fetched ${response?.prices?.length || 0} prices in ${fetchTime}ms (source: ${response?.source || 'unknown'})`);
      }
      
      if (response && response.prices && Array.isArray(response.prices)) {
        // Valid response received - we're connected even if no price updates pass validation
        setIsConnected(true);
        setConnectionStatus('connected');
        setFailedAttempts(0); // Reset failed attempts on success
        isRetryingRef.current = false;
        
        // Update price source indicator
        if (response.source) {
          setPriceSource(response.source);
        }

        // Update all prices
        let updateCount = 0;
        response.prices.forEach(priceData => {
          if (priceData && priceData.symbol) {
            const updated = updatePrice(
              priceData.symbol,
              priceData.bid,
              priceData.ask,
              priceData.timestamp || Date.now()
            );
            if (updated) {
              updateCount++;
            }
          }
        });

        if (updateCount > 0) {
          setLastUpdate(Date.now());
          if (process.env.NODE_ENV !== 'production') {
            console.log(`[PriceContext] Updated ${updateCount} prices`);
          }
        } else if (process.env.NODE_ENV !== 'production') {
          console.warn(`[PriceContext] No price updates (${response.prices.length} prices received, but none passed validation)`);
        }
        
        return true; // Success
      } else {
        console.warn('[PriceContext] Invalid response format:', response);
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('[PriceContext] Failed to fetch unified prices:', error);
      
      // Update connection state
      setFailedAttempts(prev => {
        const newAttempts = prev + 1;
        
        if (newAttempts >= MAX_RECONNECT_ATTEMPTS) {
          setConnectionStatus('offline');
          setIsConnected(false);
        } else {
          setConnectionStatus('reconnecting');
        }
        
        return newAttempts;
      });
      
      return false; // Failure
    }
  }, [updatePrice]);

  /**
   * Manual retry function - resets attempts and tries immediately
   */
  const retryConnection = useCallback(() => {
    if (isRetryingRef.current) return;
    
    isRetryingRef.current = true;
    setFailedAttempts(0);
    setConnectionStatus('reconnecting');
    
    // Clear any existing backoff timeout
    if (backoffTimeoutRef.current) {
      clearTimeout(backoffTimeoutRef.current);
      backoffTimeoutRef.current = null;
    }
    
    // Fetch immediately
    fetchPrices().then(success => {
      if (!success) {
        isRetryingRef.current = false;
      }
    });
  }, [fetchPrices]);

  /**
   * Connect to forex prices WebSocket
   * Only connects when on a page that requires prices
   */
  useEffect(() => {
    const pathname = getCurrentPathname();
    const shouldConnect = authStatus === 'authenticated' && isPriceRequiredPage(pathname);
    
    if (!shouldConnect) {
      // Disconnect if we're not on a price-required page
      if (forexSocketRef.current) {
        forexSocketRef.current.emit('unsubscribe:forex-prices');
        forexSocketRef.current.disconnect();
        forexSocketRef.current = null;
      }
      
      if (process.env.NODE_ENV !== 'production' && authStatus === 'authenticated') {
        console.log(`[PriceContext] Not on a price-required page (${pathname}), disconnecting forex WebSocket`);
      }
      return;
    }

    const getAuthToken = () => {
      try {
        return localStorage.getItem('token') || localStorage.getItem('authToken');
      } catch (error) {
        return null;
      }
    };

    const token = getAuthToken();
    if (!token) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[PriceContext] No auth token, skipping forex WebSocket connection');
      }
      return;
    }

    // Connect to forex prices WebSocket
    const socket = io(`${WEBSOCKET_URL}/forex-prices`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    forexSocketRef.current = socket;

    socket.on('connect', () => {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[PriceContext] Forex WebSocket connected');
      }
      
      // Subscribe to all forex prices
      socket.emit('subscribe:forex-prices');
    });

    socket.on('forex:price-update', (priceData) => {
      if (priceData && priceData.symbol) {
        // Update price directly from WebSocket
        updatePrice(
          priceData.symbol,
          priceData.bid,
          priceData.ask,
          priceData.timestamp || Date.now()
        );
        
        // Mark that we received a WebSocket update
        if (process.env.NODE_ENV !== 'production') {
          console.log(`[PriceContext] Forex WS update: ${priceData.symbol}`);
        }
      }
    });

    socket.on('subscription:confirmed', (data) => {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[PriceContext] Forex WebSocket subscription confirmed:', data);
      }
    });

    socket.on('disconnect', () => {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[PriceContext] Forex WebSocket disconnected');
      }
    });

    socket.on('connect_error', (error) => {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[PriceContext] Forex WebSocket connection error:', error.message);
      }
    });

    return () => {
      if (socket) {
        socket.emit('unsubscribe:forex-prices');
        socket.disconnect();
      }
      forexSocketRef.current = null;
    };
  }, [authStatus, currentPathname, getCurrentPathname, updatePrice]);

  // Update auth status and location refs whenever they change
  useEffect(() => {
    authStatusRef.current = authStatus;
    locationRef.current = getCurrentPathname();
  }, [authStatus, currentPathname, getCurrentPathname]);
  
  // Listen for popstate events to update pathname when using browser navigation
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const updatePathname = () => {
      locationRef.current = window.location.pathname;
    };
    
    window.addEventListener('popstate', updatePathname);
    return () => window.removeEventListener('popstate', updatePathname);
  }, []);

  /**
   * Start polling for prices with backoff on failures
   * Note: Polling is now mainly for crypto prices and as fallback for forex
   * Only polls when user is authenticated AND on a page that requires prices
   */
  useEffect(() => {
    const pathname = getCurrentPathname();
    const shouldPoll = authStatus === 'authenticated' && isPriceRequiredPage(pathname);
    
    // Only start polling if user is authenticated AND on a price-required page
    if (!shouldPoll) {
      // Clear any existing polling if conditions are not met
      if (pollingIntervalRef.current) {
        clearTimeout(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      if (backoffTimeoutRef.current) {
        clearTimeout(backoffTimeoutRef.current);
        backoffTimeoutRef.current = null;
      }
      
      if (process.env.NODE_ENV !== 'production') {
        if (authStatus !== 'authenticated') {
          console.log('[PriceContext] User not authenticated, skipping price polling');
        } else if (!isPriceRequiredPage(pathname)) {
          console.log(`[PriceContext] Not on a price-required page (${pathname}), skipping price polling`);
        }
      }
      return;
    }

    let isMounted = true;
    
    const poll = async () => {
      if (!isMounted) return;
      
      // Double-check authentication status and page before polling (using refs for latest values)
      if (authStatusRef.current !== 'authenticated' || !isPriceRequiredPage(locationRef.current)) {
        if (process.env.NODE_ENV !== 'production') {
          console.log('[PriceContext] Authentication status or page changed, stopping polling');
        }
        return;
      }
      
      // Only poll for non-forex symbols or as fallback
      // Since forex is handled by WebSocket, we can reduce polling frequency
      const success = await fetchPrices();
      
      if (!isMounted) return;
      
      // Check auth status and page again after fetch (using refs for latest values)
      if (authStatusRef.current !== 'authenticated' || !isPriceRequiredPage(locationRef.current)) {
        return;
      }
      
      // Calculate next poll interval
      // Increase polling interval since forex is handled by WebSocket
      let nextPollDelay = POLL_INTERVAL * 2; // Poll less frequently (2 seconds instead of 1)
      
      if (!success) {
        // Use exponential backoff on failures, but cap at MAX_RECONNECT_ATTEMPTS
        const currentAttempts = failedAttempts;
        if (currentAttempts < MAX_RECONNECT_ATTEMPTS) {
          nextPollDelay = getBackoffDelay(currentAttempts);
          if (process.env.NODE_ENV !== 'production') {
            console.log(`[PriceContext] Retry ${currentAttempts + 1}/${MAX_RECONNECT_ATTEMPTS} in ${nextPollDelay}ms`);
          }
        } else {
          // Stop polling after max attempts - require manual retry
          if (process.env.NODE_ENV !== 'production') {
            console.log(`[PriceContext] Max retry attempts reached. Manual retry required.`);
          }
          return; // Don't schedule next poll
        }
      }
      
      // Schedule next poll
      pollingIntervalRef.current = setTimeout(poll, nextPollDelay);
    };
    
    // Initial fetch immediately
    poll();

    // Debug: Log polling status
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[PriceContext] Started polling with base interval ${POLL_INTERVAL * 2}ms (forex handled by WebSocket)`);
    }

    return () => {
      isMounted = false;
      if (pollingIntervalRef.current) {
        clearTimeout(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      if (backoffTimeoutRef.current) {
        clearTimeout(backoffTimeoutRef.current);
        backoffTimeoutRef.current = null;
      }
    };
  }, [authStatus, currentPathname, getCurrentPathname, fetchPrices, failedAttempts, getBackoffDelay]);

  /**
   * Get price for a symbol
   */
  const getPrice = useCallback((symbol, side = 'bid') => {
    const priceData = prices[symbol];
    if (!priceData) return null;

    switch (side) {
      case 'bid':
        return priceData.bid;
      case 'ask':
        return priceData.ask;
      case 'mid':
        return (priceData.bid + priceData.ask) / 2;
      default:
        return priceData.bid;
    }
  }, [prices]);

  /**
   * Get all prices
   */
  const getAllPrices = useCallback(() => {
    return prices;
  }, [prices]);

  const value = {
    prices,
    getPrice,
    getAllPrices,
    updatePrice,
    fetchPrices,
    isConnected,
    lastUpdate,
    priceSource,
    // New reconnection-related values
    connectionStatus,
    failedAttempts,
    maxReconnectAttempts: MAX_RECONNECT_ATTEMPTS,
    retryConnection,
  };

  // Always render the Provider to ensure context is available
  // This is critical - the Provider must always render for usePrices() to work
  return (
    <PriceContext.Provider value={value}>
      {children}
    </PriceContext.Provider>
  );
}

export function usePrices() {
  const context = useContext(PriceContext);
  if (!context) {
    throw new Error('usePrices must be used within PriceProvider');
  }
  return context;
}

/**
 * Wrapper component that uses useLocation inside Router context
 * and passes pathname to PriceProvider
 * This should be used inside a Router component
 */
export function PriceProviderWithRouter({ children }) {
  try {
    const location = useLocation();
    return <PriceProvider currentPathname={location.pathname}>{children}</PriceProvider>;
  } catch (error) {
    // Fallback if useLocation fails (shouldn't happen if inside Router)
    console.warn('[PriceProviderWithRouter] useLocation failed, using fallback:', error);
    return <PriceProvider currentPathname={null}>{children}</PriceProvider>;
  }
}
