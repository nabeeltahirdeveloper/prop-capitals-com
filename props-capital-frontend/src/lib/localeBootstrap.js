import { VALID_LOCALES } from './localeUrl';

// One-time: if an existing user has a saved `language` but no `locale` cookie, seed the
// cookie from it so the server's root redirect (server.mjs) honors their prior choice.
export function seedLocaleCookieFromSavedLanguage(doc, store) {
  const d = doc ?? (typeof document !== 'undefined' ? document : null);
  const s = store ?? (typeof localStorage !== 'undefined' ? localStorage : null);
  if (!d || !s) return;
  if (s.getItem('localeCookieSeeded') === '1') return;
  const hasCookie = /(?:^|;\s*)locale=/.test(d.cookie || '');
  if (!hasCookie) {
    const saved = s.getItem('language');
    if (saved && VALID_LOCALES.includes(saved)) {
      d.cookie = `locale=${saved}; Path=/; Max-Age=2592000; SameSite=Lax`;
    }
  }
  s.setItem('localeCookieSeeded', '1');
}
