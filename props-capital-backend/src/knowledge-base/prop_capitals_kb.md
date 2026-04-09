# Prop Capitals - Official Knowledge Base
**Last Updated:** March 2026

This document contains the complete context, rules, statistics, formatting, and FAQs regarding the Prop Capitals trading platform. It is intended to be used as a source of truth for RAG (Retrieval-Augmented Generation) chatbots and AI assistants.

---

## 1. Company Overview & Statistics
Prop Capitals is a proprietary trading firm offering funded accounts to traders, allowing them to trade with company capital and keep a large portion of the profits.

**Platform Statistics:**
- **Active Traders:** 18,500+
- **Total Paid Out:** $15.2M+
- **Average Payout:** $3,850
- **Trustpilot Rating:** 4.8 / 5.0 (2,340+ reviews)
- **Average Payout Fastness:** Under 90 minutes
- **Average Support Response:** Under 60 seconds
- **Pass / Success Rate:** 23%

---

## 2. Supported Platforms & Instruments
**Trading Platforms Approved:**
- MetaTrader 4 (MT4)
- MetaTrader 5 (MT5)
- cTrader
- TradeLocker (Features TradingView integration)
- MatchTrader
- DXTrade
- PT5
- Bybit

**Trading Instruments (100+ total):**
- **Forex:** Over 50+ currency pairs.
- **Metals:** Gold, Silver.
- **Indices:** US30, NAS100, SPX500.
- **Crypto:** BTC, ETH, etc.

**General Trading Conditions:**
- **Forex Leverage:** Up to 1:100
- **Spreads:** Starting from 0.0 pips
- **Commission:** $2 per lot

---

## 3. Account Sizes & Challenge Programs
Traders can choose from two main evaluation challenges. All paths have NO time limits.

**Account Sizes Available:**
$5,000 | $10,000 | $25,000 | $50,000 | $100,000 | $200,000

### A. 1-Step Challenge (Most Popular)
Quick evaluation with achievable targets and best value.
- **Phases:** 1
- **Profit Target:** 10%
- **Daily Drawdown Limit:** 4%
- **Max Overall Drawdown:** 8%
- **Profit Split:** 85%
- **Leverage:** 1:30
- **Pricing:** $5K ($55), $10K ($99), $25K ($189), $50K ($299), $100K ($499), $200K ($949)

### B. 2-Step Challenge (Best Split)
Traditional evaluation with highest profit split potential up to 90%.
- **Phases:** 2 
- **Phase 1 Profit Target:** 8%
- **Phase 2 Profit Target:** 5%
- **Daily Drawdown Limit:** 5%
- **Max Overall Drawdown:** 10%
- **Profit Split:** 80% to 90%
- **Leverage:** 1:50
- **Pricing:** $5K ($45), $10K ($79), $25K ($159), $50K ($249), $100K ($449), $200K ($849)

### C. Scaling Plan
Allows traders to grow their account up to **$5,000,000**. Every time a trader reaches a 10% profit milestone, the account size increases by 25%.

---

## 4. Trading Rules & Features
Prop Capitals offers highly flexible trading conditions:
- **Expert Advisors (EAs):** Allowed. Any automated trading bot or EA is accepted.
- **News Trading:** Fully Allowed. Trade during high-impact economic events with no restrictions.
- **Weekend Holding:** Fully Allowed. Keep positions open over the weekend.
- **Scalping:** Allowed. There are no minimum holding time restrictions.
- **Copy Trading:** Allowed. Use of signal services and copy trading is permitted.
- **Time Limits:** No Time Limits. Complete challenges at your own pace.
- **Refund Policy:** 100% Refund on the Challenge Fee with the 1st Payout. 
- **Retry Discount:** If a trader fails, they can retry with a new purchase at up to a 20% discount.

### Violations Definitions:
- **Daily Drawdown:** Exceeding the allowed daily loss percentage based on the starting equity/balance of the day.
- **Overall Drawdown:** Exceeding the allowed total loss limit based on the initial account balance.
- **Consistency/Rule Break:** Breaching any of the firm's specific evaluation rules (if explicitly defined further in the TOS).

---

## 5. Payouts & Billing
- **Speed:** Less than 90 minutes.
- **Methods:** Bank Transfer, Crypto, various E-wallets.
- **Providers Supported:** Stripe, PayPal, Skrill, Neteller, Binance Pay, Coinbase, Wire Transfer.
- **Accepted Currencies:** Primarily USD.

---

## 6. Frequently Asked Questions (FAQ)

**Q: How does Prop Capitals work?**
A: Prop Capitals provides traders with funded accounts to trade with. You can choose from Instant Funding, 1-Step, or 2-Step challenges. Once you pass the evaluation (or choose instant funding), you trade with our capital and keep up to 90% of the profits. We handle all the risk while you focus on trading.

**Q: What is the profit split?**
A: We offer industry-leading profit splits up to 90%. The exact split depends on your chosen program: Instant Funding offers 70%, 1-Step Challenge offers 85%, and 2-Step Challenge offers up to 90% profit split. Top performers can even reach 100% profit split.

**Q: How fast are payouts processed?**
A: Our payouts are processed in under 90 minutes on average - one of the fastest in the industry. Once you request a payout, our team works around the clock to ensure you receive your earnings quickly. We support multiple payout methods including bank transfer, crypto, and e-wallets.

**Q: Can I use Expert Advisors (EAs)?**
A: Yes! We allow all trading strategies including EAs, automated bots, scalping, news trading, and weekend holding. There are virtually no restrictions on how you trade - use whatever strategy works best for you.

**Q: What happens if I fail a challenge?**
A: If you breach the rules during a challenge, you can retry with a new purchase at a discounted rate. We offer up to 20% off on retry accounts. Remember, there's no time limit on our challenges, so take your time to trade responsibly and manage your risk.

**Q: Is the challenge fee refundable?**
A: Yes! We refund 100% of your challenge fee with your first payout once you become a funded trader. This means your evaluation is essentially free if you pass and profit.

**Q: What trading instruments are available?**
A: Trade Forex (50+ pairs), Metals (Gold, Silver), Indices (US30, NAS100, SPX500), and Cryptocurrencies (BTC, ETH). We offer competitive spreads starting from 0.0 pips and low commissions.

**Q: Is there a scaling plan?**
A: Yes! Our scaling plan allows you to grow your account up to $5,000,000. Every time you reach a 10% profit milestone, your account size increases by 25%. Top traders can access our Elite program with even better conditions.

---

## 7. Educational Resources
Prop Capitals provides free course access with education modules covering:
- **Your Trading Setup Advantage:** Trading secrets, workspace optimization, and execution consistency.
- **Mapping High Timeframe Zones:** Supply and demand zones, HTF-guided LTF trades.
- **Essential Trading Resources:** News sources, tool evaluation, risk management.
- **Fibonacci Entries & Exits:** Ratios for entries/exits, setting precise targets.

---

## 8. Development & Technical Architecture Context
*This section is primarily for the AI agent to understand backend context.*
- The backend is a **NestJS** application using **Prisma ORM** connecting to a **PostgreSQL** database.
- It integrates dynamically with multiple Trading platforms via Broker Servers.
- User states are tracked via entities: `User`, `TradingAccount`, `Challenge`, `Trade`, `PhaseTransition`, `Violation`, `Payout`.
- Core violations are actively monitored (e.g., `dailyLossViolated`, `drawdownViolated`).
- Support ticketing and lead/CRM management is fully built-in.
