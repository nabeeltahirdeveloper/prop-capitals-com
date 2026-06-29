import { describe, it, expect, beforeEach } from 'vitest';
import { migrateLocalePrefs } from './migrateLocalePrefs.js';

function makeStorage(initial = {}) {
  const data = { ...initial };
  return {
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = String(v); },
    _data: data,
  };
}

describe('migrateLocalePrefs', () => {
  it('grandfathers pre-existing language/currency as manual', () => {
    const s = makeStorage({ language: 'en', currency: 'GBP' });
    migrateLocalePrefs(s);
    expect(s.getItem('langManuallySet')).toBe('1');
    expect(s.getItem('currencyManuallySet')).toBe('1');
    expect(s.getItem('localePrefsMigrated')).toBe('1');
  });

  it('does NOT set flags for a brand-new visitor (no saved prefs)', () => {
    const s = makeStorage({});
    migrateLocalePrefs(s);
    expect(s.getItem('langManuallySet')).toBeNull();
    expect(s.getItem('currencyManuallySet')).toBeNull();
    expect(s.getItem('localePrefsMigrated')).toBe('1');
  });

  it('is idempotent — does not re-grandfather after first run', () => {
    const s = makeStorage({}); // new visitor
    migrateLocalePrefs(s);
    // Later, geo persists a language value (NOT a manual choice):
    s.setItem('language', 'tr');
    migrateLocalePrefs(s); // second run must be a no-op
    expect(s.getItem('langManuallySet')).toBeNull();
  });
});
