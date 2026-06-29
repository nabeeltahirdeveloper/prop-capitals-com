import { describe, it, expect } from 'vitest';
import { getDefaultsForCountry, COUNTRY_DEFAULTS } from './localeDefaults.js';

describe('getDefaultsForCountry', () => {
  it('maps TR to Turkish + Lira', () => {
    expect(getDefaultsForCountry('TR')).toEqual({ language: 'tr', currency: 'TRY' });
  });
  it('is case-insensitive', () => {
    expect(getDefaultsForCountry('tr')).toEqual({ language: 'tr', currency: 'TRY' });
  });
  it('returns null for an unmapped country', () => {
    expect(getDefaultsForCountry('US')).toBeNull();
  });
  it('returns null for empty/nullish input', () => {
    expect(getDefaultsForCountry('')).toBeNull();
    expect(getDefaultsForCountry(null)).toBeNull();
    expect(getDefaultsForCountry(undefined)).toBeNull();
  });
  it('exposes the raw map for extension', () => {
    expect(COUNTRY_DEFAULTS.TR).toBeDefined();
  });
});
