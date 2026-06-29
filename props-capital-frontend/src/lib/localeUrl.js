export const VALID_LOCALES = ['en', 'tr'];
export const DEFAULT_LOCALE = 'en';

const TR_PREFIX_RE = /^\/tr(\/|$)/;

export function localeFromPath(pathname) {
  const p = (pathname || '/').replace(/\/+$/, '') || '/';
  return TR_PREFIX_RE.test(p) ? 'tr' : 'en';
}

export function basenameForPath(pathname) {
  return localeFromPath(pathname) === 'tr' ? '/tr' : '';
}

// Build the full URL for `locale`, reusing the rest of the current location.
export function urlForLocale(locale, { pathname = '/', search = '', hash = '' } = {}) {
  let bare = (pathname || '/').replace(TR_PREFIX_RE, '/'); // strip an existing /tr
  if (!bare.startsWith('/')) bare = '/' + bare;
  bare = bare.replace(/\/+$/, '') || '/';
  const out = locale === 'tr' ? (bare === '/' ? '/tr' : '/tr' + bare) : bare;
  return out + (search || '') + (hash || '');
}
