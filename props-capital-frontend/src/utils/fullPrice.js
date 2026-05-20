// Marketing "Full Price" overrides for rows where the default `price × 3`
// strikethrough formula doesn't match the desired display value.
// Challenge type ids vary across views ('one_phase' / '1-step' / '2-step' / etc.),
// so we normalize before lookup. Size keys are '5K', '10K', '20K', etc.
const FULL_PRICE_OVERRIDES = {
  '2-step:20K': 397,
};

const normalizeChallengeType = (type) => {
  if (!type) return '';
  const t = String(type).toLowerCase();
  if (t === 'one_phase' || t === '1-step' || t === 'one-step' || t === 'one-phase') return '1-step';
  if (t === 'two_phase' || t === '2-step' || t === 'two-step' || t === 'two-phase') return '2-step';
  return t;
};

export const getFullPrice = (challengeType, sizeKey, price) => {
  const key = `${normalizeChallengeType(challengeType)}:${sizeKey}`;
  if (FULL_PRICE_OVERRIDES[key] != null) return FULL_PRICE_OVERRIDES[key];
  return price * 3;
};
