// One-time migration: treat any pre-existing saved preference as "manual" so
// geo-detection never changes what an existing user already sees. Guarded so it
// runs only at the upgrade moment (not for values geo persists later).
export function migrateLocalePrefs(storage) {
  const store =
    storage ?? (typeof localStorage !== 'undefined' ? localStorage : null);
  if (!store) return;
  if (store.getItem('localePrefsMigrated') === '1') return;
  if (store.getItem('language') != null) store.setItem('langManuallySet', '1');
  if (store.getItem('currency') != null) store.setItem('currencyManuallySet', '1');
  store.setItem('localePrefsMigrated', '1');
}
