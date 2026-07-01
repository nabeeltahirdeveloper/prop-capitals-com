import { describe, it, expect } from 'vitest';
import { localeFromPath, basenameForPath, urlForLocale, VALID_LOCALES, DEFAULT_LOCALE } from './localeUrl.js';

describe('localeFromPath', () => {
  it('detects tr only under /tr', () => {
    expect(localeFromPath('/tr')).toBe('tr');
    expect(localeFromPath('/tr/')).toBe('tr');
    expect(localeFromPath('/tr/Challenges')).toBe('tr');
  });
  it('detects kk only under /kk', () => {
    expect(localeFromPath('/kk')).toBe('kk');
    expect(localeFromPath('/kk/')).toBe('kk');
    expect(localeFromPath('/kk/Challenges')).toBe('kk');
  });
  it('is english everywhere else', () => {
    expect(localeFromPath('/')).toBe('en');
    expect(localeFromPath('/Challenges')).toBe('en');
    expect(localeFromPath('/trading-rules')).toBe('en'); // NOT /tr
    expect(localeFromPath('/kkextra')).toBe('en');       // NOT /kk (needs a boundary)
    expect(localeFromPath('')).toBe('en');
  });
});

describe('basenameForPath', () => {
  it('is the /locale prefix on prefixed paths, empty otherwise', () => {
    expect(basenameForPath('/tr/about')).toBe('/tr');
    expect(basenameForPath('/kk/about')).toBe('/kk');
    expect(basenameForPath('/about')).toBe('');
    expect(basenameForPath('/trading-rules')).toBe('');
  });
});

describe('urlForLocale', () => {
  it('adds the prefix for a non-default locale', () => {
    expect(urlForLocale('tr', { pathname: '/Challenges' })).toBe('/tr/Challenges');
    expect(urlForLocale('tr', { pathname: '/' })).toBe('/tr');
    expect(urlForLocale('kk', { pathname: '/Challenges' })).toBe('/kk/Challenges');
    expect(urlForLocale('kk', { pathname: '/' })).toBe('/kk');
  });
  it('strips any existing prefix for english', () => {
    expect(urlForLocale('en', { pathname: '/tr/Challenges' })).toBe('/Challenges');
    expect(urlForLocale('en', { pathname: '/tr' })).toBe('/');
    expect(urlForLocale('en', { pathname: '/kk/Challenges' })).toBe('/Challenges');
    expect(urlForLocale('en', { pathname: '/kk' })).toBe('/');
  });
  it('swaps one prefix for another', () => {
    expect(urlForLocale('kk', { pathname: '/tr/about' })).toBe('/kk/about');
    expect(urlForLocale('tr', { pathname: '/kk/about' })).toBe('/tr/about');
  });
  it('preserves search and hash', () => {
    expect(urlForLocale('tr', { pathname: '/Challenges', search: '?a=1', hash: '#x' })).toBe('/tr/Challenges?a=1#x');
    expect(urlForLocale('kk', { pathname: '/Challenges', search: '?a=1', hash: '#x' })).toBe('/kk/Challenges?a=1#x');
  });
  it('is idempotent for the same locale', () => {
    expect(urlForLocale('tr', { pathname: '/tr/about' })).toBe('/tr/about');
    expect(urlForLocale('kk', { pathname: '/kk/about' })).toBe('/kk/about');
  });
  it('exposes constants', () => {
    expect(VALID_LOCALES).toEqual(['en', 'tr', 'kk']);
    expect(DEFAULT_LOCALE).toBe('en');
  });
});
