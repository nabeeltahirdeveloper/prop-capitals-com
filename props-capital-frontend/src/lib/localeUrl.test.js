import { describe, it, expect } from 'vitest';
import { localeFromPath, basenameForPath, urlForLocale, VALID_LOCALES, DEFAULT_LOCALE } from './localeUrl.js';

describe('localeFromPath', () => {
  it('detects tr only under /tr', () => {
    expect(localeFromPath('/tr')).toBe('tr');
    expect(localeFromPath('/tr/')).toBe('tr');
    expect(localeFromPath('/tr/Challenges')).toBe('tr');
  });
  it('is english everywhere else', () => {
    expect(localeFromPath('/')).toBe('en');
    expect(localeFromPath('/Challenges')).toBe('en');
    expect(localeFromPath('/trading-rules')).toBe('en'); // NOT /tr
    expect(localeFromPath('')).toBe('en');
  });
});

describe('basenameForPath', () => {
  it('is /tr on turkish paths, empty otherwise', () => {
    expect(basenameForPath('/tr/about')).toBe('/tr');
    expect(basenameForPath('/about')).toBe('');
    expect(basenameForPath('/trading-rules')).toBe('');
  });
});

describe('urlForLocale', () => {
  it('adds /tr for turkish', () => {
    expect(urlForLocale('tr', { pathname: '/Challenges' })).toBe('/tr/Challenges');
    expect(urlForLocale('tr', { pathname: '/' })).toBe('/tr');
  });
  it('strips /tr for english', () => {
    expect(urlForLocale('en', { pathname: '/tr/Challenges' })).toBe('/Challenges');
    expect(urlForLocale('en', { pathname: '/tr' })).toBe('/');
  });
  it('preserves search and hash', () => {
    expect(urlForLocale('tr', { pathname: '/Challenges', search: '?a=1', hash: '#x' })).toBe('/tr/Challenges?a=1#x');
  });
  it('is idempotent for the same locale', () => {
    expect(urlForLocale('tr', { pathname: '/tr/about' })).toBe('/tr/about');
  });
  it('exposes constants', () => {
    expect(VALID_LOCALES).toEqual(['en', 'tr']);
    expect(DEFAULT_LOCALE).toBe('en');
  });
});
