import { describe, it, expect } from 'vitest';
import { readGeoCountry } from './geoCookie.js';

describe('readGeoCountry', () => {
  it('extracts the country code', () => {
    expect(readGeoCountry('geo_country=TR')).toBe('TR');
  });
  it('uppercases and trims', () => {
    expect(readGeoCountry('foo=1; geo_country=tr ; bar=2')).toBe('TR');
  });
  it('returns null when absent', () => {
    expect(readGeoCountry('theme=dark; other=1')).toBeNull();
  });
  it('returns null for an empty cookie value', () => {
    expect(readGeoCountry('geo_country=')).toBeNull();
  });
  it('returns null for a malformed (non-2-letter) value', () => {
    expect(readGeoCountry('geo_country=TURKEY')).toBeNull();
  });
  it('returns null when no cookie string and no document', () => {
    expect(readGeoCountry('')).toBeNull();
  });
});
