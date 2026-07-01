export function pickCountry(result) {
  if (!result || typeof result !== 'object') return '';
  const code = result.country_code ?? result.country ?? '';
  return typeof code === 'string' && /^[A-Za-z]{2}$/.test(code) ? code.toUpperCase() : '';
}

export function isPrivateIp(ip) {
  if (!ip) return true;
  if (ip === '::1' || ip === '0.0.0.0') return true;
  if (ip.startsWith('127.') || ip.startsWith('::ffff:127.')) return true;
  if (ip.startsWith('10.') || ip.startsWith('192.168.')) return true;
  const m = ip.match(/^172\.(\d{1,3})\./);
  if (m) {
    const o = Number(m[1]);
    if (o >= 16 && o <= 31) return true;
  }
  if (ip.startsWith('fc') || ip.startsWith('fd')) return true; // IPv6 ULA
  return false;
}

export function clientIpFromHeaders({ xForwardedFor, xRealIp, remoteAddress } = {}) {
  const xff = (xForwardedFor || '').split(',')[0].trim();
  return xff || (xRealIp || '').trim() || (remoteAddress || '').trim() || null;
}

export function buildGeoCookie(code, { secure } = {}) {
  const maxAge = code ? 2592000 : 600; // 30d on success; 10min on empty so it retries
  let cookie = `geo_country=${code}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
  if (secure) cookie += '; Secure';
  return cookie;
}

export async function lookupCountry(ip, { token, fetchImpl = fetch, timeoutMs = 1500 } = {}) {
  if (!token || isPrivateIp(ip)) return '';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchImpl(`https://api.ipinfo.io/lite/${encodeURIComponent(ip)}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    });
    if (!res.ok) return '';
    return pickCountry(await res.json());
  } catch {
    return '';
  } finally {
    clearTimeout(timer);
  }
}

const COUNTRY_LANGUAGE = { TR: 'tr', KZ: 'kk' };
export function countryToLanguage(country) {
  return COUNTRY_LANGUAGE[country] || 'en';
}

// Non-default locales that carry a URL prefix (/tr, /kk). Keep in sync with COUNTRY_LANGUAGE values.
const PREFIXED_LOCALES = ['tr', 'kk'];
export function isLocalePrefixedPath(path) {
  return new RegExp(`^/(${PREFIXED_LOCALES.join('|')})(/|$)`).test(path || '/');
}

export function isLocaleAgnosticPath(path) {
  const p = path || '/';
  return /^\/(q|pay)(\/|$)/.test(p) || /^\/set-password(\/|$)/.test(p);
}

export function parseLocaleCookie(cookieHeader) {
  const m = (cookieHeader || '').match(/(?:^|;\s*)locale=([^;]*)/);
  if (!m) return null;
  const v = decodeURIComponent(m[1]).trim().toLowerCase();
  return v === 'en' || PREFIXED_LOCALES.includes(v) ? v : null;
}

// Returns a redirect target (e.g. '/kk/Challenges') for an unprefixed visitor whose
// resolved locale is non-default, or null to serve as-is. Never redirects a path that is
// already under any locale prefix (/tr, /kk) or a locale-agnostic path.
export function decideLanguageRedirect({ path, localeCookie, country }) {
  const p = path || '/';
  if (isLocalePrefixedPath(p)) return null;
  if (isLocaleAgnosticPath(p)) return null;
  const locale = localeCookie || countryToLanguage(country || '');
  if (locale === 'en') return null;
  return p === '/' ? '/' + locale : '/' + locale + p;
}
