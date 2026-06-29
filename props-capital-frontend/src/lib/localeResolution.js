// Pure: decides the initial language/currency value at app init.
// manual + saved  -> saved (a real prior choice is locked; geo never overrides)
// otherwise       -> geoValue ?? saved ?? fallback
export function pickInitialValue({ saved, manual, geoValue, fallback }) {
  if (manual && saved) return saved;
  return geoValue ?? saved ?? fallback;
}
