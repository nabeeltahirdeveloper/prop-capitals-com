import { describe, it, expect } from 'vitest';
import { displayTicketSubject } from './ticketSubject.js';

// Minimal fake t(): mirrors the real supportPanel keys used by the util.
const t = (key, params) => {
  const map = {
    'supportPanel.autoSubject': `Destek Talebi - ${params?.category ?? ''}`,
    'supportPanel.categoryAccount': 'Hesap',
    'supportPanel.categoryPayment': 'Ödeme',
    'supportPanel.categoryPayout': 'Kazanç Ödemesi',
    'supportPanel.categoryTechnical': 'Teknik',
    'supportPanel.categoryOther': 'Diğer',
  };
  return map[key] ?? key;
};

describe('displayTicketSubject', () => {
  it('translates an auto-generated subject using the ticket category', () => {
    expect(displayTicketSubject('Support Request - Payout', 'payout', t)).toBe('Destek Talebi - Kazanç Ödemesi');
  });
  it('derives the category from the subject when none is passed', () => {
    expect(displayTicketSubject('Support Request - Account', undefined, t)).toBe('Destek Talebi - Hesap');
  });
  it('handles the raw enum category casing (PAYOUT)', () => {
    expect(displayTicketSubject('Support Request - Payout', 'PAYOUT', t)).toBe('Destek Talebi - Kazanç Ödemesi');
  });
  it('leaves a user-typed subject unchanged', () => {
    expect(displayTicketSubject('Regarding candles', 'other', t)).toBe('Regarding candles');
  });
  it('passes through empty/nullish subjects', () => {
    expect(displayTicketSubject('', 'other', t)).toBe('');
    expect(displayTicketSubject(null, 'other', t)).toBe(null);
  });
});
