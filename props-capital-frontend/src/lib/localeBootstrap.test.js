import { describe, it, expect } from 'vitest';
import { seedLocaleCookieFromSavedLanguage } from './localeBootstrap.js';

function fakeStore(initial = {}) {
  const data = { ...initial };
  return { getItem: (k) => (k in data ? data[k] : null), setItem: (k, v) => { data[k] = String(v); } };
}
const fakeDoc = (cookie = '') => ({ cookie });

describe('seedLocaleCookieFromSavedLanguage', () => {
  it('seeds the locale cookie from a saved tr language', () => {
    const doc = fakeDoc('');
    const store = fakeStore({ language: 'tr' });
    seedLocaleCookieFromSavedLanguage(doc, store);
    expect(doc.cookie).toContain('locale=tr');
    expect(store.getItem('localeCookieSeeded')).toBe('1');
  });
  it('seeds the locale cookie from a saved kk language', () => {
    const doc = fakeDoc('');
    const store = fakeStore({ language: 'kk' });
    seedLocaleCookieFromSavedLanguage(doc, store);
    expect(doc.cookie).toContain('locale=kk');
    expect(store.getItem('localeCookieSeeded')).toBe('1');
  });
  it('does not overwrite an existing locale cookie', () => {
    const doc = fakeDoc('locale=en');
    const store = fakeStore({ language: 'tr' });
    seedLocaleCookieFromSavedLanguage(doc, store);
    expect(doc.cookie).toBe('locale=en');
  });
  it('does nothing for a brand-new visitor (no saved language)', () => {
    const doc = fakeDoc('');
    const store = fakeStore({});
    seedLocaleCookieFromSavedLanguage(doc, store);
    expect(doc.cookie).toBe('');
    expect(store.getItem('localeCookieSeeded')).toBe('1');
  });
  it('is one-time (guard prevents re-seeding)', () => {
    const doc = fakeDoc('');
    const store = fakeStore({});
    seedLocaleCookieFromSavedLanguage(doc, store); // marks seeded
    store.setItem('language', 'tr');               // later, language set
    seedLocaleCookieFromSavedLanguage(doc, store); // must be a no-op
    expect(doc.cookie).toBe('');
  });
});
