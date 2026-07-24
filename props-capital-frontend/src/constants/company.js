// Single source of truth for the registered company address shown across the
// public site (footers, contact, legal pages). Update here, not inline.
export const COMPANY_NAME = 'BLUEHAVEN MANAGEMENT LTD';
export const COMPANY_REGISTRATION_NUMBER = '16797169';

/** Address as separate lines, for multi-line blocks. */
export const COMPANY_ADDRESS_LINES = [
  'Sugar House Island, Office 214',
  '16 Upper Woburn Place',
  'London WC1H 0AF, United Kingdom',
];

/** Comma-joined address, for inline / single-line contexts. */
export const COMPANY_ADDRESS = COMPANY_ADDRESS_LINES.join(', ');
