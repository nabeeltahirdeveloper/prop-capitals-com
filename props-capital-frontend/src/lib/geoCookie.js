// Reads the geo_country cookie synchronously. Injectable cookieString for tests.
export function readGeoCountry(cookieString) {
  const src =
    cookieString ?? (typeof document !== 'undefined' ? document.cookie : '');
  if (!src) return null;
  const match = src.match(/(?:^|;\s*)geo_country=([^;]*)/);
  if (!match) return null;
  // [^;]* can capture trailing whitespace before the next "; " — .trim() is load-bearing.
  const value = decodeURIComponent(match[1]).trim().toUpperCase();
  return value.length === 2 ? value : null;
}
