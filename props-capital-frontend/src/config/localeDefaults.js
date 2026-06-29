// Country (ISO 3166-1 alpha-2) -> default language + currency.
// Add more countries here, one line each.
export const COUNTRY_DEFAULTS = {
  TR: { language: 'tr', currency: 'TRY' },
};

export function getDefaultsForCountry(code) {
  if (!code) return null;
  return COUNTRY_DEFAULTS[String(code).toUpperCase()] ?? null;
}
