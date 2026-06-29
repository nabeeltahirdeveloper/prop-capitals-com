import { describe, it, expect } from 'vitest';
import { countryToLanguage, isLocaleAgnosticPath, parseLocaleCookie, decideLanguageRedirect } from './geo.mjs';

describe('countryToLanguage', () => {
  it('maps TR to tr, else en', () => {
    expect(countryToLanguage('TR')).toBe('tr');
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

describe('parseLocaleCookie', () => {
  it('reads a valid locale', () => {
    expect(parseLocaleCookie('a=1; locale=tr; b=2')).toBe('tr');
    expect(parseLocaleCookie('locale=en')).toBe('en');
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
});
