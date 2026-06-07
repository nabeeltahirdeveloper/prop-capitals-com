/** Canonical challenge fee amounts — same numeric value for EUR, GBP, and USD display. */

export const CANONICAL_ACCOUNT_SIZES = [5000, 10000, 20000, 30000, 50000, 100000, 200000];

const FULL_PRICE_OVERRIDES = {
  '2-step:20K': 397,
  'two_phase:20K': 397,
  'one_phase:20K': 477,
  '1-step:20K': 477,
};

export const formatAccountSizeKey = (size) => {
  if (!size) return '';
  if (size >= 1_000_000) return `${size / 1_000_000}M`;
  if (size >= 1000) return `${size / 1000}K`;
  return String(size);
};

export const normalizeChallengeType = (type) => {
  if (!type) return '';
  const t = String(type).toLowerCase();
  if (t === 'one_phase' || t === '1-step' || t === 'one-step' || t === 'one-phase') return '1-step';
  if (t === 'two_phase' || t === '2-step' || t === 'two-step' || t === 'two-phase') return '2-step';
  return t;
};

export const getFullPrice = (challengeType, sizeKey, discountedPrice) => {
  const key = `${normalizeChallengeType(challengeType)}:${sizeKey}`;
  if (FULL_PRICE_OVERRIDES[key] != null) return FULL_PRICE_OVERRIDES[key];
  return discountedPrice * 3;
};

export const formatChallengePriceLabel = (challenge, currency = 'EUR') => {
  const sym = currency === 'GBP' ? '£' : '€';
  const size = challenge.accountSize ?? challenge.account_size;
  const sizeKey = formatAccountSizeKey(size);
  const type = challenge.challengeType ?? challenge.challenge_type;
  const price = challenge.price;
  if (price == null) return challenge.name || '';
  const full = getFullPrice(type, sizeKey, price);
  const step = normalizeChallengeType(type) === '1-step' ? '1 step' : '2 step';
  return `${sizeKey} ${step} — ${sym}${full.toLocaleString('en-US')} → ${sym}${price.toLocaleString('en-US')}`;
};

export const isCanonicalAccountSize = (size) => CANONICAL_ACCOUNT_SIZES.includes(Number(size));
