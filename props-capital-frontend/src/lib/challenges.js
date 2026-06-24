// Single source of truth for turning the canonical `/challenges` API payload
// into the grouped shape every surface renders (public /challenges, Home,
// trader + public Buy Challenge). No surface should re-derive this locally.

/** Per-type presentation metadata. NOT stored in the DB — it's display copy
 *  keyed by `challengeType`. Numeric specs (targets, drawdown, split, price)
 *  always come from the API record. */
export const CHALLENGE_TYPE_CONFIG = {
  one_phase: {
    name: '1-Step Challenge',
    badge: 'Most Popular',
    description: 'Quick evaluation with achievable targets and best value for traders',
    phases: 1,
    popular: true,
    leverage: '1:30',
  },
  two_phase: {
    name: '2-Step Challenge',
    badge: 'Best Split',
    description: 'Traditional evaluation with highest profit split potential',
    phases: 2,
    popular: false,
    leverage: '1:50',
  },
  instant_funding: {
    name: 'Instant Funding',
    badge: 'No Evaluation',
    description: 'Skip the evaluation and start trading immediately',
    phases: 0,
    popular: false,
    leverage: '1:30',
  },
};

/** 5000 -> "5K", 750 -> "750". */
export function formatAccountSize(size) {
  if (size >= 1000) return `${size / 1000}K`;
  return String(size);
}

/**
 * Group raw API challenges into `{ accountSizes, challengeTypes }`.
 *
 * - `accountSizes`: unique sizes ascending as `{ key: "5K", value: 5000 }`
 *   (the same shape the hardcoded Home arrays used). Format labels at render
 *   time via `formatSize(size.key)` so this stays currency-agnostic.
 * - `challengeTypes`: one entry per `challengeType` present, merging the
 *   presentation config with API-derived specs and a `prices` map keyed by
 *   size label ("5K" -> price).
 */
export function groupChallengesByType(rawChallenges = []) {
  if (!rawChallenges.length) return { accountSizes: [], challengeTypes: [] };

  const sizeSet = new Set();
  rawChallenges.forEach((c) => sizeSet.add(c.accountSize));
  const accountSizes = Array.from(sizeSet)
    .sort((a, b) => a - b)
    .map((value) => ({ key: formatAccountSize(value), value }));

  const grouped = {};
  rawChallenges.forEach((c) => {
    const type = c.challengeType || 'two_phase';
    if (!grouped[type]) grouped[type] = [];
    grouped[type].push(c);
  });

  const challengeTypes = Object.entries(grouped).map(([type, challenges]) => {
    const config =
      CHALLENGE_TYPE_CONFIG[type] || {
        name: type.replace(/_/g, ' '),
        badge: '',
        description: '',
        phases: 1,
        popular: false,
        leverage: '',
      };
    const first = challenges[0];

    const prices = {};
    challenges.forEach((c) => {
      prices[formatAccountSize(c.accountSize)] = c.price;
    });

    const profitTarget =
      first.phase1TargetPercent && first.phase2TargetPercent && config.phases === 2
        ? `${first.phase1TargetPercent}% / ${first.phase2TargetPercent}%`
        : `${first.phase1TargetPercent}%`;

    return {
      id: type,
      ...config,
      profitTarget,
      dailyDrawdown: `${first.dailyDrawdownPercent}%`,
      maxDrawdown: `${first.overallDrawdownPercent}%`,
      profitSplit: `${first.profitSplit}%`,
      minDays: first.minTradingDays ? `${first.minTradingDays} days` : 'None',
      prices,
      // Raw record kept for comparison tables / detail views.
      _raw: first,
    };
  });

  return { accountSizes, challengeTypes };
}
