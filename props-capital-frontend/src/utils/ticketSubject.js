// Auto-generated support-ticket subjects arrive from the backend as
// "Support Request - <Category>" (English, built from the TicketCategory enum in
// support-tickets.service). Translate those on display so the trader dashboard
// shows them in the active language; user-typed subjects pass through unchanged.
const CATEGORY_LABEL_KEY = {
  account: 'supportPanel.categoryAccount',
  payment: 'supportPanel.categoryPayment',
  payout: 'supportPanel.categoryPayout',
  technical: 'supportPanel.categoryTechnical',
  other: 'supportPanel.categoryOther',
};

const AUTO_SUBJECT_RE = /^Support Request - (Account|Payment|Payout|Technical|Other)$/i;

/**
 * @param {string} subject  raw ticket subject from the API
 * @param {string} [category]  ticket category (enum or mapped, any case)
 * @param {(key: string, params?: object) => string} t  translation fn
 */
export function displayTicketSubject(subject, category, t) {
  if (!subject || typeof subject !== 'string') return subject;
  const match = AUTO_SUBJECT_RE.exec(subject.trim());
  if (!match) return subject;
  const key =
    CATEGORY_LABEL_KEY[String(category || match[1]).toLowerCase()] ||
    CATEGORY_LABEL_KEY.other;
  return t('supportPanel.autoSubject', { category: t(key) });
}
