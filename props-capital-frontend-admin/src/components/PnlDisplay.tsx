// src/components/ui/PnlDisplay.tsx

import React from 'react';

interface PnlDisplayProps {
  pnl: number;
  priceChange?: number | null;
  isForex?: boolean;
  isCrypto?: boolean;
  size?: 'default' | 'small' | 'large';
  className?: string;
}

export function PnlDisplay({
  pnl,
  priceChange = null,
  isForex = false,
  isCrypto = false,
  size = 'default',
  className = '',
}: PnlDisplayProps) {
  const isPositive = pnl >= 0;
  const colorClass = isPositive ? 'text-emerald-400' : 'text-red-400';

  const baseClass = `font-mono font-bold ${colorClass} ${className}`;
  const sizeClass = {
    default: 'text-lg',
    small: 'text-base',
    large: 'text-2xl',
  }[size];

  return (
    <div className="text-right">
      <p className={`${baseClass} ${sizeClass}`}>
        {isPositive ? '+' : ''}{pnl.toFixed(2)}
      </p>

      {priceChange !== null && !isForex && (
        <p className={`text-xs ${colorClass}`}>
          {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}
          {isCrypto ? '%' : ''}
        </p>
      )}
    </div>
  );
}