import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, Lock, AlertTriangle } from 'lucide-react';
import { getQuickLinkSummary, chargeQuickLink } from '@/api/payments';

// QuickLinkCheckout
// ─────────────────
// Stripped, chrome-free payment page for admin-assisted one-shot URLs
// (QuickLink). Routed at /q/<slug>, mounted OUTSIDE the public Layout
// wrapper so there is no site header/footer/nav.
//
// Customer enters ONLY:
//   - Card number
//   - Expiry MM/YY
//   - CVV
//   - Cardholder name
//   - T&C checkbox
// Email, phone, country, city, address, postal — all come from the link
// row on the backend (admin filled them at creation time).

// ── Card helpers ─────────────────────────────────────────────────────────
const detectBrand = (num) => {
  const s = (num || '').replace(/\D/g, '');
  if (/^4/.test(s)) return 'VISA';
  if (/^(5[1-5]|2[2-7])/.test(s)) return 'MC';
  if (/^3[47]/.test(s)) return 'AMEX';
  if (/^6(?:011|5)/.test(s)) return 'DISCOVER';
  return '';
};

const luhnValid = (num) => {
  const s = (num || '').replace(/\D/g, '');
  if (s.length < 13 || s.length > 19) return false;
  let sum = 0;
  let alt = false;
  for (let i = s.length - 1; i >= 0; i--) {
    let n = parseInt(s[i], 10);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
};

const formatCardNumber = (val) =>
  (val || '').replace(/\D/g, '').slice(0, 19).replace(/(\d{4})(?=\d)/g, '$1 ');

const formatExpiry = (val) => {
  const digits = (val || '').replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
};

const formatPriceWithCurrency = (amount, currency) => {
  const num = Number(amount || 0);
  try {
    return new Intl.NumberFormat('en-IE', {
      style: 'currency',
      currency: currency || 'EUR',
      maximumFractionDigits: 2,
    }).format(num);
  } catch {
    return `${currency || ''} ${num.toFixed(2)}`.trim();
  }
};

const INITIAL_FORM = {
  // Billing — collected from the customer on this page. Admin already
  // pre-filled email + phone + country on the link.
  firstName: '',
  lastName: '',
  address: '',
  city: '',
  state: '',
  postalCode: '',
  // Card
  cardholderName: '',
  cardNumber: '',
  expiry: '',
  cvv: '',
};

export default function QuickLinkCheckout() {
  const { slug } = useParams();
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [agreedTerms, setAgreedTerms] = useState(false);

  const {
    data: linkSummary,
    isLoading: loadingLink,
    isError: linkError,
  } = useQuery({
    queryKey: ['quick-link-summary', slug],
    queryFn: () => getQuickLinkSummary(slug),
    enabled: !!slug,
    retry: 0,
  });

  const inactive = linkSummary && linkSummary.active === false;

  const chargeMutation = useMutation({
    mutationFn: (payload) => chargeQuickLink(slug, payload),
    onSuccess: (res) => {
      if (res?.status === 'succeeded') {
        window.location.href = '/pay/success';
      } else if (res?.status === 'requires_action' && res.redirectUrl) {
        window.location.href = res.redirectUrl;
      } else {
        toast.error(res?.message || 'Payment was not completed.');
      }
    },
    onError: (err) => {
      toast.error(err?.message || 'Payment failed. Please try again.');
    },
  });

  const updateField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const next = {};
    // Billing
    if (!form.firstName.trim()) next.firstName = 'First name is required';
    if (!form.lastName.trim()) next.lastName = 'Last name is required';
    if (!form.address.trim() || form.address.trim().length < 4)
      next.address = 'Address is required';
    if (!form.city.trim()) next.city = 'City is required';
    if (!form.postalCode.trim()) next.postalCode = 'Postal code is required';
    // Card
    if (!form.cardholderName.trim() || form.cardholderName.trim().length < 2)
      next.cardholderName = 'Cardholder name is required';
    const digits = (form.cardNumber || '').replace(/\D/g, '');
    if (!digits) next.cardNumber = 'Card number is required';
    else if (digits.length < 13 || !luhnValid(digits))
      next.cardNumber = 'Card number is invalid';
    const [mm, yy] = (form.expiry || '').split('/');
    if (!mm || !yy || mm.length !== 2 || yy.length !== 2)
      next.expiry = 'Expiry must be MM/YY';
    else {
      const m = parseInt(mm, 10);
      const y = parseInt(yy, 10);
      const exp = new Date(2000 + y, m, 0, 23, 59, 59);
      if (Number.isNaN(m) || m < 1 || m > 12) next.expiry = 'Invalid month';
      else if (exp < new Date()) next.expiry = 'Card has expired';
    }
    if (!form.cvv || form.cvv.length < 3) next.cvv = 'CVV must be 3-4 digits';
    if (!agreedTerms) next.agreedTerms = 'You must accept the T&Cs';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!linkSummary || inactive) return;
    if (!validate()) return;
    const [mm, yy] = (form.expiry || '').split('/');
    chargeMutation.mutate({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      state: form.state.trim() || undefined,
      postalCode: form.postalCode.trim(),
      card: {
        number: form.cardNumber.replace(/\s+/g, ''),
        expiryMonth: mm,
        expiryYear: `20${yy}`,
        cvv: form.cvv,
        holder: form.cardholderName.trim(),
        brand: detectBrand(form.cardNumber),
      },
    });
  };

  const priceLabel = useMemo(() => {
    if (!linkSummary) return '';
    return formatPriceWithCurrency(linkSummary.amount, linkSummary.currency);
  }, [linkSummary]);

  if (loadingLink) {
    return (
      <Shell>
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        </div>
      </Shell>
    );
  }

  if (linkError || !linkSummary || inactive) {
    return (
      <Shell>
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-10 text-center">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h1 className="text-lg font-semibold text-slate-900 mb-1">
            {inactive ? 'Link no longer active' : 'Payment link not found'}
          </h1>
          <p className="text-sm text-slate-500">
            {inactive
              ? 'This payment link has already been used or has been deactivated. Please contact the merchant for a new one.'
              : 'We could not find the payment link you opened. Please check the URL or contact the merchant.'}
          </p>
        </div>
      </Shell>
    );
  }

  const inputClass =
    'w-full rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20';
  const errInputClass = 'border-red-400 focus:border-red-500 focus:ring-red-500/20';

  return (
    <Shell>
      <form
        onSubmit={handleSubmit}
        className="max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
        autoComplete="off"
      >
        {/* Order summary strip — only the total. */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <span className="text-sm uppercase tracking-wider text-slate-300">
            Order summary
          </span>
          <span className="text-xl font-extrabold">Total {priceLabel}</span>
        </div>

        <div className="px-5 py-5 space-y-4">
          {/* ── Billing details ────────────────────────────────────── */}
          <div className="flex items-center gap-2 text-slate-700 text-sm font-semibold">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100">
              👤
            </span>
            Your details
          </div>

          {/* First + Last name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">First name</label>
              <input
                type="text"
                autoComplete="given-name"
                value={form.firstName}
                onChange={(e) => updateField('firstName', e.target.value)}
                className={`${inputClass} ${errors.firstName ? errInputClass : ''}`}
                placeholder="John"
              />
              {errors.firstName && (
                <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>
              )}
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Last name</label>
              <input
                type="text"
                autoComplete="family-name"
                value={form.lastName}
                onChange={(e) => updateField('lastName', e.target.value)}
                className={`${inputClass} ${errors.lastName ? errInputClass : ''}`}
                placeholder="Doe"
              />
              {errors.lastName && (
                <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>
              )}
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs text-slate-500 mb-1">Billing address</label>
            <input
              type="text"
              autoComplete="street-address"
              value={form.address}
              onChange={(e) => updateField('address', e.target.value)}
              className={`${inputClass} ${errors.address ? errInputClass : ''}`}
              placeholder="Street address"
            />
            {errors.address && (
              <p className="text-xs text-red-500 mt-1">{errors.address}</p>
            )}
          </div>

          {/* City + State + Postal */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">City</label>
              <input
                type="text"
                autoComplete="address-level2"
                value={form.city}
                onChange={(e) => updateField('city', e.target.value)}
                className={`${inputClass} ${errors.city ? errInputClass : ''}`}
              />
              {errors.city && (
                <p className="text-xs text-red-500 mt-1">{errors.city}</p>
              )}
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">
                State <span className="text-slate-400">(opt)</span>
              </label>
              <input
                type="text"
                autoComplete="address-level1"
                value={form.state}
                onChange={(e) => updateField('state', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Postal</label>
              <input
                type="text"
                autoComplete="postal-code"
                value={form.postalCode}
                onChange={(e) => updateField('postalCode', e.target.value)}
                className={`${inputClass} ${errors.postalCode ? errInputClass : ''}`}
              />
              {errors.postalCode && (
                <p className="text-xs text-red-500 mt-1">{errors.postalCode}</p>
              )}
            </div>
          </div>

          {/* ── Card ──────────────────────────────────────────────── */}
          <div className="flex items-center gap-2 text-slate-700 text-sm font-semibold pt-2 border-t border-slate-100">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100">
              💳
            </span>
            Pay by card
          </div>

          {/* Card Number */}
          <div>
            <label className="block text-xs text-slate-500 mb-1">Card number</label>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="cc-number"
              value={form.cardNumber}
              onChange={(e) =>
                updateField('cardNumber', formatCardNumber(e.target.value))
              }
              className={`${inputClass} ${errors.cardNumber ? errInputClass : ''}`}
              placeholder="1234 1234 1234 1234"
            />
            {errors.cardNumber && (
              <p className="text-xs text-red-500 mt-1">{errors.cardNumber}</p>
            )}
          </div>

          {/* Expiry + CVV */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Expiry</label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="cc-exp"
                value={form.expiry}
                onChange={(e) => updateField('expiry', formatExpiry(e.target.value))}
                className={`${inputClass} ${errors.expiry ? errInputClass : ''}`}
                placeholder="MM/YY"
                maxLength={5}
              />
              {errors.expiry && (
                <p className="text-xs text-red-500 mt-1">{errors.expiry}</p>
              )}
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">CVV</label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="cc-csc"
                value={form.cvv}
                onChange={(e) =>
                  updateField(
                    'cvv',
                    e.target.value.replace(/\D/g, '').slice(0, 4),
                  )
                }
                className={`${inputClass} ${errors.cvv ? errInputClass : ''}`}
                placeholder="123"
              />
              {errors.cvv && <p className="text-xs text-red-500 mt-1">{errors.cvv}</p>}
            </div>
          </div>

          {/* Cardholder name */}
          <div>
            <label className="block text-xs text-slate-500 mb-1">Name on card</label>
            <input
              type="text"
              autoComplete="cc-name"
              value={form.cardholderName}
              onChange={(e) => updateField('cardholderName', e.target.value)}
              className={`${inputClass} ${errors.cardholderName ? errInputClass : ''}`}
              placeholder="As it appears on the card"
            />
            {errors.cardholderName && (
              <p className="text-xs text-red-500 mt-1">{errors.cardholderName}</p>
            )}
          </div>

          {/* T&C */}
          <label className="flex items-start gap-2 text-xs text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={agreedTerms}
              onChange={(e) => setAgreedTerms(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              I agree to the{' '}
              <a
                href="/Terms"
                target="_blank"
                rel="noreferrer"
                className="text-amber-600 underline"
              >
                Terms &amp; Conditions
              </a>
              .
            </span>
          </label>
          {errors.agreedTerms && (
            <p className="text-xs text-red-500 -mt-2">{errors.agreedTerms}</p>
          )}

          {/* Pay button */}
          <button
            type="submit"
            disabled={chargeMutation.isPending}
            className="w-full rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-60 disabled:cursor-not-allowed text-slate-900 font-bold py-3 text-sm transition-colors flex items-center justify-center gap-2"
          >
            {chargeMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing…
              </>
            ) : (
              <>Pay {priceLabel}</>
            )}
          </button>

          <p className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1.5 pt-1">
            <Lock className="w-3 h-3" />
            Secured payment · Visa &amp; Mastercard
          </p>
        </div>
      </form>
    </Shell>
  );
}

// Minimal shell — PROPCAPITALS wordmark only. No nav, no footer.
function Shell({ children }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="py-5 px-4 flex justify-center">
        <span className="font-extrabold text-lg tracking-wider text-slate-900">
          PROP<span className="text-amber-500">CAPITALS</span>
        </span>
      </header>
      <main className="flex-1 px-4 pb-10">{children}</main>
    </div>
  );
}
