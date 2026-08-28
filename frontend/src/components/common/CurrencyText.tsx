import React from 'react';

interface Props {
  amount?: number | null;
  currencySymbol?: string;
  className?: string;
  showSign?: boolean;
  highlightZero?: boolean;
}

export const CurrencyText: React.FC<Props> = ({
  amount,
  currencySymbol = '$',
  className = '',
  showSign = false,
  highlightZero = false,
}) => {
  if (amount === null || amount === undefined) {
    return <span className={`text-slate-500 font-mono ${className}`}>—</span>;
  }

  const isZero = Math.abs(amount) < 0.001;
  const isNegative = amount < 0;

  const formattedNumber = Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  let sign = '';
  if (showSign) {
    if (isNegative) sign = '-';
    else if (!isZero) sign = '+';
  } else if (isNegative) {
    sign = '-';
  }

  return (
    <span className={`font-mono tabular-nums ${isZero && highlightZero ? 'text-slate-500' : ''} ${className}`}>
      {sign}{currencySymbol}{formattedNumber}
    </span>
  );
};
