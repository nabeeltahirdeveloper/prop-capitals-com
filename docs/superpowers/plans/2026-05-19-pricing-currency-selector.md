# Pricing Restructure + Currency/Language Selectors + Trustpilot/Company Fixes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure challenge pricing, add an EUR/GBP display-only currency selector and the (currently missing) language selector to the navbar, add the legal company name to Terms/Privacy, and fix the Trustpilot block on the About page.

**Architecture:** Pricing base values live in two synced sources — the backend Prisma seed (`seed-challenges.ts`, authoritative for the Challenges page + payments) and frontend `mockData.js` (home section + calculator). A new frontend `CurrencyContext` provides display-only formatting: challenge **fees** convert EUR→GBP at a fixed constant; account-size labels and calculator amounts only swap the currency symbol (matching InstantPropFunding). GBP never changes the actual payment, which stays EUR. The language selector already exists but was never mounted; we wire its provider/component into the app.

**Tech Stack:** React 18 + Vite, Tailwind, Radix UI `Select`, React Context; NestJS + Prisma (backend seed only). No frontend test runner exists — verification is `yarn build` + `eslint` + Playwright visual checks (matches the codebase; introducing a test framework is out of scope).

**Branch:** `feature/pricing-currency-selector` (already created off `master`). Commit per task. **No co-author trailer. No push.**

**Canonical EUR sale prices (used in Tasks 1 & 2):**

| Size | 1-Step | 2-Step |
|------|--------|--------|
| 5K   | 69  | 59  |
| 10K  | 99  | 79  |
| 20K  | 159 | 129 |
| 30K  | 219 | 179 |
| 50K  | 349 | 299 |
| 100K | 599 | 499 |
| 200K | 999 | 799 |

Account sizes: `5000, 10000, 20000, 30000, 50000, 100000, 200000` (2K and 25K removed).

---

## Task 1: Backend pricing seed

**Files:**
- Modify: `props-capital-backend/prisma/seed-challenges.ts:5-27`

- [ ] **Step 1: Update account sizes and price map**

Replace lines 5–27 (`accountSizes` array through the end of the `priceMap` object literal) with:

```ts
const accountSizes = [5000, 10000, 20000, 30000, 50000, 100000, 200000];
const challengeTypes = ['one_phase', 'two_phase'] as const;

const priceMap = {
  one_phase: {
    5000: 69,
    10000: 99,
    20000: 159,
    30000: 219,
    50000: 349,
    100000: 599,
    200000: 999,
  },
  two_phase: {
    5000: 59,
    10000: 79,
    20000: 129,
    30000: 179,
    50000: 299,
    100000: 499,
    200000: 799,
  },
} as const;
```

(The seed's Step-1 `updateMany({ data: { isActive: false } })` already deactivates the now-removed 2K/25K rows; no other change needed.)

- [ ] **Step 2: Typecheck the backend build**

Run: `cd props-capital-backend && yarn build`
Expected: PASS (`nest build` completes with no TypeScript errors). If `prisma generate` fails for unrelated env reasons, instead run `npx tsc --noEmit -p tsconfig.json` and expect no errors in `prisma/seed-challenges.ts`.

- [ ] **Step 3: Commit**

```bash
git add props-capital-backend/prisma/seed-challenges.ts
git commit -m "feat(pricing): restructure backend challenge sizes and EUR prices"
```

> Note: re-running `yarn db:seed` against a database is a deployment/ops step, not part of this code change. Do **not** run it here.

---

## Task 2: Frontend pricing data (mockData + HowItWorks)

**Files:**
- Modify: `props-capital-frontend/src/components/home/data/mockData.js:175-215`
- Modify: `props-capital-frontend/src/pages/HowItWorks.jsx:15-22`

- [ ] **Step 1: Update `challengeTypes` prices in mockData.js**

Replace the `prices: { ... }` block of the `one-step` object (lines 175–182) with:

```js
    prices: {
      "5K": 69,
      "10K": 99,
      "20K": 159,
      "30K": 219,
      "50K": 349,
      "100K": 599,
      "200K": 999,
    },
```

Replace the `prices: { ... }` block of the `two-step` object (lines 197–204) with:

```js
    prices: {
      "5K": 59,
      "10K": 79,
      "20K": 129,
      "30K": 179,
      "50K": 299,
      "100K": 499,
      "200K": 799,
    },
```

- [ ] **Step 2: Replace the `accountSizes` export in mockData.js**

Replace lines 208–215 (the whole `export const accountSizes = [ ... ];`) with (note: `label` is removed — labels are now currency-aware and built in the components):

```js
export const accountSizes = [
  { value: 5000, key: "5K" },
  { value: 10000, key: "10K" },
  { value: 20000, key: "20K" },
  { value: 30000, key: "30K" },
  { value: 50000, key: "50K" },
  { value: 100000, key: "100K" },
  { value: 200000, key: "200K" },
];
```

- [ ] **Step 3: Update the hardcoded sizes in HowItWorks.jsx**

Replace lines 15–22 (the local `const accountSizes = [ ... ];`) with:

```js
  const accountSizes = [
    { label: '€5K', value: 5000 },
    { label: '€10K', value: 10000 },
    { label: '€20K', value: 20000 },
    { label: '€30K', value: 30000 },
    { label: '€50K', value: 50000 },
    { label: '€100K', value: 100000 },
    { label: '€200K', value: 200000 }
  ];
```

Then update the copy on line ~50 if it references `$5K to $200K`: search HowItWorks.jsx for `$5K` and `$200K` and replace that phrase with `€5K to €200K`.

- [ ] **Step 4: Lint**

Run: `cd props-capital-frontend && npx eslint src/components/home/data/mockData.js src/pages/HowItWorks.jsx`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add props-capital-frontend/src/components/home/data/mockData.js props-capital-frontend/src/pages/HowItWorks.jsx
git commit -m "feat(pricing): restructure frontend challenge sizes and EUR prices"
```

---

## Task 3: CurrencyContext

**Files:**
- Create: `props-capital-frontend/src/contexts/CurrencyContext.jsx`

- [ ] **Step 1: Create the context**

Create `props-capital-frontend/src/contexts/CurrencyContext.jsx` with exactly:

```jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

// Display-only EUR -> GBP rate. Change this single constant to retune GBP pricing.
export const EUR_TO_GBP_RATE = 0.85;

export const supportedCurrencies = [
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
];

const CurrencyContext = createContext(null);

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState(() => {
    const stored = localStorage.getItem('currency');
    return stored === 'GBP' ? 'GBP' : 'EUR';
  });

  useEffect(() => {
    localStorage.setItem('currency', currency);
  }, [currency]);

  const value = useMemo(() => {
    const symbol = currency === 'GBP' ? '£' : '€';

    // Challenge fees convert at the fixed rate (e.g. €159 -> £135).
    const formatFee = (eurAmount) => {
      const n = currency === 'GBP'
        ? Math.round(eurAmount * EUR_TO_GBP_RATE)
        : Math.round(eurAmount);
      return `${symbol}${n.toLocaleString('en-US')}`;
    };

    // Notional amounts (account size, calculator output) only swap the
    // symbol — the number is unchanged, matching InstantPropFunding.
    const formatAmount = (amount) =>
      `${symbol}${Math.round(amount).toLocaleString('en-US')}`;

    // Account-size label, e.g. "€5K" / "£5K".
    const formatSize = (key) => `${symbol}${key}`;

    return { currency, setCurrency, symbol, formatFee, formatAmount, formatSize };
  }, [currency]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
};

export const useCurrency = () => {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within a CurrencyProvider');
  return ctx;
};
```

- [ ] **Step 2: Lint**

Run: `cd props-capital-frontend && npx eslint src/contexts/CurrencyContext.jsx`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add props-capital-frontend/src/contexts/CurrencyContext.jsx
git commit -m "feat(currency): add display-only CurrencyContext (EUR/GBP)"
```

---

## Task 4: CurrencySwitcher + LanguageSwitcher theming, mount providers

**Files:**
- Create: `props-capital-frontend/src/components/CurrencySwitcher.jsx`
- Modify: `props-capital-frontend/src/components/LanguageSwitcher.jsx` (theme-aware)
- Modify: `props-capital-frontend/src/App.jsx:5-7,23-34`

- [ ] **Step 1: Create CurrencySwitcher.jsx**

Create `props-capital-frontend/src/components/CurrencySwitcher.jsx` with exactly:

```jsx
import React from 'react';
import { useCurrency, supportedCurrencies } from '@/contexts/CurrencyContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function CurrencySwitcher() {
  const { currency, setCurrency, symbol } = useCurrency();
  const { isDark } = useTheme();

  return (
    <Select value={currency} onValueChange={setCurrency}>
      <SelectTrigger
        className={`w-[104px] rounded-full h-10 ${
          isDark
            ? 'bg-white/10 border-white/10 text-gray-200'
            : 'bg-slate-100 border-slate-200 text-slate-700'
        }`}
        aria-label="Currency"
      >
        <SelectValue>
          <span className="font-semibold">{symbol} {currency}</span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {supportedCurrencies.map((c) => (
          <SelectItem key={c.code} value={c.code}>
            <span className="font-semibold mr-1">{c.symbol}</span>
            <span className="font-medium mr-2">{c.code}</span>
            <span className="text-muted-foreground">{c.name}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

- [ ] **Step 2: Make LanguageSwitcher theme-aware**

Replace the entire body of `props-capital-frontend/src/components/LanguageSwitcher.jsx` with:

```jsx
import React from 'react';
import { useTranslation, supportedLanguages } from '../contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Globe } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useTranslation();
  const { isDark } = useTheme();

  return (
    <div className="flex items-center gap-2">
      <Globe className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-slate-500'}`} />
      <Select value={language} onValueChange={setLanguage}>
        <SelectTrigger
          className={`w-[130px] rounded-full h-10 ${
            isDark
              ? 'bg-white/10 border-white/10 text-gray-200'
              : 'bg-slate-100 border-slate-200 text-slate-700'
          }`}
          aria-label="Language"
        >
          <SelectValue placeholder="Language" />
        </SelectTrigger>
        <SelectContent>
          {supportedLanguages.map((lang) => (
            <SelectItem key={lang.code} value={lang.code}>
              {lang.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
```

- [ ] **Step 3: Mount CurrencyProvider + LanguageProvider in App.jsx**

In `props-capital-frontend/src/App.jsx`, add imports after line 7 (`import { TradingProvider } ...`):

```jsx
import { CurrencyProvider } from '@/contexts/CurrencyContext'
import { LanguageProvider } from '@/contexts/LanguageContext'
```

Then replace the provider tree (lines 23–34) with:

```jsx
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
        <CurrencyProvider>
        <TradingProvider>
        <AuthProvider>
          <Pages />
          <Toaster />
          <ChatSupport />
          {/* <SocialProofNotification /> */}
        </AuthProvider>
        </TradingProvider>
        </CurrencyProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
```

- [ ] **Step 4: Lint**

Run: `cd props-capital-frontend && npx eslint src/components/CurrencySwitcher.jsx src/components/LanguageSwitcher.jsx src/App.jsx`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add props-capital-frontend/src/components/CurrencySwitcher.jsx props-capital-frontend/src/components/LanguageSwitcher.jsx props-capital-frontend/src/App.jsx
git commit -m "feat(nav): add CurrencySwitcher, theme-aware LanguageSwitcher, mount providers"
```

---

## Task 5: Render switchers in the Navbar (desktop + mobile)

**Files:**
- Modify: `props-capital-frontend/src/components/Navbar.jsx:2-6` (imports), `:82-93` (desktop), `:150-178` (mobile)

- [ ] **Step 1: Add imports**

In `props-capital-frontend/src/components/Navbar.jsx`, after line 6 (`import { useAuth } ...`) add:

```jsx
import CurrencySwitcher from '@/components/CurrencySwitcher';
import LanguageSwitcher from '@/components/LanguageSwitcher';
```

- [ ] **Step 2: Add switchers to the desktop cluster**

In the desktop right-side block, the existing Theme Toggle button ends at line 93 (`</button>`) followed by the divider `<div className={`w-px h-6 ...`}></div>` on line 95. Insert the switchers between the theme toggle `</button>` and that divider:

```jsx
            </button>

            <LanguageSwitcher />
            <CurrencySwitcher />

            <div className={`w-px h-6 ${isDark ? 'bg-white/10' : 'bg-slate-200'} mx-2`}></div>
```

(Only the `<LanguageSwitcher />` and `<CurrencySwitcher />` lines are new; the surrounding lines already exist and pin the insertion point.)

- [ ] **Step 3: Add switchers to the mobile menu**

In the Mobile Menu block, the `navLinks.map(...)` closes with `))}` immediately before the `{!user && (` login link. Insert a switcher row right after that `))}` and before `{!user && (`:

```jsx
            ))}

            <div className="flex items-center gap-2 px-2 py-3">
              <LanguageSwitcher />
              <CurrencySwitcher />
            </div>

            {!user && (
```

- [ ] **Step 4: Build the frontend**

Run: `cd props-capital-frontend && yarn build`
Expected: PASS (`node build.mjs` completes, no errors).

- [ ] **Step 5: Commit**

```bash
git add props-capital-frontend/src/components/Navbar.jsx
git commit -m "feat(nav): render currency and language selectors in navbar"
```

---

## Task 6: Apply currency formatting to marketing price surfaces

**Files:**
- Modify: `props-capital-frontend/src/components/home/ChallengesSection.jsx`
- Modify: `props-capital-frontend/src/pages/Challenges.jsx`
- Modify: `props-capital-frontend/src/components/home/ProfitCalculatorSection.jsx`

- [ ] **Step 1: ChallengesSection — use currency context**

In `ChallengesSection.jsx`, add after the existing `useTheme` usage / imports (top of file, with the other context imports):

```jsx
import { useCurrency } from '@/contexts/CurrencyContext';
```

Inside the component, add near the other hooks (e.g. right after the `useTheme()` line):

```jsx
  const { formatFee, formatSize } = useCurrency();
```

Replace the Price block (currently lines ~82–91) with:

```jsx
              {/* Price */}
              <div className={`text-center mb-5 py-4 rounded-2xl ${isDark ? 'bg-[#0a0d12]' : 'bg-slate-50'}`}>
                <div className={`text-xs sm:text-sm line-through mb-1 ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
                  {formatFee(challenge.prices[accountSizes[selectedSize].key] * 3)}
                </div>
                <div className="text-amber-500 text-3xl sm:text-4xl font-black">
                  {formatFee(challenge.prices[accountSizes[selectedSize].key])}
                </div>
                <div className="text-emerald-500 text-xs sm:text-sm font-semibold mt-1">70% OFF</div>
              </div>
```

Then find the account-size selector pills that render `{size.label}` (the `accountSizes.map((size, index) => ...)` block around line 33) and replace `{size.label}` with `{formatSize(size.key)}`.

- [ ] **Step 2: Challenges page — currency context**

In `props-capital-frontend/src/pages/Challenges.jsx`:

Add the import with the other context imports at the top:

```jsx
import { useCurrency } from '@/contexts/CurrencyContext';
```

Inside the component, near the other hooks, add:

```jsx
  const { formatFee, formatSize } = useCurrency();
```

On line ~39, the size label is built as `` label: `€${formatAccountSize(value)}` ``. Change it to a currency-agnostic key and format at render. Replace that line with:

```jsx
      label: formatSize(formatAccountSize(value)),
```

Replace the price render block (lines ~197–203):

```jsx
                          <div className={`text-sm line-through mb-1 ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
                            €{(price * 3).toFixed(0)}
                          </div>
```
…and the current-price line `€{price}` with:

```jsx
                          <div className={`text-sm line-through mb-1 ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
                            {formatFee(price * 3)}
                          </div>
```
and

```jsx
                            {formatFee(price)}
```

(Replace only the two `€{...}` price expressions and the line-9 label; leave surrounding markup, including the `70% OFF - Limited Time` text, unchanged. Also update the closing CTA copy `up to €200,000` on line ~338 to `up to {formatSize('200K')}` if a quick win is desired; otherwise leave as static EUR copy — this is acceptable since it is marketing prose, not a price.)

> Note: `useMemo` deps that build `accountSizes`/`challengeTypes` from `rawChallenges` should include `formatSize` if ESLint's exhaustive-deps flags it; add `formatSize` to the dependency array of that `useMemo`.

- [ ] **Step 3: ProfitCalculatorSection — symbol swap only**

In `props-capital-frontend/src/components/home/ProfitCalculatorSection.jsx`:

Add import with the others:

```jsx
import { useCurrency } from '@/contexts/CurrencyContext';
```

Add hook near `useTheme()`:

```jsx
  const { formatAmount, formatSize } = useCurrency();
```

Replace the `calculations` useMemo body (lines ~14–21) with:

```jsx
  const calculations = useMemo(() => {
    const monthlyProfit = selectedAccount.value * (profitRate / 100);
    const yearlyProfit = monthlyProfit * 12;
    return {
      monthly: formatAmount(monthlyProfit),
      yearly: formatAmount(yearlyProfit)
    };
  }, [selectedAccount, profitRate, formatAmount]);
```

Replace the account-size label render `{selectedAccount.label}` (line ~68) with:

```jsx
                  {formatSize(selectedAccount.key)}
```

If any other place in this file renders `selectedAccount.label`, replace it with `{formatSize(selectedAccount.key)}` too (the `accountSizes` objects no longer have `label`, only `key`/`value`).

- [ ] **Step 4: Build + lint**

Run: `cd props-capital-frontend && npx eslint src/components/home/ChallengesSection.jsx src/pages/Challenges.jsx src/components/home/ProfitCalculatorSection.jsx && yarn build`
Expected: no eslint errors; build PASS.

- [ ] **Step 5: Commit**

```bash
git add props-capital-frontend/src/components/home/ChallengesSection.jsx props-capital-frontend/src/pages/Challenges.jsx props-capital-frontend/src/components/home/ProfitCalculatorSection.jsx
git commit -m "feat(currency): format marketing prices via CurrencyContext"
```

---

## Task 7: Company name on Terms & Privacy

**Files:**
- Modify: `props-capital-frontend/src/pages/Terms.jsx:94-96`
- Modify: `props-capital-frontend/src/pages/Privacy.jsx:105-107`

- [ ] **Step 1: Terms.jsx — add company name above email**

Replace the contact paragraph inner content (lines 94–96) with (adds a bold company line before Email):

```jsx
                If you have any questions about these Terms, please contact us at:<br />
                <strong className={isDark ? 'text-white' : 'text-slate-900'}>BLUEHAVEN MANAGEMENT LTD</strong><br />
                Email: legal@prop-capitals.com<br />
                Address: 60 TOTTENHAM COURT ROAD, OFFICE 469, LONDON, ENGLAND
```

- [ ] **Step 2: Privacy.jsx — add company name above email**

Replace the contact paragraph inner content (lines 105–107) with:

```jsx
                If you have any questions about this Privacy Policy, please contact us at:<br />
                <strong className={isDark ? 'text-white' : 'text-slate-900'}>BLUEHAVEN MANAGEMENT LTD</strong><br />
                Email: privacy@prop-capitals.com<br />
                Address: 60 TOTTENHAM COURT ROAD, OFFICE 469, LONDON, ENGLAND
```

- [ ] **Step 3: Lint**

Run: `cd props-capital-frontend && npx eslint src/pages/Terms.jsx src/pages/Privacy.jsx`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add props-capital-frontend/src/pages/Terms.jsx props-capital-frontend/src/pages/Privacy.jsx
git commit -m "feat(legal): show company name above email on Terms and Privacy"
```

---

## Task 8: Trustpilot fix on About page

**Files:**
- Create: `props-capital-frontend/src/components/PartialStarRating.jsx`
- Modify: `props-capital-frontend/src/components/home/TrustpilotSection.jsx:173-223` (remove local def, import shared)
- Modify: `props-capital-frontend/src/pages/About.jsx:1-5` (import), `:245-269` (Trustpilot block)

- [ ] **Step 1: Extract PartialStarRating into a shared component**

Create `props-capital-frontend/src/components/PartialStarRating.jsx` with exactly:

```jsx
import React from 'react';

const PartialStarRating = ({ rating, size = 24 }) => {
  const gap = 4;
  const totalWidth = size * 5 + gap * 4;
  const r = size / 2;
  const outerR = r * 0.9;
  const innerR = r * 0.38;

  const getStarPath = (offsetX) => {
    const cx = offsetX + r;
    const cy = r;
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const angle = (i * Math.PI) / 5 - Math.PI / 2;
      const radius = i % 2 === 0 ? outerR : innerR;
      pts.push(`${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`);
    }
    return `M${pts.join('L')}Z`;
  };

  return (
    <svg
      width={totalWidth}
      height={size}
      viewBox={`0 0 ${totalWidth} ${size}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {[0, 1, 2, 3, 4].map((i) => {
          const x = i * (size + gap);
          const fillWidth = size * Math.min(1, Math.max(0, rating - i));
          return (
            <clipPath key={i} id={`tp-clip-${i}`}>
              <rect x={x} y={0} width={fillWidth} height={size} />
            </clipPath>
          );
        })}
      </defs>
      {[0, 1, 2, 3, 4].map((i) => {
        const x = i * (size + gap);
        const d = getStarPath(x);
        return (
          <g key={i}>
            <path d={d} fill="#d1d5db" />
            <path d={d} fill="#00b67a" clipPath={`url(#tp-clip-${i})`} />
          </g>
        );
      })}
    </svg>
  );
};

export default PartialStarRating;
```

- [ ] **Step 2: Use the shared component in TrustpilotSection.jsx**

In `props-capital-frontend/src/components/home/TrustpilotSection.jsx`, add at the top with the other imports:

```jsx
import PartialStarRating from '@/components/PartialStarRating';
```

Delete the local `const PartialStarRating = ({ rating, size = 24 }) => { ... };` definition (the block starting at line ~173 and ending at its closing `};` just before `const ReviewCard`). Leave all usages of `<PartialStarRating ... />` intact — they now resolve to the imported component.

- [ ] **Step 3: Run build to verify TrustpilotSection still compiles**

Run: `cd props-capital-frontend && npx eslint src/components/home/TrustpilotSection.jsx src/components/PartialStarRating.jsx`
Expected: no errors (no "PartialStarRating is not defined", no duplicate-declaration).

- [ ] **Step 4: Fix the About page Trustpilot block**

In `props-capital-frontend/src/pages/About.jsx`, add to the imports (line ~3, with the other component imports):

```jsx
import PartialStarRating from '@/components/PartialStarRating';
```

Replace the Trustpilot inner block — the wordmark `<div className="flex items-center justify-center gap-2 mb-4"> ... </div>` and the stars `<div className="flex items-center justify-center gap-1 mb-4"> {[1,2,3,4,5].map(...)} </div>` (lines ~248–266) — with:

```jsx
            <div className="flex items-center justify-center gap-2 mb-4">
              {/* Official Trustpilot wordmark — theme-aware, no mismatched dark plate */}
              <div className={`px-4 py-2 rounded-md inline-flex items-center gap-2 ${
                isDark ? 'bg-white/5' : 'bg-white border border-slate-200'
              }`}>
                <svg viewBox="0 0 34 34" className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path
                    fill="#00B67A"
                    d="M33.523 11.969H20.722L16.768 0 12.8 11.97 0 11.957l10.367 7.404-3.966 11.956 10.367-7.392 10.355 7.392-3.954-11.956 10.354-7.392z"
                  />
                  <path d="m24.058 22.069-.89-2.707-6.4 4.564 7.29-1.857z" fill="#126849" />
                </svg>
                <span className={`font-semibold text-base tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Trustpilot</span>
              </div>
            </div>
            <div className="flex items-center justify-center mb-4">
              <PartialStarRating rating={4.8} size={32} />
            </div>
```

(The `Star` import in About.jsx may now be unused; if eslint reports `Star` is defined but never used, remove `Star` from the `lucide-react` import on line 2. Verify by checking for other `<Star` usages in About.jsx first — if none, remove it.)

- [ ] **Step 5: Build + lint**

Run: `cd props-capital-frontend && npx eslint src/pages/About.jsx && yarn build`
Expected: no eslint errors; build PASS.

- [ ] **Step 6: Commit**

```bash
git add props-capital-frontend/src/components/PartialStarRating.jsx props-capital-frontend/src/components/home/TrustpilotSection.jsx props-capital-frontend/src/pages/About.jsx
git commit -m "fix(about): theme-aware Trustpilot wordmark and accurate 4.8 star rating"
```

---

## Task 9: Final verification (visual + build)

**Files:** none (verification only)

- [ ] **Step 1: Full frontend build**

Run: `cd props-capital-frontend && yarn build`
Expected: PASS.

- [ ] **Step 2: Backend build**

Run: `cd props-capital-backend && yarn build`
Expected: PASS (or `npx tsc --noEmit` clean for `prisma/seed-challenges.ts` if `prisma generate` fails for env reasons).

- [ ] **Step 3: Visual sanity via Playwright**

Start the dev server: `cd props-capital-frontend && yarn dev` (background), then with Playwright MCP:
- Navigate to the local dev URL (e.g. `http://localhost:5173`).
- Home page: confirm the navbar shows Language + Currency dropdowns (desktop and mobile widths); the challenge pricing section shows €69 / €207 strikethrough / "70% OFF" for 1-Step 5K; switch currency to GBP and confirm it becomes £59 / £176 (= round(207×0.85)); account-size pills read €5K…€200K / £5K…£200K accordingly; sizes are 5K,10K,20K,30K,50K,100K,200K (no 25K).
- `/challenges`: prices reflect the selected currency.
- Profit calculator: account size + earnings swap symbol only (number unchanged) when toggling currency.
- `/about`: Trustpilot wordmark blends with the card (no dark plate in dark mode), and stars visually show ~4.8 (last star ~80% filled).
- `/terms` and `/privacy`: "BLUEHAVEN MANAGEMENT LTD" appears bold directly above the Email line.
- Toggle language: dropdown opens and selection persists on reload.
- Stop the dev server.

- [ ] **Step 4: Confirm git state**

Run: `git log --oneline master..HEAD && git status`
Expected: one commit per task (spec + Tasks 1–8), clean working tree, branch NOT pushed.

---

## Self-Review

- **Spec coverage:** Feature 1 pricing → Tasks 1–2; Feature 1b currency selector/context/scope → Tasks 3–6 (trader area deliberately untouched; payment stays EUR — no task changes `payments.service.ts`, matching the spec); Feature 2 company name → Task 7; Feature 3 Trustpilot → Task 8; Feature 4 language dropdown → Task 4 (provider+component theming) & Task 5 (navbar render). All spec sections mapped.
- **Placeholder scan:** No TBD/TODO; every code step has full code; commands have expected output.
- **Type/name consistency:** `CurrencyContext` exposes `currency, setCurrency, symbol, formatFee, formatAmount, formatSize, EUR_TO_GBP_RATE, supportedCurrencies` — used consistently in `CurrencySwitcher` (`currency,setCurrency,symbol`), ChallengesSection (`formatFee,formatSize`), Challenges (`formatFee,formatSize`), ProfitCalculator (`formatAmount,formatSize`). `accountSizes` objects are `{value,key}` (no `label`) in mockData and every consumer that read `.label` (ChallengesSection pills, ProfitCalculator) is updated to `formatSize(.key)`. `PartialStarRating` default-exported and imported the same way in TrustpilotSection and About.
- **Known caveat surfaced in plan:** strikethrough math is 3× sale (66.7% off) while the label says "70% OFF" — intentionally preserved to match existing code and InstantPropFunding.
