export const VALID_LOCALES = ['en', 'tr', 'kk'];
export const DEFAULT_LOCALE = 'en';

// Every non-default locale gets a URL prefix equal to its code: /tr, /kk.
const PREFIXED_LOCALES = VALID_LOCALES.filter((l) => l !== DEFAULT_LOCALE);
const PREFIX_RE = new RegExp(`^/(${PREFIXED_LOCALES.join('|')})(/|$)`);

export function localeFromPath(pathname) {
  const p = (pathname || '/').replace(/\/+$/, '') || '/';
  const m = p.match(PREFIX_RE);
  return m ? m[1] : DEFAULT_LOCALE;
}

export function basenameForPath(pathname) {
  const loc = localeFromPath(pathname);
  return loc === DEFAULT_LOCALE ? '' : '/' + loc;
}

// Build the full URL for `locale`, reusing the rest of the current location.
export function urlForLocale(locale, { pathname = '/', search = '', hash = '' } = {}) {
  let bare = (pathname || '/').replace(PREFIX_RE, '/'); // strip an existing /tr or /kk
  if (!bare.startsWith('/')) bare = '/' + bare;
  bare = bare.replace(/\/+$/, '') || '/';
  const out =
    locale === DEFAULT_LOCALE ? bare : bare === '/' ? '/' + locale : '/' + locale + bare;
  return out + (search || '') + (hash || '');
}
