# Design: Pricing Restructure + Currency/Language Selectors + Trustpilot/Company Fixes

Date: 2026-05-19
Branch: `feature/pricing-currency-selector` (off `master`)

## Goal

Four related changes to the Prop-Capitals public site, modeled on InstantPropFunding.com:

1. Restructure challenge pricing and add an EUR/GBP currency selector.
2. Show the legal company name on Terms of Service and Privacy Policy.
3. Fix the Trustpilot block on the About page (background + accurate 4.8 stars).
4. Fix the (currently invisible) language dropdown.

## Constraints

- New branch off `master`. Commit in phases. **No co-author trailer. No push.**
- After changes, verify the frontend builds and the backend's existing checks pass; site must remain functional.
- GBP is **display-only**; payments still process in EUR (no backend payment-flow changes).
- The trader trading panel stays fixed in USD and is untouched.

## Feature 1 — Challenge pricing structure (EUR base)

### Canonical structure

Account sizes change from `2K, 5K, 10K, 25K, 50K, 100K, 200K` to:

`5K, 10K, 20K, 30K, 50K, 100K, 200K`

(2K **removed**, 25K **removed**, 20K + 30K **added** — matches the provided screenshot exactly.)

EUR **sale** prices (canonical `price`). The struck-through "Full Price" is a derived `price × 3`
with the existing "70% OFF" label — unchanged presentation logic, consistent with current code
and InstantPropFunding.

| Size | 1-Step (one_phase) | 2-Step (two_phase) |
|------|--------------------|--------------------|
| 5K   | 69  | 59  |
| 10K  | 99  | 79  |
| 20K  | 159 | 129 |
| 30K  | 219 | 179 |
| 50K  | 349 | 299 |
| 100K | 599 | 499 |
| 200K | 999 | 799 |

### Source-of-truth synchronization

The same numbers must be updated in three places that independently render pricing:

- **Backend** `props-capital-backend/prisma/seed-challenges.ts` — `accountSizes` array and
  `priceMap` (drives the `Challenges` page via `ChallengesContext` and payment validation).
  The seed's existing Step-1 deactivation handles removing legacy 2K/25K rows.
- **Frontend** `props-capital-frontend/src/components/home/data/mockData.js` —
  `challengeTypes[].prices` and `accountSizes` (drives home `ChallengesSection` + `ProfitCalculatorSection`).
- **Frontend** `props-capital-frontend/src/pages/HowItWorks.jsx` — hardcoded illustrative
  size list (`$5K`–`$200K`) updated to the new sizes and currency-aware formatting.

## Feature 1b — Currency selector (EUR/GBP), display-only

### CurrencyContext

- New `props-capital-frontend/src/contexts/CurrencyContext.jsx`.
- Provider added to `App.jsx`. State: `currency` (`'EUR' | 'GBP'`), default `'EUR'`,
  persisted to `localStorage` (same pattern as `LanguageContext`/`ThemeContext`).
- Exposes `formatPrice(eurAmount)`:
  - EUR: `€{amount}`.
  - GBP: `£{round(eurAmount * EUR_TO_GBP_RATE)}`.
  - `EUR_TO_GBP_RATE` is a single named constant (initial value `0.85`), easy to change.
- Exposes `currency`, `setCurrency`, and `symbol`.

### CurrencySwitcher

- New `props-capital-frontend/src/components/CurrencySwitcher.jsx`.
- InstantPropFunding-style dropdown: trigger shows `{symbol} {CODE}` + chevron; options list
  shows symbol + code + full name (`Euro` / `British Pound`) with a check on the selected item.
- Uses the existing Radix `Select` UI primitives; styling theme-aware (`isDark`).
- Rendered in `Navbar.jsx` desktop cluster (next to theme toggle) and in the mobile menu.

### Scope of currency formatting

Replace hardcoded `$`/`€` price rendering with `formatPrice(...)` in:

- `src/components/home/ChallengesSection.jsx` (sale price + `×3` strikethrough)
- `src/pages/Challenges.jsx` (backend-driven prices; backend value is EUR)
- `src/components/home/ProfitCalculatorSection.jsx` (account size label + computed earnings;
  replace its hardcoded `toLocaleString(..., currency: 'USD')`)
- `src/pages/HowItWorks.jsx` (illustrative size labels)

**Untouched (remain USD):** `src/components/trader/TradeCheckoutPanelPage.jsx`,
`src/components/trader/AccountOverview.jsx`, and the rest of the trader area.

### Payment behavior

GBP is presentation only. Checkout continues to use the backend challenge whose
`currency` is `EUR`; no change to `payments.service.ts` or the payment flow.

## Feature 2 — Company name on Terms & Privacy

Add `BLUEHAVEN MANAGEMENT LTD` as a bold line **directly above the Email row** in the
"Contact Us" section of:

- `props-capital-frontend/src/pages/Terms.jsx`
- `props-capital-frontend/src/pages/Privacy.jsx`

Name is already used elsewhere (Contact, Risk Disclosure, footer `CompanyInfo`), so the
value is consistent and known. Email/address rows are otherwise unchanged
(`legal@` for Terms, `privacy@` for Privacy).

## Feature 3 — Trustpilot fix on About page

File: `props-capital-frontend/src/pages/About.jsx` (Trustpilot section ~lines 244–269).

- **Background:** remove the mismatched dark `#191919` plate behind the wordmark; restyle the
  wordmark container to be theme-aware and consistent with the surrounding card (transparent /
  card background, keeping the official green star `#00B67A` + "Trustpilot" text).
- **Stars:** currently five fully-filled stars while the rating is 4.8. Reuse the existing
  `PartialStarRating` component from `src/components/home/TrustpilotSection.jsx` — export it
  from there (or extract to a shared component) and render `rating={4.8}` so the display shows
  4 full + ~80% partial star. "4.8 out of 5" and "Based on 2,340+ reviews" text unchanged.

## Feature 4 — Language dropdown fix

Root cause: `LanguageProvider` is not mounted in `App.jsx` and `LanguageSwitcher` is never
rendered anywhere.

- Wrap the app tree in `LanguageProvider` in `App.jsx` (alongside the other context providers).
- Render `LanguageSwitcher` in `Navbar.jsx` (desktop cluster + mobile menu), grouped with the
  new `CurrencySwitcher` and theme toggle.
- Make `LanguageSwitcher` styling theme-aware (it currently hardcodes `slate-700`/`slate-200`);
  match the navbar's existing dark/light treatment.

## Implementation phases (commits, no co-author, no push)

1. Backend pricing: `seed-challenges.ts` sizes + `priceMap`.
2. Frontend pricing data: `mockData.js` + `HowItWorks.jsx` sizes.
3. `CurrencyContext` + `CurrencySwitcher`; wire into `App.jsx` + `Navbar.jsx`; apply
   `formatPrice` to the four marketing surfaces.
4. Language dropdown: `LanguageProvider` in `App.jsx`, `LanguageSwitcher` in `Navbar.jsx`,
   theme-aware styling.
5. Company name on `Terms.jsx` + `Privacy.jsx`.
6. Trustpilot fix on `About.jsx` (export/reuse `PartialStarRating`).
7. Verification: frontend build/lint, backend typecheck/build; manual sanity of affected pages.

## Out of scope / risks

- No live FX API; fixed configurable rate only.
- No backend payment-currency change; GBP never charged.
- 2K and 25K products are intentionally retired from the public catalog.
- Backend seed must be re-run in environments where prices are expected to update; the spec
  changes the seed source, not live DB rows directly.
