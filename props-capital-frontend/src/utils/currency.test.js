import { describe, it, expect } from 'vitest';
import { getCurrencySymbol, CURRENCY_NAMES } from './currency.js';

describe('currency utils — TRY', () => {
  it('returns the lira symbol for TRY', () => {
    expect(getCurrencySymbol('TRY')).toBe('₺');
  });
  it('has a name for TRY', () => {
    expect(CURRENCY_NAMES.TRY).toBe('Turkish Lira');
  });
  it('still falls back to the code for unknown currencies', () => {
    expect(getCurrencySymbol('ZZZ')).toBe('ZZZ');
  });
});

describe('currency utils — KZT', () => {
  it('returns the tenge symbol for KZT', () => {
    expect(getCurrencySymbol('KZT')).toBe('₸');
  });
  it('has a name for KZT', () => {
    expect(CURRENCY_NAMES.KZT).toBe('Kazakhstani Tenge');
  });
});
