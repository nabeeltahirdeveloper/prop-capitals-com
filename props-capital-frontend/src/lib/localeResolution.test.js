import { describe, it, expect } from 'vitest';
import { pickInitialValue } from './localeResolution.js';

describe('pickInitialValue', () => {
  it('uses geo value when not manual', () => {
    expect(pickInitialValue({ saved: 'en', manual: false, geoValue: 'tr', fallback: 'en' })).toBe('tr');
  });
  it('keeps saved value when manual (geo never overrides)', () => {
    expect(pickInitialValue({ saved: 'en', manual: true, geoValue: 'tr', fallback: 'en' })).toBe('en');
  });
  it('falls back to saved when no geo value', () => {
    expect(pickInitialValue({ saved: 'fr', manual: false, geoValue: null, fallback: 'en' })).toBe('fr');
  });
  it('falls back to default when nothing else', () => {
    expect(pickInitialValue({ saved: null, manual: false, geoValue: null, fallback: 'en' })).toBe('en');
  });
  it('ignores geo when manual even if saved is null (uses fallback)', () => {
    expect(pickInitialValue({ saved: null, manual: true, geoValue: 'tr', fallback: 'en' })).toBe('tr');
  });
});
