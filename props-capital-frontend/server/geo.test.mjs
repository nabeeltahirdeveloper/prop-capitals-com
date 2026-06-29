import { describe, it, expect } from 'vitest';
import {
  pickCountry,
  isPrivateIp,
  clientIpFromHeaders,
  buildGeoCookie,
  lookupCountry,
} from './geo.mjs';

describe('pickCountry', () => {
  it('reads country_code from the Lite response', () => {
    expect(pickCountry({ country_code: 'tr', country: 'Turkey' })).toBe('TR');
  });
  it('falls back to classic country field', () => {
    expect(pickCountry({ country: 'US' })).toBe('US');
  });
  it('returns empty for missing/garbage', () => {
    expect(pickCountry(null)).toBe('');
    expect(pickCountry({})).toBe('');
    expect(pickCountry({ country_code: 'Turkey' })).toBe('');
  });
});

describe('isPrivateIp', () => {
  it('flags loopback and private ranges', () => {
    for (const ip of ['127.0.0.1', '::1', '10.1.2.3', '192.168.0.5', '172.16.0.1', '172.31.255.1']) {
      expect(isPrivateIp(ip)).toBe(true);
    }
  });
  it('treats nullish as private (skip lookup)', () => {
    expect(isPrivateIp(null)).toBe(true);
  });
  it('passes public IPs', () => {
    expect(isPrivateIp('8.8.8.8')).toBe(false);
    expect(isPrivateIp('178.233.1.1')).toBe(false);
  });
});

describe('clientIpFromHeaders', () => {
  it('takes the first hop of X-Forwarded-For', () => {
    expect(clientIpFromHeaders({ xForwardedFor: '203.0.113.9, 10.0.0.1' })).toBe('203.0.113.9');
  });
  it('falls back to X-Real-IP then remoteAddress', () => {
    expect(clientIpFromHeaders({ xRealIp: '203.0.113.7' })).toBe('203.0.113.7');
    expect(clientIpFromHeaders({ remoteAddress: '203.0.113.5' })).toBe('203.0.113.5');
  });
  it('returns null when nothing present', () => {
    expect(clientIpFromHeaders({})).toBeNull();
  });
});

describe('buildGeoCookie', () => {
  it('builds a 30-day Secure cookie on success', () => {
    const c = buildGeoCookie('TR', { secure: true });
    expect(c).toContain('geo_country=TR');
    expect(c).toContain('Max-Age=2592000');
    expect(c).toContain('SameSite=Lax');
    expect(c).toContain('Secure');
    expect(c).not.toContain('HttpOnly');
  });
  it('uses a short TTL and omits Secure when empty/non-https', () => {
    const c = buildGeoCookie('', { secure: false });
    expect(c).toContain('geo_country=;');
    expect(c).toContain('Max-Age=600');
    expect(c).not.toContain('Secure');
  });
});

describe('lookupCountry', () => {
  const ok = (data) => async () => ({ ok: true, json: async () => data });
  it('returns the country for a public IP', async () => {
    const code = await lookupCountry('8.8.8.8', { token: 't', fetchImpl: ok({ country_code: 'TR' }) });
    expect(code).toBe('TR');
  });
  it('skips lookup for private IPs', async () => {
    let called = false;
    await lookupCountry('127.0.0.1', { token: 't', fetchImpl: async () => { called = true; return ok({})(); } });
    expect(called).toBe(false);
  });
  it('skips when no token', async () => {
    expect(await lookupCountry('8.8.8.8', { token: '', fetchImpl: ok({ country_code: 'TR' }) })).toBe('');
  });
  it('returns empty on non-ok response', async () => {
    expect(await lookupCountry('8.8.8.8', { token: 't', fetchImpl: async () => ({ ok: false }) })).toBe('');
  });
  it('returns empty when fetch throws', async () => {
    expect(await lookupCountry('8.8.8.8', { token: 't', fetchImpl: async () => { throw new Error('net'); } })).toBe('');
  });
});
