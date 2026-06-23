import type { EmailContent } from '../../email/email.service';

/**
 * Self-contained, brand-styled email templates used to build a chargeback /
 * dispute evidence pack. Each function returns an {@link EmailContent} so the
 * caller can both send the email AND keep a verbatim copy for the evidence
 * report ("copy of all communications with the cardholder").
 *
 * The templates intentionally mirror the real customer lifecycle emails
 * (welcome, receipt, credentials, account-terminated) plus two evidence-only
 * documents (the account-activity report and the fraud / chargeback policy).
 */

const BRAND = 'Prop Capitals';
const SUPPORT_EMAIL = 'support@prop-capitals.com';
const ACCENT = '#f59e0b';
const INK = '#0a0d12';

function money(amount: number, currency: string): string {
  const formatted = Number(amount).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${currency} ${formatted}`;
}

function fmtDate(d: Date): string {
  return d.toLocaleString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  });
}

/** Shared HTML shell so every evidence email looks consistent. */
function shell(innerHtml: string): string {
  return `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; background-color: #f4f5f7; padding: 24px 12px;">
    <div style="max-width: 640px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
      <div style="background-color: ${INK}; padding: 18px 28px;">
        <span style="color: #ffffff; font-size: 18px; font-weight: 800; letter-spacing: 0.3px;">Prop<span style="color: ${ACCENT};">Capitals</span></span>
      </div>
      <div style="padding: 28px;">
        ${innerHtml}
      </div>
      <div style="padding: 16px 28px; border-top: 1px solid #eef0f3; background:#fafbfc;">
        <p style="margin: 0; color: #6b7280; font-size: 12px; line-height: 18px;">
          ${BRAND} &middot; Need help? <a href="mailto:${SUPPORT_EMAIL}" style="color: ${ACCENT};">${SUPPORT_EMAIL}</a> &middot; Available 24/7
        </p>
      </div>
    </div>
  </div>`;
}

export interface CardholderInfo {
  email: string;
  name: string;
}

export function buildWelcomeEmail(
  c: CardholderInfo,
  frontendUrl: string,
): EmailContent {
  const url = `${frontendUrl.replace(/\/$/, '')}/challenges`;
  return {
    subject: `Welcome to ${BRAND}!`,
    text: `Welcome to ${BRAND}, ${c.name}!\n\nYour email (${c.email}) has been verified and your account is ready. Start your trading journey by choosing a challenge at ${url}.`,
    html: shell(`
      <h1 style="margin:0 0 14px;color:${INK};font-size:22px;font-weight:800;">Welcome to ${BRAND}, ${c.name}!</h1>
      <p style="margin:0 0 12px;color:#334155;font-size:14px;line-height:22px;">Your email <strong>${c.email}</strong> has been verified and your account is ready to go.</p>
      <p style="margin:0 0 12px;color:#334155;font-size:14px;line-height:22px;">Choose an evaluation that suits your style:</p>
      <ul style="margin:0 0 16px;padding-left:20px;color:#334155;font-size:14px;line-height:22px;">
        <li>1-Step Challenge &mdash; fast evaluation</li>
        <li>2-Step Challenge &mdash; traditional evaluation, up to 90% profit split</li>
      </ul>
      <a href="${url}" style="display:inline-block;padding:12px 24px;background-color:${ACCENT};color:${INK};text-decoration:none;border-radius:6px;font-weight:700;">Start a Challenge</a>
    `),
  };
}

export function buildPurchaseReceiptEmail(args: {
  cardholder: CardholderInfo;
  challengeName: string;
  amount: number;
  currency: string;
  invoiceNumber: number;
  cardBrand?: string | null;
  cardLast4?: string | null;
  paidAt: Date;
}): EmailContent {
  const { cardholder, challengeName, amount, currency, invoiceNumber } = args;
  const cardLine =
    args.cardBrand && args.cardLast4
      ? `${args.cardBrand} ending ${args.cardLast4}`
      : 'Card payment';
  return {
    subject: `Your Receipt #${invoiceNumber}`,
    text: `Hi ${cardholder.email},\n\nWe have received your payment for ${challengeName}.\n\nAmount Paid: ${money(amount, currency)}\nInvoice #${invoiceNumber}\nPayment method: ${cardLine}\nDate: ${fmtDate(args.paidAt)}\n\nYour trading account has been provisioned and login details have been sent separately.\n\nQuestions? Contact ${SUPPORT_EMAIL}.`,
    html: shell(`
      <h1 style="margin:0 0 14px;color:${INK};font-size:22px;font-weight:800;">Thank you for your <span style="color:${ACCENT};">purchase</span></h1>
      <p style="margin:0 0 12px;color:#334155;font-size:14px;line-height:22px;">Hi <strong>${cardholder.email}</strong>, we have received your payment for <strong>${challengeName}</strong>.</p>
      <div style="margin:16px 0;padding:18px 20px;background:#ecfdf5;border-left:4px solid #10b981;border-radius:8px;">
        <p style="margin:0 0 6px;color:#065f46;font-size:13px;font-weight:600;">Amount Paid</p>
        <p style="margin:0;color:#065f46;font-size:24px;font-weight:800;">${money(amount, currency)}</p>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:14px;color:#334155;">
        <tr><td style="padding:6px 0;color:#6b7280;">Invoice</td><td style="padding:6px 0;text-align:right;font-weight:600;">#${invoiceNumber}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;">Payment method</td><td style="padding:6px 0;text-align:right;font-weight:600;">${cardLine}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;">Date</td><td style="padding:6px 0;text-align:right;font-weight:600;">${fmtDate(args.paidAt)}</td></tr>
      </table>
      <p style="margin:16px 0 0;color:#334155;font-size:14px;line-height:22px;">Your trading account has been provisioned and login details were sent in a separate email.</p>
    `),
  };
}

export function buildCredentialsEmail(args: {
  cardholder: CardholderInfo;
  platform: string;
  loginEmail: string;
  password: string;
}): EmailContent {
  return {
    subject: `Your ${BRAND} ${args.platform} Account Credentials`,
    text: `Your ${BRAND} ${args.platform} account has been created.\n\nEmail: ${args.loginEmail}\nPassword: ${args.password}\n\nKeep these credentials safe.`,
    html: shell(`
      <h1 style="margin:0 0 14px;color:${INK};font-size:22px;font-weight:800;">Your account is ready</h1>
      <p style="margin:0 0 12px;color:#334155;font-size:14px;line-height:22px;">Below are the credentials for your ${BRAND} ${args.platform} account:</p>
      <div style="margin:12px 0;padding:14px 16px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;">
        <p style="margin:0 0 8px;color:#334155;font-size:14px;"><strong>Email:</strong> ${args.loginEmail}</p>
        <p style="margin:0;color:#334155;font-size:14px;"><strong>Password:</strong> ${args.password}</p>
      </div>
    `),
  };
}

export function buildChallengeTerminatedEmail(args: {
  cardholder: CardholderInfo;
  challengeName: string;
  reason: string;
  drawdownPercent: number;
  limitPercent: number;
  finalBalance: number;
  initialBalance: number;
  currency: string;
  terminatedAt: Date;
}): EmailContent {
  return {
    subject: `Your ${args.challengeName} evaluation has ended`,
    text: `Hi ${args.cardholder.email},\n\nYour ${args.challengeName} evaluation has been terminated.\n\nReason: ${args.reason}\nMaximum overall loss limit: ${args.limitPercent.toFixed(2)}%\nLoss reached: ${args.drawdownPercent.toFixed(2)}%\nStarting balance: ${money(args.initialBalance, args.currency)}\nFinal balance: ${money(args.finalBalance, args.currency)}\nDate: ${fmtDate(args.terminatedAt)}\n\nYou are welcome to start a new evaluation at any time.`,
    html: shell(`
      <h1 style="margin:0 0 14px;color:${INK};font-size:22px;font-weight:800;">Evaluation ended</h1>
      <p style="margin:0 0 12px;color:#334155;font-size:14px;line-height:22px;">Hi <strong>${args.cardholder.email}</strong>, your <strong>${args.challengeName}</strong> evaluation has been terminated because a trading rule was breached.</p>
      <div style="margin:16px 0;padding:18px 20px;background:#fef2f2;border-left:4px solid #ef4444;border-radius:8px;">
        <p style="margin:0 0 6px;color:#991b1b;font-size:13px;font-weight:600;">${args.reason}</p>
        <p style="margin:0;color:#991b1b;font-size:14px;">Loss reached <strong>${args.drawdownPercent.toFixed(2)}%</strong> (limit ${args.limitPercent.toFixed(2)}%).</p>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:14px;color:#334155;">
        <tr><td style="padding:6px 0;color:#6b7280;">Starting balance</td><td style="padding:6px 0;text-align:right;font-weight:600;">${money(args.initialBalance, args.currency)}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;">Final balance</td><td style="padding:6px 0;text-align:right;font-weight:600;">${money(args.finalBalance, args.currency)}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;">Date</td><td style="padding:6px 0;text-align:right;font-weight:600;">${fmtDate(args.terminatedAt)}</td></tr>
      </table>
      <p style="margin:16px 0 0;color:#334155;font-size:14px;line-height:22px;">You are welcome to start a new evaluation at any time.</p>
    `),
  };
}

export interface ActivityReportData {
  cardholder: { email: string; name: string; country?: string | null };
  registeredAt: Date;
  plan: {
    name: string;
    accountSize: number;
    challengeType: string;
    platform: string;
    currency: string;
  };
  payment: {
    invoiceNumber: number;
    reference: string;
    amount: number;
    currency: string;
    status: string;
    provider: string;
    cardBrand?: string | null;
    cardLast4?: string | null;
    paidAt: Date;
  };
  account: {
    id: string;
    status: string;
    phase: string;
    initialBalance: number;
    finalBalance: number;
    overallDrawdownPercent: number;
    startedAt: Date;
    terminatedAt: Date | null;
  };
  trades: Array<{
    symbol: string;
    type: string;
    volume: number;
    openPrice: number;
    closePrice: number | null;
    profit: number;
    openedAt: Date;
    closedAt: Date | null;
  }>;
  payouts: Array<{ amount: number; currency: string; status: string }>;
}

export function buildAccountActivityReportEmail(
  d: ActivityReportData,
): EmailContent {
  const cur = d.plan.currency;
  const totalLoss = d.trades.reduce((s, t) => s + t.profit, 0);
  const tradeRows = d.trades
    .map(
      (t) => `
      <tr>
        <td style="padding:6px 8px;border-bottom:1px solid #eef0f3;">${fmtDate(t.openedAt)}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eef0f3;">${t.symbol}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eef0f3;">${t.type}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eef0f3;text-align:right;">${t.volume}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eef0f3;text-align:right;">${t.openPrice}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eef0f3;text-align:right;">${t.closePrice ?? '-'}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eef0f3;text-align:right;color:${t.profit < 0 ? '#dc2626' : '#059669'};">${money(t.profit, cur)}</td>
      </tr>`,
    )
    .join('');

  const textTrades = d.trades
    .map(
      (t) =>
        `  ${fmtDate(t.openedAt)}  ${t.symbol} ${t.type} ${t.volume} @ ${t.openPrice} -> ${t.closePrice ?? '-'}  P/L ${money(t.profit, cur)}`,
    )
    .join('\n');

  return {
    subject: `Account Activity Report - ${d.cardholder.email} (Invoice #${d.payment.invoiceNumber})`,
    text: `ACCOUNT ACTIVITY REPORT
=======================
Cardholder: ${d.cardholder.name} <${d.cardholder.email}>${d.cardholder.country ? `\nCountry: ${d.cardholder.country}` : ''}
Registered: ${fmtDate(d.registeredAt)}

PURCHASE
  Plan: ${d.plan.name} (${d.plan.accountSize.toLocaleString()} ${cur} virtual account)
  Invoice: #${d.payment.invoiceNumber}  Ref: ${d.payment.reference}
  Amount: ${money(d.payment.amount, d.payment.currency)}  Status: ${d.payment.status}
  Provider: ${d.payment.provider}  Card: ${d.payment.cardBrand ?? 'n/a'} ${d.payment.cardLast4 ? `ending ${d.payment.cardLast4}` : ''}
  Paid at: ${fmtDate(d.payment.paidAt)}

TRADING ACCOUNT (${d.account.id})
  Started: ${fmtDate(d.account.startedAt)}
  Status: ${d.account.status} / ${d.account.phase}
  Starting balance: ${money(d.account.initialBalance, cur)}
  Final balance: ${money(d.account.finalBalance, cur)}
  Overall drawdown reached: ${d.account.overallDrawdownPercent.toFixed(2)}%
  Terminated: ${d.account.terminatedAt ? fmtDate(d.account.terminatedAt) : 'n/a'}

TRADES (${d.trades.length}) - total P/L ${money(totalLoss, cur)}
${textTrades}

WITHDRAWALS / PAYOUTS
  ${d.payouts.length === 0 ? 'None - no funds were ever withdrawn from this account.' : d.payouts.map((p) => `${money(p.amount, p.currency)} (${p.status})`).join(', ')}
`,
    html: shell(`
      <h1 style="margin:0 0 6px;color:${INK};font-size:22px;font-weight:800;">Account Activity Report</h1>
      <p style="margin:0 0 18px;color:#6b7280;font-size:13px;">Invoice #${d.payment.invoiceNumber} &middot; Generated ${fmtDate(new Date())} (UTC)</p>

      <h2 style="margin:0 0 8px;color:${INK};font-size:15px;">Cardholder</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;color:#334155;margin-bottom:18px;">
        <tr><td style="padding:5px 0;color:#6b7280;">Name</td><td style="padding:5px 0;text-align:right;font-weight:600;">${d.cardholder.name}</td></tr>
        <tr><td style="padding:5px 0;color:#6b7280;">Email</td><td style="padding:5px 0;text-align:right;font-weight:600;">${d.cardholder.email}</td></tr>
        ${d.cardholder.country ? `<tr><td style="padding:5px 0;color:#6b7280;">Country</td><td style="padding:5px 0;text-align:right;font-weight:600;">${d.cardholder.country}</td></tr>` : ''}
        <tr><td style="padding:5px 0;color:#6b7280;">Registered</td><td style="padding:5px 0;text-align:right;font-weight:600;">${fmtDate(d.registeredAt)}</td></tr>
      </table>

      <h2 style="margin:0 0 8px;color:${INK};font-size:15px;">Purchase</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;color:#334155;margin-bottom:18px;">
        <tr><td style="padding:5px 0;color:#6b7280;">Plan</td><td style="padding:5px 0;text-align:right;font-weight:600;">${d.plan.name}</td></tr>
        <tr><td style="padding:5px 0;color:#6b7280;">Virtual account size</td><td style="padding:5px 0;text-align:right;font-weight:600;">${d.plan.accountSize.toLocaleString()} ${cur}</td></tr>
        <tr><td style="padding:5px 0;color:#6b7280;">Amount paid</td><td style="padding:5px 0;text-align:right;font-weight:600;">${money(d.payment.amount, d.payment.currency)}</td></tr>
        <tr><td style="padding:5px 0;color:#6b7280;">Status</td><td style="padding:5px 0;text-align:right;font-weight:600;">${d.payment.status}</td></tr>
        <tr><td style="padding:5px 0;color:#6b7280;">Provider</td><td style="padding:5px 0;text-align:right;font-weight:600;">${d.payment.provider}</td></tr>
        <tr><td style="padding:5px 0;color:#6b7280;">Card</td><td style="padding:5px 0;text-align:right;font-weight:600;">${d.payment.cardBrand ?? 'n/a'} ${d.payment.cardLast4 ? `&bull;&bull;&bull;&bull; ${d.payment.cardLast4}` : ''}</td></tr>
        <tr><td style="padding:5px 0;color:#6b7280;">Reference</td><td style="padding:5px 0;text-align:right;font-weight:600;">${d.payment.reference}</td></tr>
        <tr><td style="padding:5px 0;color:#6b7280;">Paid at</td><td style="padding:5px 0;text-align:right;font-weight:600;">${fmtDate(d.payment.paidAt)}</td></tr>
      </table>

      <h2 style="margin:0 0 8px;color:${INK};font-size:15px;">Trading account</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;color:#334155;margin-bottom:18px;">
        <tr><td style="padding:5px 0;color:#6b7280;">Account ID</td><td style="padding:5px 0;text-align:right;font-weight:600;">${d.account.id}</td></tr>
        <tr><td style="padding:5px 0;color:#6b7280;">Started</td><td style="padding:5px 0;text-align:right;font-weight:600;">${fmtDate(d.account.startedAt)}</td></tr>
        <tr><td style="padding:5px 0;color:#6b7280;">Status</td><td style="padding:5px 0;text-align:right;font-weight:600;">${d.account.status} / ${d.account.phase}</td></tr>
        <tr><td style="padding:5px 0;color:#6b7280;">Starting balance</td><td style="padding:5px 0;text-align:right;font-weight:600;">${money(d.account.initialBalance, cur)}</td></tr>
        <tr><td style="padding:5px 0;color:#6b7280;">Final balance</td><td style="padding:5px 0;text-align:right;font-weight:600;">${money(d.account.finalBalance, cur)}</td></tr>
        <tr><td style="padding:5px 0;color:#6b7280;">Overall loss reached</td><td style="padding:5px 0;text-align:right;font-weight:600;color:#dc2626;">${d.account.overallDrawdownPercent.toFixed(2)}%</td></tr>
        <tr><td style="padding:5px 0;color:#6b7280;">Terminated</td><td style="padding:5px 0;text-align:right;font-weight:600;">${d.account.terminatedAt ? fmtDate(d.account.terminatedAt) : 'n/a'}</td></tr>
      </table>

      <h2 style="margin:0 0 8px;color:${INK};font-size:15px;">Trades (${d.trades.length}) &mdash; total P/L <span style="color:#dc2626;">${money(totalLoss, cur)}</span></h2>
      <table style="width:100%;border-collapse:collapse;font-size:12px;color:#334155;margin-bottom:18px;">
        <tr style="background:#f9fafb;">
          <th style="padding:6px 8px;text-align:left;">Opened (UTC)</th>
          <th style="padding:6px 8px;text-align:left;">Symbol</th>
          <th style="padding:6px 8px;text-align:left;">Side</th>
          <th style="padding:6px 8px;text-align:right;">Vol</th>
          <th style="padding:6px 8px;text-align:right;">Open</th>
          <th style="padding:6px 8px;text-align:right;">Close</th>
          <th style="padding:6px 8px;text-align:right;">P/L</th>
        </tr>
        ${tradeRows}
      </table>

      <h2 style="margin:0 0 8px;color:${INK};font-size:15px;">Withdrawals / payouts</h2>
      <p style="margin:0;color:#334155;font-size:14px;line-height:22px;">${d.payouts.length === 0 ? '<strong>None.</strong> No funds were ever requested or withdrawn from this account.' : d.payouts.map((p) => `${money(p.amount, p.currency)} (${p.status})`).join(', ')}</p>
    `),
  };
}

/**
 * Static fraud-prevention & chargeback policy. Returned to the UI and emailed
 * as part of the evidence pack so disputes can be answered with a consistent,
 * documented set of controls.
 */
export const FRAUD_PREVENTION_POLICY = {
  title: 'Fraud Prevention & Risk Controls',
  sections: [
    {
      heading: 'Payment authentication',
      points: [
        '3-D Secure 2 (SCA) is enforced on card transactions through our PSPs (Xoala / WorldCard); the cardholder authenticates with their issuing bank before any charge is approved.',
        'AVS (Address Verification) and CVV/CVC verification are required on every card payment; mismatches are declined or held for manual review.',
        'We never store full PAN data. Only the card BIN, brand, last 4 digits and expiry are retained for reconciliation (PCI-DSS scope minimised via tokenised PSP checkout).',
      ],
    },
    {
      heading: 'Transaction & behavioural monitoring',
      points: [
        'Real-time velocity checks on email, card BIN, IP and device fingerprint flag repeat attempts, card testing and mismatched geolocation.',
        'IP-to-billing-country geolocation comparison and disposable-email detection at checkout.',
        'Each order is linked to a single verified account; the customer must register and verify their email (OTP) before the account is provisioned.',
      ],
    },
    {
      heading: 'Identity & account verification (KYC)',
      points: [
        'Email ownership is verified via a one-time passcode before account creation.',
        'Government-ID / proof-of-address KYC is required before any payout is released; payouts to a name that differs from the cardholder are blocked.',
        'High-value or high-risk orders are routed to manual review before fulfilment.',
      ],
    },
    {
      heading: 'Service delivery & audit trail',
      points: [
        'Every purchase produces an itemised receipt email, platform credentials email, and an immutable activity log (registration, login, trades, rule breaches, payouts).',
        'All customer communications are logged and reproducible on demand (see the communications copy in this pack).',
        'Trading activity, equity curve and rule-breach events are time-stamped and retained for dispute evidence.',
      ],
    },
  ],
};

export const CHARGEBACK_POLICY = {
  title: 'Chargeback Handling Policy',
  points: [
    'Customers are encouraged to contact support (24/7) before initiating a dispute; most issues are resolved directly and faster than a bank chargeback.',
    'On receipt of a chargeback notification we immediately freeze the related account (status set to DISQUALIFIED) and suspend any pending payout.',
    'We compile and submit a full evidence pack: signed terms acceptance, 3-D Secure authentication result, AVS/CVV match, itemised receipt, proof of service delivery (account credentials + login/trading activity), and the complete communications history.',
    'Refunds, where due under our refund policy, are issued to the original payment method only.',
    'Confirmed fraudulent cardholders and associated identifiers (email, card BIN, IP, device) are added to a deny-list to prevent re-purchase.',
  ],
};

export function buildFraudPolicyEmail(args: {
  cardholder: CardholderInfo;
  invoiceNumber: number;
}): EmailContent {
  const fraudHtml = FRAUD_PREVENTION_POLICY.sections
    .map(
      (s) => `
      <h3 style="margin:16px 0 6px;color:${INK};font-size:14px;">${s.heading}</h3>
      <ul style="margin:0;padding-left:18px;color:#334155;font-size:13px;line-height:20px;">
        ${s.points.map((p) => `<li style="margin-bottom:6px;">${p}</li>`).join('')}
      </ul>`,
    )
    .join('');
  const cbHtml = `
    <ul style="margin:0;padding-left:18px;color:#334155;font-size:13px;line-height:20px;">
      ${CHARGEBACK_POLICY.points.map((p) => `<li style="margin-bottom:6px;">${p}</li>`).join('')}
    </ul>`;

  const fraudText = FRAUD_PREVENTION_POLICY.sections
    .map((s) => `${s.heading}\n${s.points.map((p) => `  - ${p}`).join('\n')}`)
    .join('\n\n');
  const cbText = CHARGEBACK_POLICY.points.map((p) => `  - ${p}`).join('\n');

  return {
    subject: `${FRAUD_PREVENTION_POLICY.title} & ${CHARGEBACK_POLICY.title} (Invoice #${args.invoiceNumber})`,
    text: `${FRAUD_PREVENTION_POLICY.title}\n${'='.repeat(FRAUD_PREVENTION_POLICY.title.length)}\n\n${fraudText}\n\n\n${CHARGEBACK_POLICY.title}\n${'='.repeat(CHARGEBACK_POLICY.title.length)}\n\n${cbText}`,
    html: shell(`
      <h1 style="margin:0 0 14px;color:${INK};font-size:22px;font-weight:800;">${FRAUD_PREVENTION_POLICY.title}</h1>
      ${fraudHtml}
      <hr style="border:none;border-top:1px solid #eef0f3;margin:24px 0;"/>
      <h1 style="margin:0 0 8px;color:${INK};font-size:20px;font-weight:800;">${CHARGEBACK_POLICY.title}</h1>
      ${cbHtml}
    `),
  };
}
