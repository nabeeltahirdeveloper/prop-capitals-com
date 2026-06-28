import * as XLSX from 'xlsx';

/**
 * Maps payment-processor transaction exports (CSV or XLSX, e.g. the Xoala /
 * Bluehaven "Fraud_TRN" report) into the fields the chargeback-evidence
 * generator needs, plus a full verbatim transaction record kept for evidence.
 */

export interface ParsedTransaction {
  [key: string]: string;
}

export interface MappedUpload {
  fields: {
    email: string;
    firstName: string;
    lastName: string;
    country: string;
    currency: string;
    amountPaid: number | null;
    cardBrand: string;
    cardLast4: string;
    registrationDate: string; // YYYY-MM-DD
    ipAddress: string;
  };
  // Parsed plan hints used to match a Challenge row.
  planHint: { challengeType: string | null; accountSize: number | null };
  transaction: ParsedTransaction;
  warnings: string[];
}

// Header (normalized: trimmed, lowercased, single-spaced) -> output key.
const HEADER_MAP: Record<string, string> = {
  'transaction date(mm/dd/yyyy)': 'transactionDate',
  'transaction date': 'transactionDate',
  'timezone()': 'timeZone',
  timezone: 'timeZone',
  'partner id': 'partnerId',
  'member id': 'memberId',
  'merchant company name': 'merchant',
  'tracking id': 'trackingId',
  uuid: 'uuid',
  'payment id': 'paymentId',
  'order id': 'orderId',
  'order description': 'orderDescription',
  'customer id': 'customerId',
  'processing bank': 'processingBank',
  'acquirer bank': 'acquirerBank',
  'alias name': 'aliasName',
  'acquirer account id': 'acquirerAccountId',
  'terminal id': 'terminalId',
  'payment mode': 'paymentMode',
  'payment brand': 'paymentBrand',
  'transaction mode': 'transactionMode',
  'bin card category': 'binCardCategory',
  'bin card type': 'binCardType',
  'bin sub brand': 'binSubBrand',
  'sub card type': 'subCardType',
  'issuing bank name': 'issuingBank',
  'iso country': 'isoCountry',
  currency: 'currency',
  walletamount: 'walletAmount',
  walletcurrency: 'walletCurrency',
  "card holder's name": 'cardHolderName',
  'card holders name': 'cardHolderName',
  'customer email': 'customerEmail',
  'transaction country': 'transactionCountry',
  'auth amount': 'authAmount',
  'captured amount': 'capturedAmount',
  'refund amount': 'refundAmount',
  'chargeback amount': 'chargebackAmount',
  'payout amount': 'payoutAmount',
  'first six': 'firstSix',
  'last four': 'lastFour',
  rrn: 'rrn',
  arn: 'arn',
  'authorization code': 'authCode',
  status: 'status',
  reason: 'reason',
  remark: 'remark',
  'customer ip': 'customerIp',
  'success time stamp': 'successTimeStamp',
  'failure time stamp': 'failureTimeStamp',
  'refund time stamp': 'refundTimeStamp',
  'payout time stamp': 'payoutTimeStamp',
  'chargeback time stamp': 'chargebackTimeStamp',
  'last update date(mm/dd/yyyy)': 'lastUpdateDate',
  'last update date': 'lastUpdateDate',
};

function normalizeHeader(h: string): string {
  return String(h ?? '')
    .replace(/^\uFEFF/, '') // strip BOM
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

/** Clean a cell value: trim, strip Excel text-guard apostrophe, treat "-" as empty. */
function clean(v: unknown): string {
  let s = String(v ?? '').trim();
  if (s.startsWith("'")) s = s.slice(1);
  s = s.trim();
  if (s === '-' || s === '') return '';
  return s;
}

function toNumber(v: string): number | null {
  if (!v) return null;
  const n = parseFloat(v.replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
}

/** Parse the first data row of an array-of-arrays grid into a keyed record. */
function rowsToTransaction(rows: string[][]): {
  tx: ParsedTransaction;
  warnings: string[];
} {
  const warnings: string[] = [];
  if (!rows.length) return { tx: {}, warnings: ['File is empty'] };

  let header = rows[0];
  let dataRows = rows.slice(1);

  // Some XLSX exports keep the whole delimited line in a single cell — re-split.
  if (header.length <= 1) {
    const line = String(header[0] ?? '');
    const delim = line.includes(';') ? ';' : ',';
    header = splitDelimited(line, delim);
    dataRows = dataRows.map((r) => splitDelimited(String(r[0] ?? ''), delim));
  }

  const keys = header.map((h) => HEADER_MAP[normalizeHeader(h)] || null);

  const firstData = dataRows.find((r) => r.some((c) => clean(c) !== ''));
  if (!firstData) {
    warnings.push('No data rows found');
    return { tx: {}, warnings };
  }

  const tx: ParsedTransaction = {};
  keys.forEach((key, i) => {
    if (!key) return;
    tx[key] = clean(firstData[i]);
  });
  return { tx, warnings };
}

/** Delimited-line splitter that respects double quotes. */
function splitDelimited(line: string, delim: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delim && !inQuotes) {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

function parseCsv(text: string): string[][] {
  const clean = text.replace(/^\uFEFF/, '');
  const lines = clean.split(/\r?\n/).filter((l) => l.trim() !== '');
  if (!lines.length) return [];
  // Detect delimiter from the header line.
  const head = lines[0];
  const delim = (head.match(/;/g) || []).length >= (head.match(/,/g) || []).length
    ? ';'
    : ',';
  return lines.map((l) => splitDelimited(l, delim));
}

function parseXlsx(buffer: Buffer): string[][] {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json<string[]>(sheet, {
    header: 1,
    raw: false,
    defval: '',
    blankrows: false,
  });
}

/** Split a "David Jones" style name into first / last. */
function splitName(full: string): { firstName: string; lastName: string } {
  const parts = full.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

/** Normalize a transaction date to YYYY-MM-DD (handles ISO and MM/DD/YYYY). */
function toIsoDate(raw: string): string {
  const v = clean(raw);
  if (!v) return '';
  // YYYY-MM-DD[ HH:MM]
  const iso = v.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  // MM/DD/YYYY
  const us = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (us) {
    const mm = us[1].padStart(2, '0');
    const dd = us[2].padStart(2, '0');
    return `${us[3]}-${mm}-${dd}`;
  }
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
}

/** Parse plan hints from an order description like "1-Step Challenge - €30K 30000 Account". */
function parsePlanHint(desc: string): {
  challengeType: string | null;
  accountSize: number | null;
} {
  const d = (desc || '').toLowerCase();
  let challengeType: string | null = null;
  if (/(^|[^0-9])1\s*-?\s*step|one[\s-]?step|one[\s-]?phase|1\s*phase/.test(d)) {
    challengeType = 'one_phase';
  } else if (
    /(^|[^0-9])2\s*-?\s*step|two[\s-]?step|two[\s-]?phase|2\s*phase/.test(d)
  ) {
    challengeType = 'two_phase';
  }

  let accountSize: number | null = null;
  // Prefer a plain integer >= 1000 (e.g. "30000").
  const plain = desc.match(/\b(\d{4,7})\b/);
  if (plain) {
    accountSize = parseInt(plain[1], 10);
  } else {
    // Fall back to "30K" / "€30k" notation.
    const k = desc.match(/(\d+(?:\.\d+)?)\s*[kK]\b/);
    if (k) accountSize = Math.round(parseFloat(k[1]) * 1000);
  }
  return { challengeType, accountSize };
}

export function mapUpload(
  buffer: Buffer,
  filename: string,
  mimetype: string,
): MappedUpload {
  const isXlsx =
    /\.xlsx?$/i.test(filename) ||
    /sheet|excel|officedocument/i.test(mimetype || '');

  const rows = isXlsx ? parseXlsx(buffer) : parseCsv(buffer.toString('utf-8'));
  const { tx, warnings } = rowsToTransaction(rows);

  const name = splitName(tx.cardHolderName || '');
  const planHint = parsePlanHint(tx.orderDescription || '');
  const amount = toNumber(tx.capturedAmount) ?? toNumber(tx.authAmount);

  if (!tx.customerEmail) warnings.push('No customer email found in file');
  if (planHint.accountSize == null)
    warnings.push('Could not determine account size from order description');

  return {
    fields: {
      email: tx.customerEmail || '',
      firstName: name.firstName,
      lastName: name.lastName,
      country: tx.isoCountry || tx.transactionCountry || '',
      currency: tx.currency || '',
      amountPaid: amount,
      cardBrand: tx.paymentBrand || '',
      cardLast4: tx.lastFour || '',
      registrationDate: toIsoDate(tx.transactionDate),
      ipAddress: tx.customerIp || '',
    },
    planHint,
    transaction: tx,
    warnings,
  };
}
