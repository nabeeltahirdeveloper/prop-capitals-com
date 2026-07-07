import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getDefaultsForCountry } from '@/config/localeDefaults';
import { readGeoCountry } from '@/lib/geoCookie';
import { pickInitialValue } from '@/lib/localeResolution';

// Display-only EUR -> GBP rate. Change this single constant to retune GBP pricing.
export const EUR_TO_GBP_RATE = 0.85;

export const supportedCurrencies = [
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira' },
  { code: 'KZT', symbol: '₸', name: 'Kazakhstani Tenge' },
];

const CurrencyContext = createContext(null);

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrencyState] = useState(() => {
    if (typeof window === 'undefined') return 'EUR';
    const stored = localStorage.getItem('currency');
    const saved = supportedCurrencies.some((c) => c.code === stored) ? stored : null;
    const manual = localStorage.getItem('currencyManuallySet') === '1';
    const geoRaw = getDefaultsForCountry(readGeoCountry())?.currency ?? null;
    const geoValue = supportedCurrencies.some((c) => c.code === geoRaw) ? geoRaw : null;
    return pickInitialValue({ saved, manual, geoValue, fallback: 'EUR' });
  });

  const setCurrency = (code, { manual = false } = {}) => {
    if (manual) localStorage.setItem('currencyManuallySet', '1');
    setCurrencyState(code);
  };

  useEffect(() => {
    localStorage.setItem('currency', currency);
  }, [currency]);

  const value = useMemo(() => {
    const symbol = supportedCurrencies.find((c) => c.code === currency)?.symbol ?? '€';

    // Amounts are FIXED across currencies: switching the currency selector only
    // swaps the symbol (€ <-> £), never the number. Prices like £299 stay 299
    // whether GBP or EUR is selected. (Previously this multiplied by
    // EUR_TO_GBP_RATE, which made the displayed number change on toggle.)
    const convert = (n) => n;

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
        /[$€£₺₸](\d[\d,]*(?:\.\d+)?)([KMB]?)/gi,
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
      return replaced.replace(/[$€£₺₸]/g, symbol);
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
