import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

// Display-only EUR -> GBP rate. Change this single constant to retune GBP pricing.
export const EUR_TO_GBP_RATE = 0.85;

export const supportedCurrencies = [
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
];

const CurrencyContext = createContext(null);

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState(() => {
    const stored = localStorage.getItem('currency');
    return stored === 'GBP' ? 'GBP' : 'EUR';
  });

  useEffect(() => {
    localStorage.setItem('currency', currency);
  }, [currency]);

  const value = useMemo(() => {
    const symbol = currency === 'GBP' ? '£' : '€';

    // Challenge fees convert at the fixed rate (e.g. €159 -> £135).
    const formatFee = (eurAmount) => {
      const n = currency === 'GBP'
        ? Math.round(eurAmount * EUR_TO_GBP_RATE)
        : Math.round(eurAmount);
      return `${symbol}${n.toLocaleString('en-US')}`;
    };

    // Notional amounts (account size, calculator output) only swap the
    // symbol — the number is unchanged, matching InstantPropFunding.
    const formatAmount = (amount) =>
      `${symbol}${Math.round(amount).toLocaleString('en-US')}`;

    // Account-size label, e.g. "€5K" / "£5K".
    const formatSize = (key) => `${symbol}${key}`;

    // Marketing/notional display: swap any hardcoded currency symbol ($, €, £)
    // in a string to the active one; numbers get the active symbol prefixed.
    // No FX conversion — these are notional figures, matching InstantPropFunding.
    const cur = (val) => {
      if (val === null || val === undefined) return val;
      if (typeof val === 'number') return `${symbol}${Math.round(val).toLocaleString('en-US')}`;
      return String(val).replace(/[$€£]/g, symbol);
    };

    return { currency, setCurrency, symbol, formatFee, formatAmount, formatSize, cur };
  }, [currency]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
};

export const useCurrency = () => {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within a CurrencyProvider');
  return ctx;
};
