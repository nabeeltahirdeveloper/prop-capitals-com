import React from 'react';
import { useCurrency, supportedCurrencies } from '@/contexts/CurrencyContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function CurrencySwitcher() {
  const { currency, setCurrency, symbol } = useCurrency();
  const { isDark } = useTheme();

  return (
    <Select value={currency} onValueChange={setCurrency}>
      <SelectTrigger
        className={`w-[92px] rounded-full h-10 ${
          isDark
            ? 'bg-white/10 border-white/10 text-gray-200'
            : 'bg-slate-100 border-slate-200 text-slate-700'
        }`}
        aria-label="Currency"
      >
        <SelectValue>
          <span className="font-semibold">{symbol} {currency}</span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {supportedCurrencies.map((c) => (
          <SelectItem key={c.code} value={c.code}>
            <span className="font-semibold mr-1">{c.symbol}</span>
            <span className="font-medium mr-2">{c.code}</span>
            <span className="text-muted-foreground">{c.name}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
