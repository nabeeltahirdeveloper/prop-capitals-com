import { describe, it, expect } from 'vitest';
import { countryToLanguage, isLocaleAgnosticPath, isLocalePrefixedPath, parseLocaleCookie, decideLanguageRedirect } from './geo.mjs';

describe('countryToLanguage', () => {
  it('maps TR to tr, KZ to kk, else en', () => {
    expect(countryToLanguage('TR')).toBe('tr');
    expect(countryToLanguage('KZ')).toBe('kk');
    expect(countryToLanguage('US')).toBe('en');
    expect(countryToLanguage('')).toBe('en');
  });
});

describe('isLocaleAgnosticPath', () => {
  it('flags pay/q/set-password', () => {
    expect(isLocaleAgnosticPath('/q/abc')).toBe(true);
    expect(isLocaleAgnosticPath('/pay/abc')).toBe(true);
    expect(isLocaleAgnosticPath('/pay/success')).toBe(true);
    expect(isLocaleAgnosticPath('/set-password')).toBe(true);
    expect(isLocaleAgnosticPath('/Challenges')).toBe(false);
    expect(isLocaleAgnosticPath('/')).toBe(false);
  });
});

describe('isLocalePrefixedPath', () => {
  it('flags /tr and /kk paths only', () => {
    expect(isLocalePrefixedPath('/tr')).toBe(true);
    expect(isLocalePrefixedPath('/tr/about')).toBe(true);
    expect(isLocalePrefixedPath('/kk')).toBe(true);
    expect(isLocalePrefixedPath('/kk/about')).toBe(true);
    expect(isLocalePrefixedPath('/about')).toBe(false);
    expect(isLocalePrefixedPath('/trading-rules')).toBe(false);
    expect(isLocalePrefixedPath('/')).toBe(false);
  });
});

describe('parseLocaleCookie', () => {
  it('reads a valid locale', () => {
    expect(parseLocaleCookie('a=1; locale=tr; b=2')).toBe('tr');
    expect(parseLocaleCookie('locale=en')).toBe('en');
    expect(parseLocaleCookie('locale=kk')).toBe('kk');
  });
  it('returns null for missing/invalid', () => {
    expect(parseLocaleCookie('a=1')).toBeNull();
    expect(parseLocaleCookie('locale=fr')).toBeNull();
    expect(parseLocaleCookie('')).toBeNull();
    expect(parseLocaleCookie(undefined)).toBeNull();
  });
});

describe('decideLanguageRedirect', () => {
  it('redirects unprefixed TR visitors to /tr', () => {
    expect(decideLanguageRedirect({ path: '/', localeCookie: null, country: 'TR' })).toBe('/tr');
    expect(decideLanguageRedirect({ path: '/Challenges', localeCookie: null, country: 'TR' })).toBe('/tr/Challenges');
  });
  it('honors the locale cookie over geo', () => {
    expect(decideLanguageRedirect({ path: '/', localeCookie: 'en', country: 'TR' })).toBeNull();
    expect(decideLanguageRedirect({ path: '/Challenges', localeCookie: 'tr', country: 'US' })).toBe('/tr/Challenges');
  });
  it('never redirects /tr paths (no loop)', () => {
    expect(decideLanguageRedirect({ path: '/tr', localeCookie: null, country: 'TR' })).toBeNull();
    expect(decideLanguageRedirect({ path: '/tr/Challenges', localeCookie: 'tr', country: 'TR' })).toBeNull();
  });
  it('never redirects locale-agnostic paths', () => {
    expect(decideLanguageRedirect({ path: '/pay/abc', localeCookie: null, country: 'TR' })).toBeNull();
    expect(decideLanguageRedirect({ path: '/q/abc', localeCookie: 'tr', country: 'TR' })).toBeNull();
    expect(decideLanguageRedirect({ path: '/set-password', localeCookie: null, country: 'TR' })).toBeNull();
  });
  it('serves English (null) for non-TR with no cookie', () => {
    expect(decideLanguageRedirect({ path: '/Challenges', localeCookie: null, country: 'US' })).toBeNull();
    expect(decideLanguageRedirect({ path: '/', localeCookie: null, country: '' })).toBeNull();
  });
  it('redirects unprefixed KZ visitors to /kk', () => {
    expect(decideLanguageRedirect({ path: '/', localeCookie: null, country: 'KZ' })).toBe('/kk');
    expect(decideLanguageRedirect({ path: '/Challenges', localeCookie: null, country: 'KZ' })).toBe('/kk/Challenges');
  });
  it('honors a kk locale cookie over geo', () => {
    expect(decideLanguageRedirect({ path: '/Challenges', localeCookie: 'kk', country: 'US' })).toBe('/kk/Challenges');
    expect(decideLanguageRedirect({ path: '/', localeCookie: 'en', country: 'KZ' })).toBeNull();
  });
  it('never redirects /kk paths (no loop)', () => {
    expect(decideLanguageRedirect({ path: '/kk', localeCookie: null, country: 'KZ' })).toBeNull();
    expect(decideLanguageRedirect({ path: '/kk/Challenges', localeCookie: 'kk', country: 'KZ' })).toBeNull();
  });
  it('never redirects across prefixes (kk cookie on a /tr path stays put)', () => {
    expect(decideLanguageRedirect({ path: '/tr/about', localeCookie: 'kk', country: 'KZ' })).toBeNull();
    expect(decideLanguageRedirect({ path: '/kk/about', localeCookie: 'tr', country: 'TR' })).toBeNull();
  });
  it('serves English (null) for KZ locale-agnostic paths', () => {
    expect(decideLanguageRedirect({ path: '/pay/abc', localeCookie: null, country: 'KZ' })).toBeNull();
    expect(decideLanguageRedirect({ path: '/set-password', localeCookie: 'kk', country: 'KZ' })).toBeNull();
  });
});
