import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

// Challenge fees use the same numeric amount in EUR and GBP (symbol only changes).
export const EUR_TO_GBP_RATE = 1;

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
    const isGBP = currency === 'GBP';

    // Fees are stored once; GBP shows the same number with a £ prefix.
    const convert = (n) => (isGBP ? n * EUR_TO_GBP_RATE : n);

    // Format a "unit-suffixed" number ("5K", "1.5M", "200K") after FX. Keeps
    // one decimal only when the conversion produced a fraction, so €20K stays
    // "£17K" rather than turning into "£17.0K".
    const formatUnitNumber = (n) => {
      if (Number.isInteger(n)) return String(n);
      const oneDp = Math.round(n * 10) / 10;
      return Number.isInteger(oneDp) ? String(oneDp) : oneDp.toFixed(1);
    };

    // Challenge fees: round to whole units after FX (e.g. €159 -> £135).
    const formatFee = (eurAmount) => {
      const n = Math.round(convert(eurAmount));
      return `${symbol}${n.toLocaleString('en-US')}`;
    };

    // Notional amounts (calculator output, payout totals) — convert at the
    // same rate so the displayed number matches the toggle.
    const formatAmount = (amount) => {
      const n = Math.round(convert(amount));
      return `${symbol}${n.toLocaleString('en-US')}`;
    };

    // Account-size labels like "5K" / "200K". Parse the number portion,
    // convert under GBP, and re-render with the same unit suffix.
    const formatSize = (key) => {
      const m = String(key).match(/^([\d.,]+)\s*([KMB]?)$/i);
      if (!m) return `${symbol}${key}`;
      const num = parseFloat(m[1].replace(/,/g, ''));
      if (!Number.isFinite(num)) return `${symbol}${key}`;
      const unit = (m[2] || '').toUpperCase();
      const converted = convert(num);
      const formatted = unit
        ? formatUnitNumber(converted)
        : Math.round(converted).toLocaleString('en-US');
      return `${symbol}${formatted}${unit}`;
    };

    // Marketing/notional strings: find every "[$€£][number][K/M/B?]" run,
    // convert it, swap the symbol; then sweep any leftover bare $/€/£ chars
    // so legacy strings without amounts still get the active symbol.
    const cur = (val) => {
      if (val === null || val === undefined) return val;
      if (typeof val === 'number') {
        const n = Math.round(convert(val));
        return `${symbol}${n.toLocaleString('en-US')}`;
      }
      const replaced = String(val).replace(
        /[$€£](\d[\d,]*(?:\.\d+)?)([KMB]?)/gi,
        (match, numStr, unit) => {
          const n = parseFloat(numStr.replace(/,/g, ''));
          if (!Number.isFinite(n)) return match;
          const converted = convert(n);
          const unitUpper = (unit || '').toUpperCase();
          const hadCents = /\.\d+$/.test(numStr);
          let formatted;
          if (unitUpper) {
            formatted = formatUnitNumber(converted);
          } else if (hadCents) {
            const fixed = converted.toFixed(2);
            const [intPart, decPart] = fixed.split('.');
            formatted = `${parseInt(intPart, 10).toLocaleString('en-US')}.${decPart}`;
          } else {
            formatted = Math.round(converted).toLocaleString('en-US');
          }
          return `${symbol}${formatted}${unitUpper}`;
        },
      );
      return replaced.replace(/[$€£]/g, symbol);
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
