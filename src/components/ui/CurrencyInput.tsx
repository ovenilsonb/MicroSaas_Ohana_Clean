import React from 'react';
import { Input } from './Input';

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  label?: string;
  error?: string;
  value: number;
  onChange: (value: number) => void;
  decimals?: number;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({ 
  label, 
  error, 
  value, 
  onChange, 
  className = '', 
  decimals = 2,
  ...props 
}) => {
  const formatValue = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(val);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    const numericValue = parseInt(rawValue || '0', 10) / Math.pow(10, decimals);
    onChange(numericValue);
  };

  return (
    <Input
      {...props}
      label={label}
      error={error}
      className={className}
      type="text"
      inputMode="numeric"
      value={formatValue(value)}
      onChange={handleChange}
    />
  );
};
