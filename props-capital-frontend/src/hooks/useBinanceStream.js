import { useEffect, useRef, useState, useCallback } from 'react';

const BINANCE_REST = 'https://api.binance.com/api/v3';

/**
 * Fetch order book depth from Binance REST API
 */
async function fetchDepth(symbol) {
  const res = await fetch(`${BINANCE_REST}/depth?symbol=${symbol.toUpperCase()}&limit=20`);
  if (!res.ok) throw new Error(`depth ${res.status}`);
  return res.json(); // { bids: [[price, qty], ...], asks: [[price, qty], ...] }
}

/**
 * Fetch 24h ticker from Binance REST API
 */
async function fetchTicker(symbol) {
  const res = await fetch(`${BINANCE_REST}/ticker/24hr?symbol=${symbol.toUpperCase()}`);
  if (!res.ok) throw new Error(`ticker ${res.status}`);
  const data = await res.json();
  return {
    lastPrice: parseFloat(data.lastPrice) || 0,
    priceChange: parseFloat(data.priceChange) || 0,
    priceChangePercent: parseFloat(data.priceChangePercent) || 0,
    highPrice: parseFloat(data.highPrice) || 0,
    lowPrice: parseFloat(data.lowPrice) || 0,
    volume: parseFloat(data.volume) || 0,
    quoteVolume: parseFloat(data.quoteVolume) || 0,
  };
}

/**
 * Custom hook for Binance market data (order book + 24h ticker).
 * Uses WebSocket for real-time updates with REST API fallback.
 *
 * @param {string|null} symbol - Crypto pair (e.g. "BTCUSDT") or null to disable
 * @returns {{ orderBook: { bids: Array, asks: Array }, ticker: Object|null, connected: boolean }}
 */
export function useBinanceStream(symbol) {
  const [orderBook, setOrderBook] = useState({ bids: [], asks: [] });
  const [ticker, setTicker] = useState(null);
  const [connected, setConnected] = useState(false);

  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);
  const reconnectDelay = useRef(1000);
  const pollTimer = useRef(null);
  const mountedRef = useRef(true);
  const symbolRef = useRef(symbol);
  const wsDataReceived = useRef(false);

  symbolRef.current = symbol;

  const cleanup = useCallback(() => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
    if (pollTimer.current) {
      clearInterval(pollTimer.current);
      pollTimer.current = null;
    }
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      wsRef.current.onmessage = null;
      wsRef.current.close();
      wsRef.current = null;
    }
    wsDataReceived.current = false;
  }, []);

  /* ── REST API polling fallback ── */
  const pollRest = useCallback(async (sym) => {
    if (!sym || !mountedRef.current) return;
    try {
      const [depth, tick] = await Promise.all([fetchDepth(sym), fetchTicker(sym)]);
      if (!mountedRef.current || symbolRef.current !== sym) return;
      setOrderBook({ bids: (depth.bids || []).slice(0, 15), asks: (depth.asks || []).slice(0, 15) });
      setTicker(tick);
      setConnected(true);
    } catch {
      // Silently fail — will retry on next interval
    }
  }, []);

  const startPolling = useCallback((sym) => {
    if (pollTimer.current) clearInterval(pollTimer.current);
    // Immediate first fetch
    pollRest(sym);
    // Then poll every 2 seconds
    pollTimer.current = setInterval(() => pollRest(sym), 2000);
  }, [pollRest]);

  /* ── WebSocket connection ── */
  const connect = useCallback((sym) => {
    if (!sym || !mountedRef.current) return;

    const streamSymbol = sym.toLowerCase();
    const url = `wss://stream.binance.com:9443/stream?streams=${streamSymbol}@depth20@100ms/${streamSymbol}@ticker`;

    let ws;
    try {
      ws = new WebSocket(url);
    } catch {
      // WebSocket not available — fall back to REST
      startPolling(sym);
      return;
    }
    wsRef.current = ws;

    // If no WS data within 5 seconds, fall back to REST polling
    const wsTimeout = setTimeout(() => {
      if (!wsDataReceived.current && mountedRef.current) {
        startPolling(sym);
      }
    }, 5000);

    ws.onopen = () => {
      if (!mountedRef.current) return;
      setConnected(true);
      reconnectDelay.current = 1000;
    };

    ws.onmessage = (event) => {
      if (!mountedRef.current) return;
      wsDataReceived.current = true;
      // Stop REST polling if WS is delivering data
      if (pollTimer.current) {
        clearInterval(pollTimer.current);
        pollTimer.current = null;
      }
      clearTimeout(wsTimeout);

      try {
        const msg = JSON.parse(event.data);
        const { stream, data } = msg;

        if (stream?.endsWith('@depth20@100ms')) {
          setOrderBook({
            bids: (data.bids || []).slice(0, 15),
            asks: (data.asks || []).slice(0, 15),
          });
        } else if (stream?.endsWith('@ticker')) {
          setTicker({
            lastPrice: parseFloat(data.c) || 0,
            priceChange: parseFloat(data.p) || 0,
            priceChangePercent: parseFloat(data.P) || 0,
            highPrice: parseFloat(data.h) || 0,
            lowPrice: parseFloat(data.l) || 0,
            volume: parseFloat(data.v) || 0,
            quoteVolume: parseFloat(data.q) || 0,
          });
        }
      } catch {
        // ignore parse errors
      }
    };

    ws.onclose = () => {
      clearTimeout(wsTimeout);
      if (!mountedRef.current) return;
      setConnected(false);

      // If WS was working, try to reconnect
      if (wsDataReceived.current) {
        const delay = reconnectDelay.current;
        reconnectDelay.current = Math.min(delay * 2, 30000);
        reconnectTimer.current = setTimeout(() => {
          if (mountedRef.current && symbolRef.current) {
            connect(symbolRef.current);
          }
        }, delay);
      } else {
        // WS never delivered data — stay on REST polling
        startPolling(sym);
      }
    };

    ws.onerror = () => {
      // onclose will fire after onerror
    };
  }, [cleanup, startPolling]);

  useEffect(() => {
    mountedRef.current = true;
    // Reset state on symbol change
    setOrderBook({ bids: [], asks: [] });
    setTicker(null);
    setConnected(false);
    reconnectDelay.current = 1000;
    wsDataReceived.current = false;

    if (symbol) {
      cleanup();
      connect(symbol);
    } else {
      cleanup();
    }
    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [symbol, connect, cleanup]);

  return { orderBook, ticker, connected };
}
